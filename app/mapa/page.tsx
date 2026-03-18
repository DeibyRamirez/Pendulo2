"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
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

// Dynamic import for Leaflet (client-side only)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
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
                className={`w-full p-4 rounded-lg border transition-all text-left ${
                  selectedPendulo?.id === pendulo.id
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
        <main className="flex-1 relative">
          {typeof window !== "undefined" && (
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
              crossOrigin=""
            />
          )}
          
          <div className="absolute inset-0" suppressHydrationWarning>
            {typeof window !== "undefined" && (
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
                whenReady={() => setIsMapReady(true)}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {isMapReady && filteredPendulos.map((pendulo) => (
                  <Marker
                    key={pendulo.id}
                    position={[pendulo.latitud, pendulo.longitud]}
                    eventHandlers={{
                      click: () => setSelectedPendulo(pendulo)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${getEstadoColor(pendulo.estado)}`} />
                          <span className="font-medium text-sm">{pendulo.institucion}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {pendulo.ciudad}, {pendulo.pais}
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={`/dashboard?pendulo=${pendulo.id}`}
                            className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Ver Dashboard
                          </a>
                          <a
                            href={`/reservas?pendulo=${pendulo.id}`}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                          >
                            Agendar
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Selected Pendulo Card */}
          {selectedPendulo && (
            <Card className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-10 border-border bg-card/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getEstadoBadge(selectedPendulo.estado)}
                    </div>
                    <CardTitle className="text-lg">{selectedPendulo.institucion}</CardTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {selectedPendulo.ciudad}, {selectedPendulo.pais}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPendulo(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Usuarios Activos</p>
                    <p className="text-xl font-bold">{selectedPendulo.usuariosActivos}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">Sesiones Hoy</p>
                    <p className="text-xl font-bold">{selectedPendulo.sesionesHoy}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Última actualización: {new Date(selectedPendulo.ultimaActualizacion).toLocaleString("es-CO")}
                </p>
                <div className="flex gap-2">
                  {selectedPendulo.estado !== "En_mantenimiento" && (
                    <>
                      <Link href={`/dashboard?pendulo=${selectedPendulo.id}`} className="flex-1">
                        <Button className="w-full" size="sm">
                          <Activity className="w-4 h-4 mr-2" />
                          Ver Dashboard
                        </Button>
                      </Link>
                      {selectedPendulo.estado === "Activo" && (
                        <Link href={`/reservas?pendulo=${selectedPendulo.id}`} className="flex-1">
                          <Button variant="outline" className="w-full" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Agendar
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                  {selectedPendulo.estado === "En_mantenimiento" && (
                    <p className="text-sm text-muted-foreground text-center w-full py-2">
                      Este péndulo está en mantenimiento
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="absolute top-4 right-4 p-3 rounded-lg bg-card/90 backdrop-blur-sm border border-border z-10">
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
        </main>
      </div>
    </div>
  )
}
