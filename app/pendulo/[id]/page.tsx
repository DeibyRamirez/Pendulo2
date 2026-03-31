"use client"

import { useState, useEffect, use, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Calendar,
  Clock,
  Gauge,
  RotateCcw,
  MapPin,
  LogIn,
  LayoutDashboard
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { usePendulos } from "@/hooks/usePendulos"
import { useAuth } from "@/hooks/useAuth"
import { getDashboardPathByRole } from "@/lib/roles"

// Datos simulados del péndulo
const generateOscillationData = () => {
  const data = []
  for (let i = 0; i < 50; i++) {
    const time = i * 0.1
    const angle = 15 * Math.sin(2 * Math.PI * 0.5 * time) * Math.exp(-0.02 * time)
    data.push({
      time: time.toFixed(1),
      angulo: parseFloat(angle.toFixed(2))
    })
  }
  return data
}

export default function PenduloPublicoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { user, rol } = useAuth()
  const { pendulos } = usePendulos()
  const [oscillationData, setOscillationData] = useState(generateOscillationData())
  const [currentValues, setCurrentValues] = useState({
    angulo: 12.5,
    velocidad: 0.45,
    oscilaciones: 156,
    periodo: 2.19
  })

  const penduloSeleccionado = useMemo(() => {
    const byId = pendulos.find((p) => p.id === resolvedParams.id)
    if (byId) return byId
    const byPenduloId = pendulos.find((p) => p.pendulo_id === resolvedParams.id)
    if (byPenduloId) return byPenduloId
    const numericId = Number(resolvedParams.id)
    if (!Number.isNaN(numericId) && numericId >= 1 && numericId <= pendulos.length) {
      return pendulos[numericId - 1]
    }
    return null
  }, [pendulos, resolvedParams.id])

  const penduloInfo = {
    id: penduloSeleccionado?.pendulo_id || resolvedParams.id,
    institucion: penduloSeleccionado?.institucion || "Péndulo no registrado",
    ubicacion: "Laboratorio de Física",
    ciudad: "Nodo WPA",
    pais: penduloSeleccionado?.pais || "Sin país",
    estado: penduloSeleccionado?.estado || "Inactivo",
    longitudPendulo: "1.2 m",
    masaEsfera: "0.5 kg",
    gravedadLocal: "9.78 m/s²",
  }

  // Simulación de actualización en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValues((prev) => ({
        angulo: parseFloat((Math.random() * 30 - 15).toFixed(2)),
        velocidad: parseFloat((Math.random() * 2).toFixed(2)),
        oscilaciones: prev.oscilaciones + 1,
        periodo: parseFloat((2.19 + (Math.random() - 0.5) * 0.1).toFixed(3))
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="4" r="2" />
                <line x1="12" y1="6" x2="12" y2="16" />
                <circle cx="12" cy="18" r="3" fill="currentColor" />
              </svg>
            </div>
            <div>
               <h1 className="font-semibold">Péndulo {penduloInfo.id}</h1>
              <p className="text-xs text-muted-foreground">World Pendulum Alliance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href={`/${getDashboardPathByRole(rol)}`}>
                <Button size="sm" variant="outline">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Ir a mi panel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Banner
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Visualización Pública del Péndulo</p>
              <p className="text-sm text-muted-foreground">
                Inicia sesión para agendar sesiones y acceder a funciones avanzadas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/registro">
              <Button variant="outline" size="sm">Registrarse</Button>
            </Link>
            <Link href="/mapa">
              <Button variant="ghost" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Ver Red WPA
              </Button>
            </Link>
          </div>
        </div> */}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Info del Péndulo */}
          <Card className="lg:col-span-1 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información del Péndulo</CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {penduloInfo.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Institución</p>
                <p className="font-medium">{penduloInfo.institucion}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-medium">{penduloInfo.ubicacion}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {penduloInfo.ciudad}, {penduloInfo.pais}
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="font-medium text-sm">Especificaciones Técnicas</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Longitud</p>
                      <p className="font-medium">{penduloInfo.longitudPendulo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Masa</p>
                      <p className="font-medium">{penduloInfo.masaEsfera}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Gravedad Local</p>
                      <p className="font-medium">{penduloInfo.gravedadLocal}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                {user ? (
                  <Link href="/dashboard/reservas">
                    <Button className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar Sesión
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Inicia sesión para agendar
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datos en Tiempo Real */}
          <div className="lg:col-span-2 space-y-6">
            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs">Ángulo</span>
                  </div>
                  <p className="text-2xl font-bold">{currentValues.angulo}°</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-xs">Velocidad</span>
                  </div>
                  <p className="text-2xl font-bold">{currentValues.velocidad} <span className="text-sm font-normal">rad/s</span></p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs">Oscilaciones</span>
                  </div>
                  <p className="text-2xl font-bold">{currentValues.oscilaciones}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Período</span>
                  </div>
                  <p className="text-2xl font-bold">{currentValues.periodo} <span className="text-sm font-normal">s</span></p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfica de Oscilación */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Gráfica de Oscilación</CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Actualizando en tiempo real
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={oscillationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        label={{ value: "Tiempo (s)", position: "insideBottom", offset: -5, fontSize: 11 }}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        label={{ value: "Ángulo (°)", angle: -90, position: "insideLeft", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="angulo"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cámara en vivo (placeholder) */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Visualización en Vivo</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                    EN VIVO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-secondary/30 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="4" r="2" />
                        <line x1="12" y1="6" x2="12" y2="16" />
                        <circle cx="12" cy="18" r="3" fill="currentColor" />
                        <path d="M6 4 L12 4" strokeDasharray="2 2" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">Transmisión de cámara del péndulo</p>
                    <p className="text-xs text-muted-foreground">
                      Inicia sesión para acceder a la transmisión en vivo
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Este péndulo forma parte de la red World Pendulum Alliance (WPA)
          </p>
          <p className="text-xs text-muted-foreground">
            Proyecto financiado por Erasmus+ | Convenio UAC - Universidad de los Andes
          </p>
        </div>
      </main>
    </div>
  )
}
