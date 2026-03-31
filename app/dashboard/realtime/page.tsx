"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Play, 
  Download,
  Maximize2,
  Settings2,
  Lock,
  CheckCircle2
} from "lucide-react"
import { useState, useEffect } from "react"
import { PendulumChart } from "@/components/pendulum-chart"
import { PendulumVisualization } from "@/components/pendulum-visualization"
import { CameraStream } from "@/components/camera-stream"
import { useAuth } from "@/hooks/useAuth"
import { escucharReservacionesUsuario } from "@/app/services/reservacionService"
import type { Timestamp } from "firebase/firestore"

interface Reservacion {
  id: string
  usuario_id: string
  inicio_sesion_reserva: Timestamp
  final_sesion_reserva: Timestamp
  estado: "pending" | "active" | "completed" | "cancelled"
}

function toDate(value: Timestamp | Date): Date {
  if (value instanceof Date) return value
  return value?.toDate?.() ?? new Date()
}

export default function RealtimePage() {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(15.7)
  const [currentVelocity, setCurrentVelocity] = useState(0.42)
  const [currentPeriod] = useState(2.01)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])

  useEffect(() => {
    if (!user?.uid) return
    const unsub = (escucharReservacionesUsuario as unknown as (uid: string, cb: (data: Reservacion[]) => void) => () => void)(
      user.uid,
      (data) => setReservaciones(data)
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

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 0.1)
      const time = elapsedTime
      const angle = 15 * Math.cos(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time)
      const velocity = Math.abs(-15 * (2 * Math.PI / 2.01) * Math.sin(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time)) / 10
      setCurrentAngle(parseFloat((angle + (Math.random() - 0.5) * 0.3).toFixed(1)))
      setCurrentVelocity(parseFloat((velocity + (Math.random() - 0.5) * 0.05).toFixed(2)))
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning, elapsedTime])

  const handleStartPractice = () => {
    if (!puedeIniciar) return
    setIsRunning(true)
  }

  const handleEndPractice = () => {
    setIsRunning(false)
  }

  const handleStopData = () => {
    setElapsedTime(0)
    setCurrentAngle(15.7)
    setCurrentVelocity(0.42)
    setIsRunning(false)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Visualización en Tiempo Real</h1>
            <Badge variant="outline" className="border-chart-3 text-chart-3">
              <span className="h-2 w-2 rounded-full bg-chart-3 animate-pulse mr-1.5" />
              En vivo
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">Monitorea los datos del péndulo en tiempo real</p>
          <p className="text-xs text-muted-foreground mt-2">
            Esta vista se usa durante tu franja reservada. El inicio de la práctica envía la señal al controlador del péndulo (Raspberry Pi).
          </p>
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

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={isRunning ? "secondary" : "default"}
                onClick={handleStartPractice}
                disabled={!puedeIniciar || isRunning}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar práctica
              </Button>
              <Button variant="outline" onClick={handleEndPractice} disabled={!isRunning}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar práctica
              </Button>
              <Button variant="outline" onClick={handleStopData}>
                <Lock className="mr-2 h-4 w-4" />
                Limpiar datos locales
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Tiempo transcurrido:</span>
                <span className="font-mono font-medium text-foreground">{elapsedTime.toFixed(1)}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Frecuencia de muestreo:</span>
                <span className="font-mono font-medium text-foreground">10 Hz</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estado de turno:</span>
                <span className="font-medium text-foreground">
                  {puedeIniciar ? "Habilitado" : "Fuera de turno"}
                </span>
              </div>
            </div>
          </div>
          {!puedeIniciar && (
            <p className="mt-3 text-xs text-amber-600">
              El botón "Iniciar práctica" solo se habilita cuando tienes una reserva activa en este momento.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main visualization grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pendulum animation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Simulación del Péndulo</CardTitle>
            <CardDescription>Representación visual del movimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <PendulumVisualization angle={currentAngle} isRunning={isRunning} />
          </CardContent>
        </Card>

        {/* Real-time values */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Valores Instantáneos</CardTitle>
            <CardDescription>Datos capturados por los sensores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-6 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">Ángulo</span>
                </div>
                <p className="text-4xl font-bold text-foreground font-mono">{currentAngle}°</p>
                <p className="text-xs text-muted-foreground mt-2">Desplazamiento angular</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Velocidad</span>
                </div>
                <p className="text-4xl font-bold text-foreground font-mono">{currentVelocity}</p>
                <p className="text-xs text-muted-foreground mt-2">m/s</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-chart-3" />
                  <span className="text-sm text-muted-foreground">Período</span>
                </div>
                <p className="text-4xl font-bold text-foreground font-mono">{currentPeriod}</p>
                <p className="text-xs text-muted-foreground mt-2">segundos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Stream - RF-09 */}
      <CameraStream penduloId="UAC-01" isLive={isRunning} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ángulo vs Tiempo</CardTitle>
            <CardDescription>Oscilación del péndulo</CardDescription>
          </CardHeader>
          <CardContent>
            <PendulumChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Diagrama de Fase</CardTitle>
            <CardDescription>Ángulo vs Velocidad angular</CardDescription>
          </CardHeader>
          <CardContent>
            <PhaseChart />
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registro de Datos</CardTitle>
          <CardDescription>Últimas 10 mediciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tiempo (s)</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Ángulo (°)</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Velocidad (m/s)</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Aceleración (m/s²)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }, (_, i) => {
                  const time = (elapsedTime - i * 0.1).toFixed(1)
                  const angle = (15 * Math.cos(2 * Math.PI * parseFloat(time) / 2.01) * Math.exp(-0.02 * parseFloat(time))).toFixed(2)
                  const vel = (Math.random() * 0.5 + 0.2).toFixed(3)
                  const acc = (Math.random() * 2 - 1).toFixed(3)
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono">{time}</td>
                      <td className="py-3 px-4 font-mono">{angle}</td>
                      <td className="py-3 px-4 font-mono">{vel}</td>
                      <td className="py-3 px-4 font-mono">{acc}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PhaseChart() {
  const [data, setData] = useState<{ angle: number; velocity: number }[]>([])

  useEffect(() => {
    const newData = []
    for (let i = 0; i < 100; i++) {
      const time = i * 0.05
      const angle = 15 * Math.cos(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time)
      const velocity = -15 * (2 * Math.PI / 2.01) * Math.sin(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time)
      newData.push({ angle, velocity })
    }
    setData(newData)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <svg viewBox="-20 -50 40 100" className="w-full h-full">
        <line x1="-18" y1="0" x2="18" y2="0" stroke="var(--border)" strokeWidth="0.2" />
        <line x1="0" y1="-45" x2="0" y2="45" stroke="var(--border)" strokeWidth="0.2" />
        <text x="17" y="-2" fill="var(--muted-foreground)" fontSize="2">θ</text>
        <text x="2" y="-42" fill="var(--muted-foreground)" fontSize="2">ω</text>
        <path
          d={data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.angle} ${d.velocity}`).join(' ')}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  )
}
