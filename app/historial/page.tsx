"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  History,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Filter,
  FileText,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Experiment {
  id: number
  date: string
  time: string
  duration: string
  type: string
  user: string
  status: "completed" | "interrupted" | "processing"
  dataPoints: number
  period: number
  amplitude: number
}

const experiments: Experiment[] = [
  { id: 1, date: "17 Mar 2026", time: "14:30", duration: "15 min", type: "Período simple", user: "María García", status: "completed", dataPoints: 1500, period: 2.01, amplitude: 15.2 },
  { id: 2, date: "17 Mar 2026", time: "10:00", duration: "20 min", type: "Amortiguamiento", user: "Carlos López", status: "completed", dataPoints: 2000, period: 2.03, amplitude: 14.8 },
  { id: 3, date: "16 Mar 2026", time: "16:45", duration: "12 min", type: "Período simple", user: "Ana Martínez", status: "completed", dataPoints: 1200, period: 2.00, amplitude: 15.5 },
  { id: 4, date: "16 Mar 2026", time: "11:30", duration: "8 min", type: "Oscilación forzada", user: "Diego Sánchez", status: "interrupted", dataPoints: 800, period: 1.98, amplitude: 12.3 },
  { id: 5, date: "15 Mar 2026", time: "09:15", duration: "25 min", type: "Amortiguamiento", user: "Laura Rodríguez", status: "completed", dataPoints: 2500, period: 2.02, amplitude: 16.1 },
  { id: 6, date: "15 Mar 2026", time: "15:00", duration: "18 min", type: "Período simple", user: "Juan Pérez", status: "completed", dataPoints: 1800, period: 2.01, amplitude: 15.0 },
  { id: 7, date: "14 Mar 2026", time: "10:30", duration: "22 min", type: "Resonancia", user: "María García", status: "completed", dataPoints: 2200, period: 2.04, amplitude: 18.5 },
  { id: 8, date: "14 Mar 2026", time: "14:00", duration: "5 min", type: "Período simple", user: "Carlos López", status: "processing", dataPoints: 500, period: 2.00, amplitude: 14.2 },
]

const experimentTypes = ["Todos", "Período simple", "Amortiguamiento", "Oscilación forzada", "Resonancia"]

export default function HistorialPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("Todos")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filteredExperiments = experiments.filter((exp) => {
    const matchesSearch = 
      exp.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "Todos" || exp.type === selectedType
    return matchesSearch && matchesType
  })

  const stats = {
    total: experiments.length,
    completed: experiments.filter(e => e.status === "completed").length,
    totalDataPoints: experiments.reduce((sum, e) => sum + e.dataPoints, 0),
    avgDuration: Math.round(experiments.reduce((sum, e) => sum + parseInt(e.duration), 0) / experiments.length),
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Historial de Experimentos</h1>
              <p className="text-muted-foreground mt-2">
                Consulta y descarga los datos de tus sesiones experimentales anteriores
              </p>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar todo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Experimentos</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completados</p>
                    <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                    <TrendingUp className="h-6 w-6 text-chart-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Puntos de Datos</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalDataPoints.toLocaleString()}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                    <FileText className="h-6 w-6 text-chart-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Duración Promedio</p>
                    <p className="text-2xl font-bold text-foreground">{stats.avgDuration} min</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/10">
                    <Clock className="h-6 w-6 text-chart-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por usuario o tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      {selectedType}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {experimentTypes.map((type) => (
                      <DropdownMenuItem key={type} onClick={() => setSelectedType(type)}>
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Experiments list */}
          <Card>
            <CardHeader>
              <CardTitle>Experimentos</CardTitle>
              <CardDescription>
                {filteredExperiments.length} experimento{filteredExperiments.length !== 1 ? "s" : ""} encontrado{filteredExperiments.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExperiments.map((exp) => (
                  <div key={exp.id} className="border border-border rounded-lg overflow-hidden">
                    {/* Main row */}
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <TrendingUp className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{exp.type}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {exp.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exp.time}
                            </span>
                            <span>{exp.duration}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <div className="text-right hidden md:block">
                          <p className="text-sm text-muted-foreground">Realizado por</p>
                          <p className="text-sm font-medium text-foreground">{exp.user}</p>
                        </div>
                        <Badge variant={
                          exp.status === "completed" ? "default" : 
                          exp.status === "interrupted" ? "destructive" : 
                          "secondary"
                        }>
                          {exp.status === "completed" ? "Completado" : 
                           exp.status === "interrupted" ? "Interrumpido" : 
                           "Procesando"}
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === exp.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded details */}
                    {expandedId === exp.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs text-muted-foreground">Período medido</p>
                            <p className="text-lg font-bold text-foreground">{exp.period} s</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs text-muted-foreground">Amplitud inicial</p>
                            <p className="text-lg font-bold text-foreground">{exp.amplitude}°</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs text-muted-foreground">Puntos de datos</p>
                            <p className="text-lg font-bold text-foreground">{exp.dataPoints.toLocaleString()}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs text-muted-foreground">Frecuencia</p>
                            <p className="text-lg font-bold text-foreground">{(1/exp.period).toFixed(3)} Hz</p>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <Button size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver gráficas
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Descargar CSV
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Generar reporte
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
