"use client"

import { useState } from "react"
import type { ComponentProps } from "react"
import type MapaLeafletType from "@/components/mapa-leaflet"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Search,
  MapPin,
  Activity,
  Calendar,
  ExternalLink,
  Globe,
  Users,
  Radio
} from "lucide-react"


// ✅ Agrega este único import dinámico:

const MapaLeaflet = dynamic<ComponentProps<typeof MapaLeafletType>>(
  () => import("@/components/mapa-leaflet"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Cargando mapa...</p>
      </div>
    ),
  }
)
// Datos de péndulos de la red WPA
const PENDULOS_WPA = [
  {
    id: "uac-001",
    institucion: "Corporación Universitaria Autónoma del Cauca",
    pais: "Colombia",
    ciudad: "Popayán",
    latitud: 2.4419,
    longitud: -76.6061,
    estado: "Activo",
    ultimaActualizacion: "2026-03-17T14:30:00",
    sesionesHoy: 5,
    usuariosActivos: 23
  },
  {
    id: "uniandes-001",
    institucion: "Universidad de los Andes",
    pais: "Colombia",
    ciudad: "Bogotá",
    latitud: 4.6018,
    longitud: -74.0662,
    estado: "En_uso",
    ultimaActualizacion: "2026-03-17T14:28:00",
    sesionesHoy: 8,
    usuariosActivos: 45
  },
  {
    id: "upc-001",
    institucion: "Universitat Politècnica de Catalunya",
    pais: "España",
    ciudad: "Barcelona",
    latitud: 41.3879,
    longitud: 2.1699,
    estado: "Activo",
    ultimaActualizacion: "2026-03-17T14:25:00",
    sesionesHoy: 12,
    usuariosActivos: 67
  },
  {
    id: "mit-001",
    institucion: "Massachusetts Institute of Technology",
    pais: "Estados Unidos",
    ciudad: "Cambridge",
    latitud: 42.3601,
    longitud: -71.0942,
    estado: "En_mantenimiento",
    ultimaActualizacion: "2026-03-17T10:00:00",
    sesionesHoy: 0,
    usuariosActivos: 89
  },
  {
    id: "unam-001",
    institucion: "Universidad Nacional Autónoma de México",
    pais: "México",
    ciudad: "Ciudad de México",
    latitud: 19.3262,
    longitud: -99.1761,
    estado: "Activo",
    ultimaActualizacion: "2026-03-17T14:20:00",
    sesionesHoy: 6,
    usuariosActivos: 34
  },
  {
    id: "tu-001",
    institucion: "Technical University of Munich",
    pais: "Alemania",
    ciudad: "Múnich",
    latitud: 48.1497,
    longitud: 11.5679,
    estado: "Activo",
    ultimaActualizacion: "2026-03-17T14:15:00",
    sesionesHoy: 9,
    usuariosActivos: 52
  },
  {
    id: "usp-001",
    institucion: "Universidade de São Paulo",
    pais: "Brasil",
    ciudad: "São Paulo",
    latitud: -23.5587,
    longitud: -46.7319,
    estado: "En_uso",
    ultimaActualizacion: "2026-03-17T14:10:00",
    sesionesHoy: 7,
    usuariosActivos: 41
  }
]

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Activo":
      return "bg-green-500"
    case "En_uso":
      return "bg-red-500"
    case "En_mantenimiento":
      return "bg-gray-500"
    default:
      return "bg-yellow-500"
  }
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "Activo":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Disponible</Badge>
    case "En_uso":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En uso</Badge>
    case "En_mantenimiento":
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Mantenimiento</Badge>
    default:
      return <Badge variant="secondary">{estado}</Badge>
  }
}

export default function MapaWPAPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPendulo, setSelectedPendulo] = useState<typeof PENDULOS_WPA[0] | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  const filteredPendulos = PENDULOS_WPA.filter(
    (p) =>
      p.institucion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalPendulos: PENDULOS_WPA.length,
    activos: PENDULOS_WPA.filter((p) => p.estado === "Activo").length,
    enUso: PENDULOS_WPA.filter((p) => p.estado === "En_uso").length,
    mantenimiento: PENDULOS_WPA.filter((p) => p.estado === "En_mantenimiento").length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold">Red World Pendulum Alliance</h1>
                <p className="text-xs text-muted-foreground">Mapa global de laboratorios remotos</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-96 border-r border-border bg-card/30 overflow-y-auto">
          {/* Stats */}
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs">Total Nodos</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalPendulos}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs">Disponibles</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats.activos}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por institución, país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input/50"
              />
            </div>
          </div>

          {/* Lista de péndulos */}
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Péndulos de la Red ({filteredPendulos.length})
            </h3>
            {filteredPendulos.map((pendulo) => (
              <button
                key={pendulo.id}
                onClick={() => setSelectedPendulo(pendulo)}
                className={`w-full p-4 rounded-lg border transition-all text-left ${selectedPendulo?.id === pendulo.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/50 hover:bg-card hover:border-border/80"
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getEstadoColor(pendulo.estado)}`} />
                    <span className="text-sm font-medium">{pendulo.ciudad}</span>
                  </div>
                  {getEstadoBadge(pendulo.estado)}
                </div>
                <p className="text-sm text-foreground font-medium mb-1 line-clamp-1">
                  {pendulo.institucion}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {pendulo.pais}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {pendulo.usuariosActivos} usuarios
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {pendulo.sesionesHoy} sesiones hoy
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>


        {/* Map */}
        <main className="flex-1 relative overflow-hidden">

          {/* Mapa al fondo, sin padding que lo corte */}
          <div className="absolute inset-0 z-0">
            <MapaLeaflet
              pendulos={filteredPendulos}
              onSelect={setSelectedPendulo}
            />
          </div>

          {/* Legend — z-index alto para que flote sobre el mapa */}
          <div className="absolute top-4 left-4 p-3 rounded-lg bg-card/90 backdrop-blur-sm border border-border z-[400]">
            <p className="text-xs font-medium mb-2">Estado del Péndulo</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>En uso</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>Mantenimiento</span>
              </div>
            </div>
          </div>

          {/* Card de péndulo seleccionado — z-index alto, pegada abajo */}
          {selectedPendulo && (
            <div className="absolute bottom-0 left-0 right-0 z-[400] p-4">
              <Card className="border-border bg-card/98 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getEstadoBadge(selectedPendulo.estado)}
                      </div>
                      <CardTitle className="text-base truncate">{selectedPendulo.institucion}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {selectedPendulo.ciudad}, {selectedPendulo.pais}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPendulo(null)}
                      className="text-muted-foreground hover:text-foreground ml-2 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Usuarios</p>
                      <p className="text-lg font-bold">{selectedPendulo.usuariosActivos}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50 text-center">
                      <p className="text-xs text-muted-foreground">Sesiones hoy</p>
                      <p className="text-lg font-bold">{selectedPendulo.sesionesHoy}</p>
                    </div>
                    <div className="col-span-2 flex gap-2 items-center">
                      {selectedPendulo.estado !== "En_mantenimiento" && (
                        <>
                          <Link href={`/dashboard?pendulo=${selectedPendulo.id}`} className="flex-1">
                            <Button className="w-full" size="sm">
                              <Activity className="w-3 h-3 mr-1" />
                              Dashboard
                            </Button>
                          </Link>
                          {selectedPendulo.estado === "Activo" && (
                            <Link href={`/reservas?pendulo=${selectedPendulo.id}`} className="flex-1">
                              <Button variant="outline" className="w-full" size="sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                Agendar
                              </Button>
                            </Link>
                          )}
                        </>
                      )}
                      {selectedPendulo.estado === "En_mantenimiento" && (
                        <p className="text-sm text-muted-foreground text-center w-full">
                          En mantenimiento
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Actualizado: {new Date(selectedPendulo.ultimaActualizacion).toLocaleString("es-CO")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
