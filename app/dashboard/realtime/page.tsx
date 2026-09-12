"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Play,
  Download,
  CheckCircle2,
  Loader2,
  WifiOff,
  Gauge,
  AlertTriangle,
} from "lucide-react"
import { useState, useEffect, useRef, type UIEvent } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { CameraStream } from "@/components/camera-stream"
import { useAuth } from "@/hooks/useAuth"
import { usePenduloData, type LecturaPendulo } from "@/hooks/usePenduloData"
import { escucharReservacionesUsuario, iniciarPractica, liberarPractica, completarReservacion, hayControlAjenoVigente } from "@/app/services/reservacionService"
import { escucharEstadoComando, cargarLecturasAnteriores } from "@/app/services/penduloDataService"
import { exportarLecturasUsuario, exportarExcelGeneral, exportarLecturasAdmin } from "@/app/services/lecturasExportService"
import type { Timestamp } from "firebase/firestore"
import {
  checkFirebaseEnv,
  logBridgeCommandState,
  logSessionStart,
  logSignalChange,
  penduloDiag,
  resolveSignalState,
  type SignalState,
} from "@/lib/penduloDiagnostics"
import {
  diagnosticarPendulo,
  resumenEstudiante,
} from "@/lib/diagnosticoPendulo"
import { parametrosCfgHaciaFirmware } from "@/lib/parametrosFirmwarePendulo"

// Debe coincidir con DEFAULT_PENDULO_ID configurado en el bridge (bridge/.env)
const DEFAULT_PENDULO_ID = "UAC-01"
// Umbral para considerar que el péndulo está "en vivo" (sin uso = bridge/broker caído)
const SEGUNDOS_SIN_SENAL = 10

// Límites de seguridad para no dañar el mecanismo físico (láser/microswitch).
// TODO: confirmar con el docente/Yesid los valores exactos seguros del hardware.
const OSCILACIONES_MIN = 1
const OSCILACIONES_MAX = 20
const DISTANCIA_MURO_MIN = 1
const DISTANCIA_MURO_MAX = 20

// Node-RED espera 15 s entre cfg y str (bridge/node-red-command-flow.json).
const SEGUNDOS_CFG_NODE_RED = 15
// Si el comando sigue "pendiente" tras este tiempo, avisamos (el bridge puede
// tener el listener de Firestore colgado aunque systemd diga "running").
const SEGUNDOS_ESPERA_BRIDGE = 30

type EstadoComandoUi = "pendiente" | "enviado" | "error" | null

interface ComandoPenduloDoc {
  id: string
  estado?: "pendiente" | "enviado" | "error"
  errorMsg?: string
  atendidoEn?: Timestamp
  penduloId?: string
  usuarioId?: string
  accion?: string
}

interface Reservacion {
  id: string
  usuario_id: string
  inicio_sesion_reserva: Timestamp
  final_sesion_reserva: Timestamp
  estado: "pending" | "active" | "completed" | "cancelled"
  pendulo_id?: string
}

function toDate(value: Timestamp | Date): Date {
  if (value instanceof Date) return value
  return value?.toDate?.() ?? new Date()
}

function formatNumber(value: unknown, decimals = 2): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "--"
  return value.toFixed(decimals)
}

function toMillis(ts: Timestamp | undefined): number | null {
  const date = ts?.toDate?.()
  return date ? date.getTime() : null
}

function limitarOscilaciones(valor: unknown): number | null {
  if (typeof valor !== "number" || Number.isNaN(valor)) return null
  const entero = Math.round(valor)
  if (entero < OSCILACIONES_MIN || entero > OSCILACIONES_MAX) return null
  return entero
}

interface MetricChartPoint {
  muestra: number
  [key: string]: number | null
}

export default function RealtimePage() {
  const { user, rol } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [estadoComando, setEstadoComando] = useState<EstadoComandoUi>(null)
  const [mensajeComando, setMensajeComando] = useState<string | null>(null)
  const comandoUnsubRef = useRef<(() => void) | null>(null)
  const comandoPendienteRef = useRef(false)
  const comandoTimeoutRef = useRef<number | null>(null)
  const signalStateRef = useRef<SignalState | null>(null)
  const reservaLoggedRef = useRef<boolean | null>(null)
  const finalizadoRef = useRef(false)
  const sessionStartedRef = useRef(false)
  const estadoDispositivoPrevRef = useRef<string | null>(null)
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [oscilaciones, setOscilaciones] = useState(10)
  const [oscilacionesPractica, setOscilacionesPractica] = useState<number | null>(null)
  const [distanciaMuro, setDistanciaMuro] = useState(10)
  const [practicaEnCurso, setPracticaEnCurso] = useState(false)
  const [practicaId, setPracticaId] = useState<string | null>(null)
  const [practicaInicio, setPracticaInicio] = useState<Timestamp | null>(null)
  const [lecturasAnteriores, setLecturasAnteriores] = useState<LecturaPendulo[]>([])
  const [cargandoMasLecturas, setCargandoMasLecturas] = useState(false)
  const [hayMasLecturas, setHayMasLecturas] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [exportandoGeneral, setExportandoGeneral] = useState(false)
  const [arranqueIniciadoEn, setArranqueIniciadoEn] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(() => Date.now())

  // Radix AlertDialog genera IDs distintos en SSR vs cliente; montamos el
  // diálogo solo en el navegador para evitar hydration mismatch.
  useEffect(() => {
    setMounted(true)
    checkFirebaseEnv()
  }, [])

  useEffect(() => {
    return () => {
      comandoUnsubRef.current?.()
      if (comandoTimeoutRef.current !== null) {
        window.clearTimeout(comandoTimeoutRef.current)
      }
    }
  }, [])

  // Reloj de "preparando" mientras llegan cfg → str → CFGOK y las mediciones.
  useEffect(() => {
    if (arranqueIniciadoEn === null) return
    const interval = setInterval(() => setNowTick(Date.now()), 250)
    return () => clearInterval(interval)
  }, [arranqueIniciadoEn])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = (escucharReservacionesUsuario as unknown as (uid: string, cb: (data: Reservacion[]) => void, onErr: (e: Error) => void) => () => void)(
      user.uid,
      (data) => setReservaciones(data),
      (err) => {
        penduloDiag.error('Reserva', 'Error escuchando reservaciones del usuario', {
          usuarioId: user.uid,
          error: err.message,
        })
      }
    )
    return () => unsub()
  }, [user?.uid])

  const ahora = new Date()
  const reservaEnTurno = reservaciones.find((r) => {
    if (r.estado === "cancelled") return false
    const inicio = toDate(r.inicio_sesion_reserva)
    const fin = toDate(r.final_sesion_reserva)
    const enVentana = ahora >= inicio && ahora <= fin
    if (!enVentana) return false
    return r.estado === "pending" || r.estado === "active" || r.estado === "completed"
  })
  const puedeIniciar = !!reservaEnTurno
  const penduloId = reservaEnTurno?.pendulo_id || DEFAULT_PENDULO_ID

  const {
    enVivo,
    lecturas,
    segundosDesdeUltimoDato,
    enviarComando,
    enviandoComando,
    error: errorPendulo,
  } = usePenduloData(penduloId, {
    cantidadLecturas: OSCILACIONES_MAX,
    uid: practicaInicio ? user?.uid ?? null : null,
    practicaInicio,
  })

  const ocupadoPorOtro = hayControlAjenoVigente(enVivo, user?.uid)
  const practicaFinalizada = enVivo?.estado === "finalizado"
  const practicaConError = enVivo?.estado === "error"
  const hayDatosEnVivo =
    !practicaFinalizada && !practicaConError && segundosDesdeUltimoDato !== null && segundosDesdeUltimoDato < SEGUNDOS_SIN_SENAL

  /** Telemetría nueva tras pulsar "Iniciar" (evita marcar listo con datos viejos). */
  const arranqueListo = (() => {
    if (!practicaEnCurso || arranqueIniciadoEn === null || !hayDatosEnVivo) return false
    const actualizadoMs = enVivo?.actualizadoEn?.toDate?.()?.getTime()
    return typeof actualizadoMs === "number" && actualizadoMs >= arranqueIniciadoEn
  })()

  const elapsedArranqueSeg =
    arranqueIniciadoEn !== null ? Math.max(0, (nowTick - arranqueIniciadoEn) / 1000) : 0

  const segundosBloqueoFinalizar =
    arranqueIniciadoEn !== null && !arranqueListo
      ? Math.max(0, Math.ceil(SEGUNDOS_CFG_NODE_RED - elapsedArranqueSeg))
      : 0

  const diagnosticoEstudiante = diagnosticarPendulo({
    ultimoRaw: enVivo?.ultimoRaw,
    estadoDispositivo: enVivo?.estadoDispositivo,
    estado: enVivo?.estado,
    errorCodigo: enVivo?.errorCodigo,
    errorMensaje: enVivo?.errorMensaje,
    periodo: enVivo?.periodo,
    gravedad: enVivo?.gravedad,
    medicionInvalida: enVivo?.medicionInvalida,
    segundosDesdeUltimoDato,
    umbralSinSenal: SEGUNDOS_SIN_SENAL,
  })
  const mostrarAvisoReseted =
    practicaEnCurso && diagnosticoEstudiante.codigo === "reseted"

  // Texto legible de la última señal de confirmación del hardware (handshake
  // serial reenviado por Node-RED vía "pendulo/estado"). Puede no existir
  // todavía si Node-RED no está reenviando estas señales al broker.
  const ESTADO_DISPOSITIVO_LABEL: Record<string, string> = {
    configurando: "cfg recibido (oscilaciones y distancia)",
    configurado: "CFGOK — el péndulo confirmó la configuración",
    iniciando: "str enviado — el péndulo inicia el movimiento",
    iniciado: "Péndulo confirmó el inicio",
    recibiendo_datos: "Péndulo transmitiendo datos",
    finalizado: "Péndulo confirmó el fin de la práctica",
    detenido: "STOPED — péndulo en espera",
    reseted: "Péndulo en RESET (esperando configuración)",
    error_laser: "Error de láser / fotocompuerta",
    error_microswitch: "Error de microswitch",
  }
  const estadoDispositivoLabel = enVivo?.estadoDispositivo
    ? ESTADO_DISPOSITIVO_LABEL[enVivo.estadoDispositivo] ?? null
    : null

  // Limpia el panel de arranque y libera el péndulo cuando termina una práctica
  // (la reserva sigue activa hasta que expiren los 30 min).
  useEffect(() => {
    if (enVivo?.estado === "finalizado" || enVivo?.estado === "error") {
      setPracticaEnCurso(false)
      setArranqueIniciadoEn(null)

      if (
        enVivo?.estado === "finalizado" &&
        reservaEnTurno &&
        user?.uid &&
        practicaId &&
        !finalizadoRef.current
      ) {
        finalizadoRef.current = true
        void liberarPractica({
          reservacionId: reservaEnTurno.id,
          penduloId,
          usuarioId: user.uid,
        }).catch((err) => {
          penduloDiag.error("Reserva", "Error al liberar práctica", {
            error: err instanceof Error ? err.message : String(err),
          })
        })
      }
    }
  }, [enVivo?.estado, reservaEnTurno, user?.uid, practicaId, penduloId])

  // Al expirar la franja de 30 min, cerrar la reservación automáticamente.
  useEffect(() => {
    if (!reservaEnTurno || !user?.uid) return

    const fin = toDate(reservaEnTurno.final_sesion_reserva).getTime()
    const msRestantes = fin - Date.now()
    if (msRestantes <= 0) {
      void completarReservacion({
        reservacionId: reservaEnTurno.id,
        penduloId,
        usuarioId: user.uid,
      })
      return
    }

    const timer = window.setTimeout(() => {
      void completarReservacion({
        reservacionId: reservaEnTurno.id,
        penduloId,
        usuarioId: user.uid,
      })
    }, msRestantes)

    return () => window.clearTimeout(timer)
  }, [reservaEnTurno, user?.uid, penduloId])

  const parametrosValidos =
    oscilaciones >= OSCILACIONES_MIN &&
    oscilaciones <= OSCILACIONES_MAX &&
    distanciaMuro >= DISTANCIA_MURO_MIN &&
    distanciaMuro <= DISTANCIA_MURO_MAX

  // ─── Diagnóstico en consola (DevTools → filtrar "Pendulo") ───────────────
  useEffect(() => {
    if (!mounted || sessionStartedRef.current) return
    sessionStartedRef.current = true
    logSessionStart({
      penduloId,
      defaultPenduloId: DEFAULT_PENDULO_ID,
      userId: user?.uid ?? null,
      userEmail: user?.email ?? null,
    })
  }, [mounted, penduloId, user?.uid, user?.email])

  useEffect(() => {
    if (!mounted) return
    if (user?.uid) {
      penduloDiag.info("Auth", "Usuario autenticado", { uid: user.uid, email: user.email })
    } else {
      penduloDiag.warn("Auth", "Sin sesión activa: los comandos al péndulo estarán bloqueados", {})
    }
  }, [mounted, user?.uid, user?.email])

  useEffect(() => {
    if (!mounted || !user?.uid) return
    if (puedeIniciar === reservaLoggedRef.current) return
    reservaLoggedRef.current = puedeIniciar

    if (puedeIniciar && reservaEnTurno) {
      penduloDiag.info("Reserva", 'Turno activo: botón "Iniciar práctica" habilitado', {
        reservaId: reservaEnTurno.id,
        penduloId: reservaEnTurno.pendulo_id ?? DEFAULT_PENDULO_ID,
        estado: reservaEnTurno.estado,
        inicio: toDate(reservaEnTurno.inicio_sesion_reserva).toISOString(),
        fin: toDate(reservaEnTurno.final_sesion_reserva).toISOString(),
      })
    } else {
      penduloDiag.warn("Reserva", 'Fuera de turno: botón "Iniciar práctica" deshabilitado', {
        reservacionesActivas: reservaciones.filter((r) => r.estado === "pending" || r.estado === "active").length,
        hint: "Crea una reserva cuyo horario incluya el momento actual.",
      })
    }
  }, [mounted, user?.uid, puedeIniciar, reservaEnTurno, reservaciones])

  useEffect(() => {
    if (!mounted || parametrosValidos) return
    penduloDiag.warn("Variables", "Parámetros fuera de rango seguro", {
      oscilaciones,
      rangoOscilaciones: `${OSCILACIONES_MIN}-${OSCILACIONES_MAX}`,
      distanciaMuro,
      rangoDistancia: `${DISTANCIA_MURO_MIN}-${DISTANCIA_MURO_MAX} cm`,
    })
  }, [mounted, parametrosValidos, oscilaciones, distanciaMuro])

  useEffect(() => {
    if (!mounted) return
    const signal = resolveSignalState({
      segundosDesdeUltimoDato,
      practicaFinalizada,
      practicaConError,
      umbralSinSenal: SEGUNDOS_SIN_SENAL,
    })
    logSignalChange(signalStateRef.current, signal, {
      penduloId,
      segundosDesdeUltimoDato,
      umbralSinSenal: SEGUNDOS_SIN_SENAL,
      muestras: enVivo?.muestras,
    })
    signalStateRef.current = signal
  }, [mounted, segundosDesdeUltimoDato, practicaFinalizada, practicaConError, penduloId, enVivo?.muestras])

  useEffect(() => {
    if (!errorPendulo) return
    penduloDiag.error("Firestore", errorPendulo, { penduloId })
  }, [errorPendulo, penduloId])

  useEffect(() => {
    if (!practicaConError || !enVivo) return
    penduloDiag.error("Hardware", "El péndulo reportó un error de hardware", {
      codigo: enVivo.errorCodigo,
      mensaje: enVivo.errorMensaje,
      penduloId,
    })
  }, [practicaConError, enVivo, penduloId])

  useEffect(() => {
    if (!enVivo?.estadoDispositivo || enVivo.estadoDispositivo === estadoDispositivoPrevRef.current) return
    estadoDispositivoPrevRef.current = enVivo.estadoDispositivo
    penduloDiag.info("Hardware", `Señal del dispositivo: ${enVivo.estadoDispositivo}`, {
      penduloId,
      oscilacionesConfirmadas: enVivo.oscilacionesConfirmadas,
      distanciaConfirmada: enVivo.distanciaMuroConfirmada,
    })
  }, [enVivo?.estadoDispositivo, enVivo?.oscilacionesConfirmadas, enVivo?.distanciaMuroConfirmada, penduloId])

  // Si llega telemetría (o IDS) después de pulsar Iniciar, el timeout del
  // bridge era un falso positivo: el aparato sí respondió.
  useEffect(() => {
    if (arranqueIniciadoEn === null) return
    if (estadoComando !== "pendiente" && estadoComando !== "error") return
    const actualizadoMs = enVivo?.actualizadoEn?.toDate?.()?.getTime()
    const datoTrasArranque =
      typeof actualizadoMs === "number" && actualizadoMs >= arranqueIniciadoEn
    if (!datoTrasArranque) return

    comandoPendienteRef.current = false
    if (comandoTimeoutRef.current !== null) {
      window.clearTimeout(comandoTimeoutRef.current)
      comandoTimeoutRef.current = null
    }
    setEstadoComando("enviado")
    setMensajeComando("El péndulo respondió. La práctica está en curso.")
  }, [arranqueIniciadoEn, enVivo?.actualizadoEn, estadoComando])

  const handleStartPractice = async () => {
    if (ocupadoPorOtro) {
      setEstadoComando("error")
      setMensajeComando(
        "Ocupado: otro usuario tiene el control del péndulo en su franja de 30 minutos.",
      )
      return
    }
    if (!puedeIniciar || !user?.uid || !parametrosValidos || practicaEnCurso || !reservaEnTurno) {
      penduloDiag.warn("Comando", "Inicio de práctica bloqueado", {
        puedeIniciar,
        usuario: user?.uid ?? null,
        parametrosValidos,
        practicaEnCurso,
        oscilaciones,
        distanciaMuro,
      })
      return
    }
    setConfirmDialogOpen(false)
    setEstadoComando(null)
    setMensajeComando(null)
    setLecturasAnteriores([])
    setHayMasLecturas(true)
    setOscilacionesPractica(oscilaciones)
    comandoUnsubRef.current?.()
    if (comandoTimeoutRef.current !== null) {
      window.clearTimeout(comandoTimeoutRef.current)
      comandoTimeoutRef.current = null
    }
    try {
      const { practicaId: nuevaPracticaId, practicaInicio: inicioPractica } = await iniciarPractica({
        reservacionId: reservaEnTurno.id,
        penduloId,
        usuarioId: user.uid,
      })
      setPracticaId(nuevaPracticaId)
      setPracticaInicio(inicioPractica)
      finalizadoRef.current = false

      const cfgFirmware = parametrosCfgHaciaFirmware(oscilaciones, distanciaMuro)
      const comandoId = await enviarComando({
        usuarioId: user.uid,
        accion: "iniciar",
        oscilaciones: cfgFirmware.oscilaciones,
        distanciaMuro: cfgFirmware.distanciaMuro,
        reservacionId: reservaEnTurno.id,
        practicaId: nuevaPracticaId,
      })
      setPracticaEnCurso(true)
      setArranqueIniciadoEn(Date.now())
      setEstadoComando("pendiente")
      setMensajeComando("Comando enviado. Esperando confirmación del bridge en la Raspberry Pi…")
      comandoPendienteRef.current = true
      logBridgeCommandState("pendiente", {
        comandoId,
        penduloId,
        oscilacionesSolicitadas: oscilaciones,
        distanciaSolicitada: distanciaMuro,
        cfgFirmware,
      })

      comandoUnsubRef.current = escucharEstadoComando(
        comandoId,
        (data: ComandoPenduloDoc | null) => {
          if (!data?.estado) return
          if (data.estado === "enviado") {
            comandoPendienteRef.current = false
            if (comandoTimeoutRef.current !== null) {
              window.clearTimeout(comandoTimeoutRef.current)
              comandoTimeoutRef.current = null
            }
            setEstadoComando("enviado")
            setMensajeComando("Comando recibido por el bridge. El péndulo debería configurarse en unos segundos.")
            logBridgeCommandState("enviado", { comandoId, penduloId, atendidoEn: data.atendidoEn })
            penduloDiag.info("Sistema", "Handshake guiado por comandos: STOPED → cfg → str → CFGOK → mediciones", {
              comandoId,
            })
            comandoUnsubRef.current?.()
            comandoUnsubRef.current = null
          } else if (data.estado === "error") {
            comandoPendienteRef.current = false
            if (comandoTimeoutRef.current !== null) {
              window.clearTimeout(comandoTimeoutRef.current)
              comandoTimeoutRef.current = null
            }
            setEstadoComando("error")
            setMensajeComando(
              typeof data.errorMsg === "string"
                ? `El bridge no pudo publicar el comando por MQTT: ${data.errorMsg}`
                : "El bridge no pudo publicar el comando por MQTT."
            )
            logBridgeCommandState("error", {
              comandoId,
              penduloId,
              errorMsg: data.errorMsg,
              posiblesCausas: ["MQTT desconectado en bridge", "Broker Mosquitto caído", "Credenciales MQTT incorrectas"],
            })
            setPracticaEnCurso(false)
            setArranqueIniciadoEn(null)
            comandoUnsubRef.current?.()
            comandoUnsubRef.current = null
          }
        },
        (err: Error) => {
          comandoPendienteRef.current = false
          if (comandoTimeoutRef.current !== null) {
            window.clearTimeout(comandoTimeoutRef.current)
            comandoTimeoutRef.current = null
          }
          setEstadoComando("error")
          setMensajeComando(err.message || "Error al escuchar el estado del comando.")
          penduloDiag.error("Firestore", "No se pudo escuchar el estado del comando", {
            comandoId,
            error: err.message,
          })
          setPracticaEnCurso(false)
          setArranqueIniciadoEn(null)
        }
      )

      comandoTimeoutRef.current = window.setTimeout(() => {
        if (!comandoPendienteRef.current) return
        setEstadoComando("error")
        setMensajeComando(
          "No se confirmó el arranque. Espera o avisa al docente."
        )
        logBridgeCommandState("timeout", {
          comandoId,
          penduloId,
          segundosEsperados: SEGUNDOS_ESPERA_BRIDGE,
        })
      }, SEGUNDOS_ESPERA_BRIDGE * 1000)
    } catch (err) {
      const crudo = err instanceof Error ? err.message : "Error al enviar comando de inicio."
      const message = /insufficient permissions|permission-denied/i.test(crudo)
        ? "Firestore rechazó el inicio (permisos). Recarga la página e inténtalo de nuevo."
        : crudo
      penduloDiag.error("Comando", "Fallo al iniciar práctica", { error: crudo, penduloId })
      setEstadoComando("error")
      setMensajeComando(message)
      setPracticaEnCurso(false)
      setArranqueIniciadoEn(null)
    }
  }

  const handleEndPractice = async () => {
    if (!user?.uid || !reservaEnTurno) return
    penduloDiag.info("Comando", 'Enviando comando "detener"', { penduloId, usuarioId: user.uid })
    try {
      const comandoId = await enviarComando({
        usuarioId: user.uid,
        accion: "detener",
        reservacionId: reservaEnTurno.id,
        practicaId: practicaId ?? undefined,
      })
      logBridgeCommandState("pendiente", { comandoId, accion: "detener", penduloId })
      setPracticaEnCurso(false)
      setArranqueIniciadoEn(null)
      await liberarPractica({
        reservacionId: reservaEnTurno.id,
        penduloId,
        usuarioId: user.uid,
      })
      finalizadoRef.current = true
      penduloDiag.info("Comando", "Práctica detenida; puedes iniciar otra mientras dure tu reserva", { comandoId })
    } catch (err) {
      penduloDiag.error("Comando", 'Error al enviar comando "detener"', {
        error: err instanceof Error ? err.message : String(err),
        penduloId,
      })
    }
  }

  const handleExportar = async () => {
    if (!user?.uid) return
    setExportando(true)
    try {
      if (!practicaId) {
        alert("No hay una práctica activa o reciente para exportar")
        return
      }
      await exportarLecturasUsuario(penduloId, user.uid, practicaId)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al exportar datos")
    } finally {
      setExportando(false)
    }
  }

  const handleExportarGeneral = async () => {
    if (!user?.uid) return
    setExportandoGeneral(true)
    try {
      if (rol === "Admin") {
        await exportarLecturasAdmin(penduloId)
      } else {
        await exportarExcelGeneral(penduloId, user.uid)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al exportar el Excel general")
    } finally {
      setExportandoGeneral(false)
    }
  }

  const handleCargarMasLecturas = async () => {
    if (!user?.uid || !practicaInicio || cargandoMasLecturas || !hayMasLecturas) return

    const todas = [...lecturasAnteriores, ...lecturas]
    const masAntigua = todas[0]
    if (!masAntigua?.timestamp) return

    setCargandoMasLecturas(true)
    try {
      const anteriores = await cargarLecturasAnteriores(
        penduloId,
        user.uid,
        practicaInicio,
        OSCILACIONES_MAX,
        masAntigua.timestamp,
      )
      if (anteriores.length < OSCILACIONES_MAX) {
        setHayMasLecturas(false)
      }
      if (anteriores.length > 0) {
        setLecturasAnteriores((prev) => [...anteriores, ...prev])
      } else {
        setHayMasLecturas(false)
      }
    } catch (err) {
      penduloDiag.error("Firestore", "Error cargando lecturas anteriores", {
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setCargandoMasLecturas(false)
    }
  }

  const handleTablaScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      void handleCargarMasLecturas()
    }
  }

  const lecturasDePractica = [...lecturasAnteriores, ...lecturas]
    .filter((l) => !practicaId || !l.practicaId || l.practicaId === practicaId)
    .sort((a, b) => (toMillis(a.timestamp) ?? 0) - (toMillis(b.timestamp) ?? 0))
  const maxMuestraHardware = lecturasDePractica.reduce((maximo, l) => {
    const n =
      typeof l.muestras === "number" ? l.muestras : typeof l.muestra === "number" ? l.muestra : 0
    return n > maximo ? n : maximo
  }, lecturasDePractica.length)
  const maxMuestrasGrafica = Math.min(
    OSCILACIONES_MAX,
    Math.max(
      limitarOscilaciones(enVivo?.oscilacionesConfirmadas) ?? 0,
      limitarOscilaciones(oscilacionesPractica) ?? 0,
      limitarOscilaciones(oscilaciones) ?? 0,
      maxMuestraHardware,
      1,
    ),
  )
  const lecturasTabla = lecturasDePractica
    .map((l, i) => {
      const muestraHardware =
        typeof l.muestras === "number" ? l.muestras : typeof l.muestra === "number" ? l.muestra : null
      const muestra = muestraHardware !== null && muestraHardware >= 1 ? muestraHardware : i + 1
      return { ...l, muestra }
    })
    .sort((a, b) => a.muestra - b.muestra)

  const chartData = Array.from(
    lecturasTabla
      .reduce((mapa, l) => {
        mapa.set(l.muestra, {
          muestra: l.muestra,
          periodo: typeof l.periodo === "number" ? l.periodo : null,
          gravedad: typeof l.gravedad === "number" ? l.gravedad : null,
          frecuencia: typeof l.frecuencia === "number" ? l.frecuencia : null,
          temperatura: typeof l.temperatura === "number" ? l.temperatura : null,
        })
        return mapa
      }, new Map<number, MetricChartPoint>())
      .values(),
  ).sort((a, b) => a.muestra - b.muestra)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Visualización en Tiempo Real</h1>
            {practicaConError ? (
              <Badge variant="outline" className="border-destructive text-destructive">
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                Error de hardware
              </Badge>
            ) : practicaFinalizada ? (
              <Badge variant="outline" className="border-chart-2 text-chart-2">
                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                Práctica finalizada
              </Badge>
            ) : hayDatosEnVivo ? (
              <Badge variant="outline" className="border-chart-3 text-chart-3">
                <span className="h-2 w-2 rounded-full bg-chart-3 animate-pulse mr-1.5" />
                En vivo
              </Badge>
            ) : (
              <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                <WifiOff className="h-3 w-3 mr-1.5" />
                Sin Uso
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Monitorea la medición de gravedad del péndulo {penduloId}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Esta vista se usa durante tu franja reservada. El inicio de la práctica envía la señal al controlador del péndulo (Raspberry Pi) vía MQTT.
          </p>
          {estadoDispositivoLabel && (
            <p className="text-xs text-primary mt-1 font-medium">{estadoDispositivoLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleExportar()} disabled={exportando}>
            {exportando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Excel de esta práctica
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleExportarGeneral()}
            disabled={exportandoGeneral}
          >
            {exportandoGeneral ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Excel general
          </Button>
        </div>
      </div>

      {errorPendulo && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-sm text-destructive">
            {errorPendulo}
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label htmlFor="oscilaciones" className="text-xs">
                  Oscilaciones ({OSCILACIONES_MIN}-{OSCILACIONES_MAX})
                </Label>
                <Input
                  id="oscilaciones"
                  type="number"
                  min={OSCILACIONES_MIN}
                  max={OSCILACIONES_MAX}
                  value={oscilaciones}
                  onChange={(e) => setOscilaciones(Number(e.target.value))}
                  disabled={!puedeIniciar || ocupadoPorOtro || enviandoComando || practicaEnCurso}
                  className="w-32"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="distancia" className="text-xs">
                  Distancia del muro ({DISTANCIA_MURO_MIN}-{DISTANCIA_MURO_MAX} cm)
                </Label>
                <Input
                  id="distancia"
                  type="number"
                  min={DISTANCIA_MURO_MIN}
                  max={DISTANCIA_MURO_MAX}
                  value={distanciaMuro}
                  onChange={(e) => setDistanciaMuro(Number(e.target.value))}
                  disabled={!puedeIniciar || ocupadoPorOtro || enviandoComando || practicaEnCurso}
                  className="w-36"
                />
              </div>
              {mounted ? (
                <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button disabled={!puedeIniciar || ocupadoPorOtro || enviandoComando || !parametrosValidos || practicaEnCurso}>
                      {enviandoComando ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Iniciar práctica
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmas estos parámetros?</AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2">
                          <p>
                            Se enviará al péndulo <strong>{penduloId}</strong> con:
                          </p>
                          <ul className="list-disc pl-5">
                            <li><strong>{oscilaciones}</strong> oscilaciones</li>
                            <li><strong>{distanciaMuro}</strong> cm de distancia del muro</li>
                          </ul>
                          <p>
                            Las gráficas y la tabla se irán llenando muestra a muestra, hasta un
                            máximo de {oscilaciones} oscilaciones.
                          </p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Revisar valores</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(event) => {
                          event.preventDefault()
                          void handleStartPractice()
                        }}
                      >
                        Sí, iniciar práctica
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button disabled>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar práctica
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleEndPractice}
                disabled={enviandoComando || !practicaEnCurso || segundosBloqueoFinalizar > 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar  y reintentar práctica
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Última actualización:</span>
                <span className="font-mono font-medium text-foreground">
                  {segundosDesdeUltimoDato === null ? "--" : `hace ${segundosDesdeUltimoDato}s`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estado de turno:</span>
                <span className={`font-medium ${ocupadoPorOtro ? "text-destructive" : "text-foreground"}`}>
                  {ocupadoPorOtro ? "Ocupado" : puedeIniciar ? "Habilitado" : "Fuera de turno"}
                </span>
              </div>
            </div>
          </div>
          {mensajeComando && (
            <p
              className={`text-xs flex items-center gap-1.5 font-medium ${
                estadoComando === "error"
                  ? "text-destructive"
                  : estadoComando === "enviado"
                    ? "text-chart-2"
                    : "text-primary"
              }`}
            >
              {estadoComando === "pendiente" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {estadoComando === "enviado" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {estadoComando === "error" && <AlertTriangle className="h-3.5 w-3.5" />}
              {mensajeComando}
            </p>
          )}
          {ocupadoPorOtro && (
            <p className="text-xs text-destructive">
              Ocupado: otro usuario tiene el péndulo en su sesión de 30 minutos. Espera a que termine o reserva otro horario en el calendario.
            </p>
          )}
          {!puedeIniciar && !ocupadoPorOtro && (
            <p className="text-xs text-amber-600">
              El botón "Iniciar práctica" se habilita durante tu franja reservada (30 min). Puedes repetir
              la práctica las veces que quieras dentro de ese tiempo.
            </p>
          )}
          {puedeIniciar && !parametrosValidos && (
            <p className="text-xs text-amber-600">
              Revisa los valores: oscilaciones entre {OSCILACIONES_MIN} y {OSCILACIONES_MAX}, distancia del muro
              entre {DISTANCIA_MURO_MIN} y {DISTANCIA_MURO_MAX} cm, para no dañar el mecanismo del péndulo.
            </p>
          )}
        </CardContent>
      </Card>

      {mostrarAvisoReseted && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">El péndulo sigue en RESET</p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumenEstudiante(diagnosticoEstudiante)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {practicaConError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                El péndulo reportó un error de hardware{enVivo?.errorCodigo ? ` (código ${enVivo.errorCodigo})` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {enVivo?.errorMensaje || "Revisa la alineación del láser o el microswitch, o avisa al docente encargado."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main visualization grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resumen de la práctica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de la Práctica</CardTitle>
            <CardDescription>Progreso de la medición actual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${hayDatosEnVivo ? "bg-chart-3/20" : "bg-muted"}`}>
                <Gauge className={`h-8 w-8 ${hayDatosEnVivo ? "text-chart-3" : "text-muted-foreground"} ${hayDatosEnVivo ? "animate-pulse" : ""}`} />
              </div>
              <p className="text-3xl font-bold font-mono mt-3">{enVivo?.muestras ?? "--"}</p>
              <p className="text-xs text-muted-foreground">muestras capturadas</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Prom. período</p>
                <p className="font-mono font-medium text-foreground">{formatNumber(enVivo?.promedioPeriodo)} s</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Prom. gravedad</p>
                <p className="font-mono font-medium text-foreground">{formatNumber(enVivo?.promedioGravedad)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time values */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Valores Instantáneos</CardTitle>
            <CardDescription>Última muestra capturada por los sensores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-1" />
                  <span className="text-xs text-muted-foreground">Período</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.periodo, 5)}</p>
                <p className="text-xs text-muted-foreground mt-1">segundos</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-xs text-muted-foreground">Gravedad</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.gravedad, 5)}</p>
                <p className="text-xs text-muted-foreground mt-1">calculada</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-xs text-muted-foreground">Frecuencia</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.frecuencia, 5)}</p>
                <p className="text-xs text-muted-foreground mt-1">Hz (crudo)</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-4" />
                  <span className="text-xs text-muted-foreground">Temperatura</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.temperatura, 5)}</p>
                <p className="text-xs text-muted-foreground mt-1">°C</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Stream - RF-09 */}
      <CameraStream penduloId={penduloId} isLive={hayDatosEnVivo} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Período por muestra</CardTitle>
            <CardDescription>
              Muestras 1 a {maxMuestrasGrafica}, igual que en la tabla de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart
              data={chartData}
              dataKey="periodo"
              label="Período (s)"
              color="var(--chart-1)"
              maxMuestras={maxMuestrasGrafica}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gravedad calculada por muestra</CardTitle>
            <CardDescription>
              Muestras 1 a {maxMuestrasGrafica}, igual que en la tabla de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart
              data={chartData}
              dataKey="gravedad"
              label="Gravedad"
              color="var(--chart-2)"
              maxMuestras={maxMuestrasGrafica}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frecuencia por muestra</CardTitle>
            <CardDescription>
              Lectura cruda del sensor — muestras 1 a {maxMuestrasGrafica}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart
              data={chartData}
              dataKey="frecuencia"
              label="Frecuencia (Hz)"
              color="var(--chart-3)"
              maxMuestras={maxMuestrasGrafica}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temperatura por muestra</CardTitle>
            <CardDescription>
              Temperatura ambiente — muestras 1 a {maxMuestrasGrafica}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart
              data={chartData}
              dataKey="temperatura"
              label="Temperatura (°C)"
              color="var(--chart-4)"
              maxMuestras={maxMuestrasGrafica}
            />
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registro de Datos</CardTitle>
          <CardDescription>
            {lecturasTabla.length > 0
              ? `${lecturasTabla.length} de ${maxMuestrasGrafica} muestras — se actualiza junto con las gráficas`
              : "Sin muestras en la práctica actual"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-80 overflow-y-auto" onScroll={handleTablaScroll}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hora</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Muestra</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Período (s)</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Gravedad</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Frecuencia</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Temp. (°C)</th>
                </tr>
              </thead>
              <tbody>
                {lecturasTabla.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      {practicaEnCurso || practicaId
                        ? "Esperando las primeras muestras de la práctica..."
                        : "Inicia la práctica para ver los datos en tiempo real."}
                    </td>
                  </tr>
                ) : (
                  [...lecturasTabla].reverse().map((l) => {
                    const millis = toMillis(l.timestamp)
                    return (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono">
                          {millis !== null ? new Date(millis).toLocaleTimeString() : "--"}
                        </td>
                        <td className="py-3 px-4 font-mono">{l.muestra ?? "--"}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.periodo, 5)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.gravedad, 5)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.frecuencia, 5)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.temperatura, 5)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
            {cargandoMasLecturas && (
              <p className="text-center text-xs text-muted-foreground py-3 flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Cargando lecturas anteriores...
              </p>
            )}
            {!hayMasLecturas && lecturasTabla.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                No hay más lecturas anteriores en esta práctica.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricChart({
  data,
  dataKey,
  label,
  color,
  maxMuestras,
}: {
  data: MetricChartPoint[]
  dataKey: string
  label: string
  color: string
  maxMuestras: number
}) {
  const ticks = Array.from({ length: maxMuestras }, (_, i) => i + 1)

  if (data.length === 0) {
    return (
      <div className="h-[260px] w-full flex items-center justify-center text-sm text-muted-foreground">
        Esperando muestras del péndulo...
      </div>
    )
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            dataKey="muestra"
            domain={[1, maxMuestras]}
            ticks={ticks}
            interval={0}
            allowDecimals={false}
            className="text-xs fill-muted-foreground"
            tick={{ fill: "var(--muted-foreground)", fontSize: maxMuestras > 12 ? 10 : 12 }}
            label={{ value: "Muestra", position: "insideBottom", offset: -5, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            className="text-xs fill-muted-foreground"
            tick={{ fill: "var(--muted-foreground)" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

