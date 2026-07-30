/**
 * Diagnóstico en consola del navegador para la vista Tiempo Real.
 * Prefijo unificado: [Pendulo] [Categoría] mensaje
 *
 * Abre DevTools → Console y filtra por "Pendulo" para ver solo estos logs.
 */

type DiagCategory =
  | 'Auth'
  | 'Firestore'
  | 'Bridge'
  | 'Conexión'
  | 'Reserva'
  | 'Comando'
  | 'Hardware'
  | 'Variables'
  | 'Sistema'

type DiagLevel = 'info' | 'warn' | 'error'

const PREFIX = '[Pendulo]'

const FIREBASE_ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const

function log(
  level: DiagLevel,
  category: DiagCategory,
  message: string,
  details?: Record<string, unknown>
) {
  const tag = `${PREFIX} [${category}]`
  const hasDetails = details && Object.keys(details).length > 0

  if (level === 'error') {
    hasDetails ? console.error(tag, message, details) : console.error(tag, message)
    return
  }
  if (level === 'warn') {
    hasDetails ? console.warn(tag, message, details) : console.warn(tag, message)
    return
  }
  hasDetails ? console.info(tag, message, details) : console.info(tag, message)
}

export const penduloDiag = {
  info: (category: DiagCategory, message: string, details?: Record<string, unknown>) =>
    log('info', category, message, details),
  warn: (category: DiagCategory, message: string, details?: Record<string, unknown>) =>
    log('warn', category, message, details),
  error: (category: DiagCategory, message: string, details?: Record<string, unknown>) =>
    log('error', category, message, details),
}

/** Comprueba que las variables NEXT_PUBLIC_FIREBASE_* estén definidas. */
export function checkFirebaseEnv(): { ok: boolean; missing: string[] } {
  const missing = FIREBASE_ENV_KEYS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    penduloDiag.error('Variables', 'Faltan variables de entorno de Firebase (.env.local)', {
      missing,
      hint: 'Copia .env.example y reinicia el servidor de desarrollo (npm run dev).',
    })
  } else {
    penduloDiag.info('Variables', 'Firebase configurado correctamente', {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    })
  }
  return { ok: missing.length === 0, missing: [...missing] }
}

/** Resumen inicial al entrar a Tiempo Real. */
export function logSessionStart(context: {
  penduloId: string
  defaultPenduloId: string
  userId: string | null
  userEmail: string | null
}) {
  penduloDiag.info('Sistema', 'Vista Tiempo Real iniciada', {
    penduloId: context.penduloId,
    defaultPenduloId: context.defaultPenduloId,
    usuario: context.userId ?? 'no autenticado',
    email: context.userEmail ?? '—',
    bridgeEsperado: 'pendulo-bridge en Raspberry Pi (systemd)',
    topicComando: 'pendulo/comando',
    topicMediciones: 'pendulo/mediciones',
    filtroConsola: 'Escribe "Pendulo" en el filtro de DevTools → Console',
  })
}

export type SignalState = 'sin_datos' | 'en_vivo' | 'sin_senal' | 'finalizado' | 'error_hw'

/** Traduce segundosDesdeUltimoDato a un estado de señal legible. */
export function resolveSignalState(input: {
  segundosDesdeUltimoDato: number | null
  practicaFinalizada: boolean
  practicaConError: boolean
  umbralSinSenal: number
}): SignalState {
  if (input.practicaConError) return 'error_hw'
  if (input.practicaFinalizada) return 'finalizado'
  if (input.segundosDesdeUltimoDato === null) return 'sin_datos'
  if (input.segundosDesdeUltimoDato >= input.umbralSinSenal) return 'sin_senal'
  return 'en_vivo'
}

const SIGNAL_MESSAGES: Record<SignalState, { level: DiagLevel; message: string }> = {
  sin_datos: {
    level: 'warn',
    message:
      'Sin telemetría previa en Firestore. El bridge puede estar apagado o el péndulo nunca transmitió datos.',
  },
  en_vivo: {
    level: 'info',
    message: 'Señal en vivo: llegando telemetría del péndulo vía bridge → Firestore.',
  },
  sin_senal: {
    level: 'warn',
    message:
      'Sin uso reciente. Posibles causas: bridge caído, broker MQTT caído, péndulo detenido o Node-RED desconectado.',
  },
  finalizado: {
    level: 'info',
    message: 'Práctica finalizada (estado "finalizado" en pendulo_data).',
  },
  error_hw: {
    level: 'error',
    message: 'Error de hardware reportado por el péndulo (láser/microswitch).',
  },
}

/** Emite log solo cuando cambia el estado de señal (evita spam cada segundo). */
export function logSignalChange(
  prev: SignalState | null,
  next: SignalState,
  details: Record<string, unknown>
) {
  if (prev === next) return
  const { level, message } = SIGNAL_MESSAGES[next]
  log(level, 'Conexión', message, details)
}

export function logBridgeCommandState(
  estado: 'pendiente' | 'enviado' | 'error' | 'timeout',
  details: Record<string, unknown>
) {
  switch (estado) {
    case 'pendiente':
      penduloDiag.info('Bridge', 'Comando creado en Firestore (estado: pendiente). Esperando pendulo-bridge…', details)
      break
    case 'enviado':
      penduloDiag.info('Bridge', 'Bridge confirmó el comando (estado: enviado). Node-RED debería recibir cfg/str.', details)
      break
    case 'error':
      penduloDiag.error('Bridge', 'Fallo al procesar el comando en el bridge o MQTT.', details)
      break
    case 'timeout':
      penduloDiag.error(
        'Bridge',
        'Timeout: el comando sigue pendiente. El servicio systemd puede estar activo pero el listener de Firestore colgado.',
        {
          ...details,
          accionRecomendada: 'sudo systemctl restart pendulo-bridge',
          verificar: 'journalctl -u pendulo-bridge -f',
        }
      )
      break
  }
}
