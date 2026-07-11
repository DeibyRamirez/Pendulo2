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
  Maximize2,
  Settings2,
  CheckCircle2,
  Loader2,
  WifiOff,
  Gauge,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { useState, useEffect } from "react"
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
import { usePenduloData } from "@/hooks/usePenduloData"
import { escucharReservacionesUsuario } from "@/app/services/reservacionService"
import type { Timestamp } from "firebase/firestore"

// Debe coincidir con DEFAULT_PENDULO_ID configurado en el bridge (bridge/.env)
const DEFAULT_PENDULO_ID = "UAC-01"
// Umbral para considerar que el péndulo está "en vivo" (sin señal = bridge/broker caído)
const SEGUNDOS_SIN_SENAL = 10

// Límites de seguridad para no dañar el mecanismo físico (láser/microswitch).
// TODO: confirmar con el docente/Yesid los valores exactos seguros del hardware.
const OSCILACIONES_MIN = 1
const OSCILACIONES_MAX = 20
const DISTANCIA_MURO_MIN = 1
const DISTANCIA_MURO_MAX = 15

// Node-RED espera 15s entre enviar la configuración (cfg) y la orden de
// inicio (str) al péndulo (ver bridge/node-red-command-flow.json). Durante
// esta ventana el péndulo todavía no se mueve; si se manda "detener" en
// medio de esta espera, se corta la práctica antes de que arranque de
// verdad. Bloqueamos "Finalizar práctica" mientras dure esta cuenta atrás.
const SEGUNDOS_CONFIGURACION = 15

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

export default function RealtimePage() {
  const { user } = useAuth()
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [oscilaciones, setOscilaciones] = useState(5)
  const [distanciaMuro, setDistanciaMuro] = useState(5)
  const [practicaEnCurso, setPracticaEnCurso] = useState(false)
  const [configurandoHasta, setConfigurandoHasta] = useState<number | null>(null)
  const [nowTick, setNowTick] = useState(() => Date.now())

  // Cuenta atrás de los 15s de configuración: solo corre mientras hay una
  // cuenta activa, para no generar renders innecesarios el resto del tiempo.
  useEffect(() => {
    if (configurandoHasta === null) return
    const interval = setInterval(() => setNowTick(Date.now()), 250)
    return () => clearInterval(interval)
  }, [configurandoHasta])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = (escucharReservacionesUsuario as unknown as (uid: string, cb: (data: Reservacion[]) => void, onErr: (e: Error) => void) => () => void)(
      user.uid,
      (data) => setReservaciones(data),
      (err) => console.error('Error escuchando reservaciones en realtime:', err)
    )
    return () => unsub()
  }, [user?.uid])

  const ahora = new Date()
  const reservaEnTurno = reservaciones.find((r) => {
    if (r.estado !== "pending" && r.estado !== "active") return false
    const inicio = toDate(r.inicio_sesion_reserva)
    const fin = toDate(r.final_sesion_reserva)
    return ahora >= inicio && ahora <= fin
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
  } = usePenduloData(penduloId)

  const practicaFinalizada = enVivo?.estado === "finalizado"
  const practicaConError = enVivo?.estado === "error"
  const hayDatosEnVivo =
    !practicaFinalizada && !practicaConError && segundosDesdeUltimoDato !== null && segundosDesdeUltimoDato < SEGUNDOS_SIN_SENAL

  // Texto legible de la última señal de confirmación del hardware (handshake
  // serial reenviado por Node-RED vía "pendulo/estado"). Puede no existir
  // todavía si Node-RED no está reenviando estas señales al broker.
  const ESTADO_DISPOSITIVO_LABEL: Record<string, string> = {
    configurando: "Enviando configuración al péndulo…",
    configurado: "Péndulo confirmó la configuración",
    iniciando: "Enviando orden de inicio…",
    iniciado: "Péndulo confirmó el inicio",
    recibiendo_datos: "Péndulo transmitiendo datos",
    finalizado: "Péndulo confirmó el fin de la práctica",
    detenido: "Péndulo detenido",
  }
  const estadoDispositivoLabel = enVivo?.estadoDispositivo
    ? ESTADO_DISPOSITIVO_LABEL[enVivo.estadoDispositivo] ?? null
    : null

  const segundosConfigurando = configurandoHasta
    ? Math.max(0, Math.ceil((configurandoHasta - nowTick) / 1000))
    : 0

  // Apenas termina la cuenta atrás, dejamos de bloquear "Finalizar práctica"
  // (el péndulo ya debería haber recibido la orden real de inicio "str").
  useEffect(() => {
    if (configurandoHasta !== null && Date.now() >= configurandoHasta) {
      setConfigurandoHasta(null)
    }
  }, [nowTick, configurandoHasta])

  // Si el hardware confirma fin de práctica o error (por telemetría real o
  // por el flujo opcional de "pendulo/estado"), soltamos el bloqueo de los
  // botones aunque el estudiante no haya dado clic en "Finalizar".
  useEffect(() => {
    if (enVivo?.estado === "finalizado" || enVivo?.estado === "error") {
      setPracticaEnCurso(false)
      setConfigurandoHasta(null)
    }
  }, [enVivo?.estado])

  const parametrosValidos =
    oscilaciones >= OSCILACIONES_MIN &&
    oscilaciones <= OSCILACIONES_MAX &&
    distanciaMuro >= DISTANCIA_MURO_MIN &&
    distanciaMuro <= DISTANCIA_MURO_MAX

  const handleStartPractice = async () => {
    if (!puedeIniciar || !user?.uid || !parametrosValidos || practicaEnCurso) return
    try {
      await enviarComando({
        usuarioId: user.uid,
        accion: "iniciar",
        oscilaciones,
        distanciaMuro,
      })
      setPracticaEnCurso(true)
      // El péndulo (vía Node-RED) espera SEGUNDOS_CONFIGURACION antes de
      // mandar la orden real de arranque tras la configuración — ver
      // bridge/node-red-command-flow.json. Bloqueamos "Finalizar práctica"
      // durante esa ventana para no cortar el arranque antes de tiempo.
      setConfigurandoHasta(Date.now() + SEGUNDOS_CONFIGURACION * 1000)
    } catch (err) {
      console.error("Error al enviar comando de inicio:", err)
    }
  }

  const handleEndPractice = async () => {
    if (!user?.uid) return
    try {
      await enviarComando({ usuarioId: user.uid, accion: "detener" })
      setPracticaEnCurso(false)
      setConfigurandoHasta(null)
    } catch (err) {
      console.error("Error al enviar comando de detener:", err)
    }
  }

  const chartData = lecturas.map((l, i) => ({
    muestra: typeof l.muestras === "number" ? l.muestras : i + 1,
    periodo: typeof l.periodo === "number" ? l.periodo : null,
    gravedad: typeof l.gravedad === "number" ? l.gravedad : null,
    frecuencia: typeof l.frecuencia === "number" ? l.frecuencia : null,
    temperatura: typeof l.temperatura === "number" ? l.temperatura : null,
  }))

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
                Sin señal
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
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar datos
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
                  disabled={!puedeIniciar || enviandoComando || practicaEnCurso}
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
                  disabled={!puedeIniciar || enviandoComando || practicaEnCurso}
                  className="w-36"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!puedeIniciar || enviandoComando || !parametrosValidos || practicaEnCurso}>
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
                          El péndulo tarda unos {SEGUNDOS_CONFIGURACION} segundos en configurarse
                          antes de empezar a moverse — no podrás finalizar la práctica hasta que
                          termine esa configuración inicial.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Revisar valores</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartPractice}>
                      Sí, iniciar práctica
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                onClick={handleEndPractice}
                disabled={enviandoComando || !practicaEnCurso || segundosConfigurando > 0}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar práctica
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
                <span className="font-medium text-foreground">
                  {puedeIniciar ? "Habilitado" : "Fuera de turno"}
                </span>
              </div>
            </div>
          </div>
          {segundosConfigurando > 0 && (
            <p className="text-xs text-primary flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" />
              Configurando péndulo… el movimiento iniciará en {segundosConfigurando}s. "Finalizar
              práctica" se habilita cuando termine esta cuenta atrás.
            </p>
          )}
          {!puedeIniciar && (
            <p className="text-xs text-amber-600">
              El botón "Iniciar práctica" solo se habilita cuando tienes una reserva activa en este momento.
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
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.periodo)}</p>
                <p className="text-xs text-muted-foreground mt-1">segundos</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-xs text-muted-foreground">Gravedad</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.gravedad)}</p>
                <p className="text-xs text-muted-foreground mt-1">calculada</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-xs text-muted-foreground">Frecuencia</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.frecuencia, 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Hz (crudo)</p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-4" />
                  <span className="text-xs text-muted-foreground">Temperatura</span>
                </div>
                <p className="text-2xl font-bold text-foreground font-mono">{formatNumber(enVivo?.temperatura, 1)}</p>
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
            <CardDescription>Evolución del período medido</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart data={chartData} dataKey="periodo" label="Período (s)" color="var(--chart-1)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gravedad calculada por muestra</CardTitle>
            <CardDescription>Convergencia hacia el valor promedio</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart data={chartData} dataKey="gravedad" label="Gravedad" color="var(--chart-2)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frecuencia por muestra</CardTitle>
            <CardDescription>Lectura cruda del sensor (no es 1/período)</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart data={chartData} dataKey="frecuencia" label="Frecuencia (Hz)" color="var(--chart-3)" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temperatura por muestra</CardTitle>
            <CardDescription>Temperatura ambiente durante la práctica</CardDescription>
          </CardHeader>
          <CardContent>
            <MetricChart data={chartData} dataKey="temperatura" label="Temperatura (°C)" color="var(--chart-4)" />
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registro de Datos</CardTitle>
          <CardDescription>Últimas {Math.min(lecturas.length, 10)} muestras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {lecturas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Aún no hay muestras registradas para este péndulo.
                    </td>
                  </tr>
                ) : (
                  [...lecturas].slice(-10).reverse().map((l) => {
                    const millis = toMillis(l.timestamp)
                    return (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono">
                          {millis !== null ? new Date(millis).toLocaleTimeString() : "--"}
                        </td>
                        <td className="py-3 px-4 font-mono">{l.muestras ?? "--"}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.periodo)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.gravedad)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.frecuencia, 0)}</td>
                        <td className="py-3 px-4 font-mono">{formatNumber(l.temperatura, 1)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface MetricChartPoint {
  muestra: number
  [key: string]: number | null
}

function MetricChart({
  data,
  dataKey,
  label,
  color,
}: {
  data: MetricChartPoint[]
  dataKey: string
  label: string
  color: string
}) {
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
            dataKey="muestra"
            className="text-xs fill-muted-foreground"
            tick={{ fill: "var(--muted-foreground)" }}
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
