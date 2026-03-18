"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Calendar, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Play,
  Users
} from "lucide-react"
import Link from "next/link"
import { PendulumChart } from "@/components/pendulum-chart"

const quickStats = [
  {
    title: "Estado del Péndulo",
    value: "Activo",
    description: "Listo para experimentos",
    icon: Activity,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
  },
  {
    title: "Sesiones Hoy",
    value: "12",
    description: "+3 vs ayer",
    icon: Calendar,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
  {
    title: "Tiempo Promedio",
    value: "18 min",
    description: "Por sesión",
    icon: Clock,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    title: "Usuarios Activos",
    value: "47",
    description: "Esta semana",
    icon: Users,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
]

const recentExperiments = [
  { id: 1, user: "María García", time: "Hace 15 min", duration: "12 min", type: "Período simple" },
  { id: 2, user: "Carlos López", time: "Hace 1 hora", duration: "20 min", type: "Amortiguamiento" },
  { id: 3, user: "Ana Martínez", time: "Hace 2 horas", duration: "15 min", type: "Período simple" },
]

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al laboratorio remoto de péndulo físico</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/reservas">
              <Calendar className="mr-2 h-4 w-4" />
              Agendar sesión
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/realtime">
              <Play className="mr-2 h-4 w-4" />
              Ver en tiempo real
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Preview Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Vista Previa en Tiempo Real</CardTitle>
              <CardDescription>Datos actuales del péndulo</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-chart-3 animate-pulse" />
              <span className="text-sm text-muted-foreground">En vivo</span>
            </div>
          </CardHeader>
          <CardContent>
            <PendulumChart />
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">15.7°</p>
                <p className="text-sm text-muted-foreground">Ángulo actual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">0.42 m/s</p>
                <p className="text-sm text-muted-foreground">Velocidad</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">2.01 s</p>
                <p className="text-sm text-muted-foreground">Período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimos experimentos</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/historial">
                Ver todo
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExperiments.map((exp) => (
                <div key={exp.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exp.user}</p>
                    <p className="text-xs text-muted-foreground">{exp.type}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{exp.time}</span>
                      <span>•</span>
                      <span>{exp.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximas Sesiones</CardTitle>
            <CardDescription>Reservas programadas para hoy</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reservas">
              Gestionar reservas
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { time: "10:00 - 10:30", user: "Juan Pérez", status: "Confirmada" },
              { time: "11:00 - 11:45", user: "Laura Rodríguez", status: "Confirmada" },
              { time: "14:00 - 14:30", user: "Diego Sánchez", status: "Pendiente" },
              { time: "16:00 - 16:30", user: "Disponible", status: "Libre" },
            ].map((session, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm font-medium text-foreground">{session.time}</p>
                <p className="text-sm text-muted-foreground mt-1">{session.user}</p>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                  session.status === "Confirmada" ? "bg-chart-3/10 text-chart-3" :
                  session.status === "Pendiente" ? "bg-chart-4/10 text-chart-4" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
