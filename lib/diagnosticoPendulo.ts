/**
 * Catálogo de diagnósticos del péndulo (dsPic + bridge + medidas).
 * IDS es un latido, no un fallo; RESETED / STOPED / ERR1 / período
 * imposible se clasifican con causa y comando de solución para Admin.
 */

export type NivelDiagnostico = 'info' | 'aviso' | 'error'

export type CodigoDiagnostico =
  | 'ids_latido'
  | 'reseted'
  | 'stoped'
  | 'started'
  | 'err1_laser'
  | 'err2_microswitch'
  | 'periodo_invalido'
  | 'sin_senal'
  | 'bridge_pendiente'
  | 'bridge_mqtt'
  | 'practica_ok'

export type EstadoFirmware = 'RESETED' | 'STOPED' | 'STARTED' | 'ERR1' | 'ERR2'

export type EstadoComandoDiag = 'pendiente' | 'enviado' | 'error' | null

export interface DiagnosticoPendulo {
  codigo: CodigoDiagnostico
  nivel: NivelDiagnostico
  titulo: string
  resumen: string
  causa: string
  solucion: string
  comando: string | null
}

export interface EntradaDiagnostico {
  ultimoRaw?: string | null
  estadoDispositivo?: string | null
  estado?: string | null
  errorCodigo?: number | null
  errorMensaje?: string | null
  periodo?: number | null
  gravedad?: number | null
  medicionInvalida?: boolean | null
  segundosDesdeUltimoDato?: number | null
  estadoComando?: EstadoComandoDiag
  errorComando?: string | null
  umbralSinSenal?: number
}

export interface EstadoFirmwareParseado {
  idAparato: string | null
  estadoFirmware: EstadoFirmware
}

export const PERIODO_MIN_S = 1.5
export const PERIODO_MAX_S = 4.0
export const GRAVEDAD_MIN = 8
export const GRAVEDAD_MAX = 12
export const UMBRAL_SIN_SENAL_S = 10

const SEPARADOR_FIRMWARE = String.raw`[\s\u2192+>\-]+`

const REGEX_IDS = new RegExp(
  `^ids${SEPARADOR_FIRMWARE}(\\S+?)${SEPARADOR_FIRMWARE}(reseted|stoped|stopped|started|reset)\\s*$`,
  'i',
)

const REGEX_ERR = /^err(?:or)?\s*[:=]?\s*([12])\b/i

const COMANDO_INICIAR = [
  `printf '%s\\n' '{"accion":"iniciar","oscilaciones":5,"distanciaMuro":5}' > /tmp/cmd.json`,
  'mosquitto_pub -h localhost -p 1883 -u pendulo_u -P pendulo_u -t pendulo/comando -f /tmp/cmd.json',
].join(' && ')

const COMANDO_BRIDGE = 'sudo systemctl restart pendulo-bridge && journalctl -u pendulo-bridge -f'

const CATALOGO: Record<CodigoDiagnostico, Omit<DiagnosticoPendulo, 'codigo'>> = {
  ids_latido: {
    nivel: 'info',
    titulo: 'Latido IDS',
    resumen: 'El microcontrolador responde al comando ids (comunicación serial viva).',
    causa: 'Node-RED pregunta ids cada ~2 s. No es un fallo.',
    solucion: 'No hace falta actuar. Mira la tercera palabra (RESETED / STOPED / STARTED) para el estado real.',
    comando: null,
  },
  reseted: {
    nivel: 'aviso',
    titulo: 'Péndulo en RESET',
    resumen: 'El dsPic está en RESETED: vivo, pero sin experimento configurado.',
    causa: 'Reinicio, corte de luz o comando rst. No es descalibración de longitud.',
    solucion: 'Enviar cfg + str (Iniciar práctica en la web, o el comando MQTT de abajo). No uses minicom mientras Node-RED tiene el serial.',
    comando: COMANDO_INICIAR,
  },
  stoped: {
    nivel: 'info',
    titulo: 'Péndulo detenido (STOPED)',
    resumen: 'Idle sano: la práctica terminó o el aparato espera un nuevo cfg.',
    causa: 'Tras END el firmware vuelve a STOPED. El poll ids lo reporta cada ~2 s.',
    solucion: 'Nada, si no hay una práctica en curso. Para medir otra vez, inicia la práctica.',
    comando: COMANDO_INICIAR,
  },
  started: {
    nivel: 'info',
    titulo: 'Péndulo en STARTED',
    resumen: 'El dsPic está ejecutando una práctica.',
    causa: 'Se recibió str tras un cfg válido.',
    solucion: 'Espera las muestras. Si no llegan datos numéricos, revisa láser y Node-RED.',
    comando: null,
  },
  err1_laser: {
    nivel: 'error',
    titulo: 'ERR1 — láser / fotocompuerta',
    resumen: 'Fallo de alineación o detección del láser (emisor/receptor).',
    causa: 'Haz fuera del orificio, foco > 1 mm, luz ambiente o cable suelto.',
    solucion: 'Alinear el láser al fotodiodo, bajar luz directa y en Node-RED enviar test laser. No recalibrar la longitud todavía.',
    comando: 'test laser',
  },
  err2_microswitch: {
    nivel: 'error',
    titulo: 'ERR2 — microswitch',
    resumen: 'El final de carrera de la pala no responde bien.',
    causa: 'Microswitch sucio, desconectado o pala que no llega al origen.',
    solucion: 'Comprobar el pulsador en el origen y los pines del DB25. Luego go to origin 2 2 por serial (vía Node-RED, no minicom).',
    comando: 'go to origin 2 2',
  },
  periodo_invalido: {
    nivel: 'error',
    titulo: 'Medición imposible',
    resumen: 'El período o la gravedad no corresponden a un péndulo de ~2,7 m.',
    causa: 'La fotocompuerta dispara en falso (luz, desalineación). El firmware calcula g = 4π²L/T²: si T es milisegundos, g sale en millones.',
    solucion: 'No recalibrar longitud ni polea. Revisar láser, foco < 1 mm y luz ambiente. En Node-RED: test laser.',
    comando: 'test laser',
  },
  sin_senal: {
    nivel: 'aviso',
    titulo: 'Sin señal reciente',
    resumen: 'Firestore no recibe telemetría nueva del bridge.',
    causa: 'Bridge parado, Mosquitto caído, Node-RED sin serial, o el péndulo apagado.',
    solucion: 'En la Raspberry: estado del bridge y logs. Confirma que Node-RED publica pendulo/mediciones o pendulo/estado.',
    comando: COMANDO_BRIDGE,
  },
  bridge_pendiente: {
    nivel: 'aviso',
    titulo: 'Comando sin confirmar',
    resumen: 'El documento en pendulo_comandos sigue pendiente: el bridge no lo marcó como enviado.',
    causa: 'Listener de Firestore colgado, o el servicio systemd “running” pero sin procesar.',
    solucion: 'Reinicia el bridge y mira journalctl. Si el péndulo sí se movió, el aviso en la web era un falso positivo.',
    comando: COMANDO_BRIDGE,
  },
  bridge_mqtt: {
    nivel: 'error',
    titulo: 'El bridge no pudo publicar MQTT',
    resumen: 'El comando se rechazó al publicarlo hacia Mosquitto.',
    causa: 'Broker caído, credenciales MQTT o cliente desconectado.',
    solucion: 'Revisar Mosquitto y MQTT_USERNAME/MQTT_PASSWORD en el .env del bridge. Reiniciar el servicio.',
    comando: COMANDO_BRIDGE,
  },
  practica_ok: {
    nivel: 'info',
    titulo: 'Práctica en curso o datos coherentes',
    resumen: 'Hay telemetría reciente con período y gravedad en rango esperado.',
    causa: 'El aparato está midiendo o acaba de medir con valores físicos plausibles.',
    solucion: 'Ninguna.',
    comando: null,
  },
}

function construir(codigo: CodigoDiagnostico, extra?: Partial<DiagnosticoPendulo>): DiagnosticoPendulo {
  return { codigo, ...CATALOGO[codigo], ...extra }
}

/** Interpreta IDS→WPH→RESETED, ERR1, STOPED, etc. */
export function parsearEstadoFirmware(raw: string | null | undefined): EstadoFirmwareParseado | null {
  if (!raw) return null
  const texto = raw.trim()

  const ids = REGEX_IDS.exec(texto)
  if (ids) {
    const idAparato = ids[1]
    const token = ids[2].toUpperCase()
    let estadoFirmware: EstadoFirmware = 'STOPED'
    if (token === 'RESETED' || token === 'RESET') estadoFirmware = 'RESETED'
    else if (token === 'STARTED') estadoFirmware = 'STARTED'
    else estadoFirmware = 'STOPED'
    return { idAparato, estadoFirmware }
  }

  const err = REGEX_ERR.exec(texto)
  if (err) {
    return {
      idAparato: null,
      estadoFirmware: err[1] === '2' ? 'ERR2' : 'ERR1',
    }
  }

  return null
}

export function esMedicionInvalida(periodo?: number | null, gravedad?: number | null): boolean {
  if (typeof periodo === 'number' && !Number.isNaN(periodo)) {
    if (periodo < PERIODO_MIN_S || periodo > PERIODO_MAX_S) return true
  }
  if (typeof gravedad === 'number' && !Number.isNaN(gravedad)) {
    if (gravedad < GRAVEDAD_MIN || gravedad > GRAVEDAD_MAX) return true
  }
  return false
}

function haySenalReciente(segundos: number | null | undefined, umbral: number): boolean {
  if (segundos === null || segundos === undefined) return false
  return segundos < umbral
}

/**
 * Elige el diagnóstico principal. Prioridad: hardware → medida imposible →
 * RESET → comandos del bridge → sin señal → estados idle/ok.
 */
export function diagnosticarPendulo(entrada: EntradaDiagnostico): DiagnosticoPendulo {
  const umbral = entrada.umbralSinSenal ?? UMBRAL_SIN_SENAL_S
  const firmware = parsearEstadoFirmware(entrada.ultimoRaw)
  const reciente = haySenalReciente(entrada.segundosDesdeUltimoDato, umbral)

  const codigoError =
    entrada.errorCodigo === 1 ||
    entrada.errorCodigo === 2
      ? entrada.errorCodigo
      : firmware?.estadoFirmware === 'ERR1'
        ? 1
        : firmware?.estadoFirmware === 'ERR2'
          ? 2
          : null

  if (codigoError === 1) {
    return construir('err1_laser', {
      resumen: entrada.errorMensaje || CATALOGO.err1_laser.resumen,
    })
  }
  if (codigoError === 2) {
    return construir('err2_microswitch', {
      resumen: entrada.errorMensaje || CATALOGO.err2_microswitch.resumen,
    })
  }
  if (entrada.estado === 'error' && !codigoError) {
    return construir('err1_laser', {
      titulo: 'Error de hardware',
      resumen: entrada.errorMensaje || 'El péndulo reportó un error de hardware.',
    })
  }

  const medidaMala =
    entrada.medicionInvalida === true || esMedicionInvalida(entrada.periodo, entrada.gravedad)

  if (reciente && medidaMala) {
    return construir('periodo_invalido')
  }

  const estadoFw = firmware?.estadoFirmware
  const dispositivo = (entrada.estadoDispositivo || '').toLowerCase()

  if (reciente && (estadoFw === 'RESETED' || dispositivo === 'reseted')) {
    return construir('reseted')
  }

  if (entrada.estadoComando === 'error') {
    return construir('bridge_mqtt', {
      resumen: entrada.errorComando
        ? `El bridge no pudo publicar el comando: ${entrada.errorComando}`
        : CATALOGO.bridge_mqtt.resumen,
    })
  }

  if (entrada.estadoComando === 'pendiente' && !reciente) {
    return construir('bridge_pendiente')
  }

  if (!reciente) {
    return construir('sin_senal')
  }

  if (estadoFw === 'STARTED' || dispositivo === 'iniciado' || dispositivo === 'recibiendo_datos' || entrada.estado === 'en_progreso') {
    if (medidaMala) return construir('periodo_invalido')
    return construir('practica_ok')
  }

  if (estadoFw === 'STOPED' || dispositivo === 'detenido' || entrada.estado === 'finalizado') {
    return construir('stoped')
  }

  if (REGEX_IDS.test((entrada.ultimoRaw || '').trim()) && !estadoFw) {
    return construir('ids_latido')
  }

  return construir('practica_ok')
}

/** Texto corto para el estudiante (sin comandos SSH). */
export function resumenEstudiante(diagnostico: DiagnosticoPendulo): string {
  switch (diagnostico.codigo) {
    case 'reseted':
      return 'El péndulo está en reposo (RESET). Inicia la práctica o avisa al docente.'
    case 'periodo_invalido':
      return 'Las mediciones no son válidas. El péndulo puede estar desalineado; avisa al docente.'
    case 'err1_laser':
      return 'Hay un problema con el láser. Avisa al docente.'
    case 'err2_microswitch':
      return 'Hay un problema con el sensor de origen. Avisa al docente.'
    case 'bridge_pendiente':
      return 'No se confirmó el arranque. Espera o avisa al docente.'
    case 'bridge_mqtt':
      return 'No se pudo enviar el comando. Avisa al docente.'
    case 'sin_senal':
      return 'Sin señal reciente del péndulo. Avisa al docente si persiste.'
    default:
      return diagnostico.resumen
  }
}
