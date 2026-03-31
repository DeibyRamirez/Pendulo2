"use client"

import { useMemo, useState } from "react"
import type { ComponentProps } from "react"
import type MapaLeafletType from "@/components/mapa-leaflet"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, MapPin, Activity, Calendar, Globe, Radio } from "lucide-react"
import { usePendulos } from "@/hooks/usePendulos"
import { useAuth } from "@/hooks/useAuth"

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

type PenduloUI = {
  id: string
  pendulo_id: string
  institucion: string
  pais: string
  ciudad: string
  latitud: number
  longitud: number
  estado: string
  ultimaActualizacion: string
}

const toCityFromInstitution = (institucion: string) => {
  if (!institucion) return "Nodo WPA"
  return institucion.split(" ").slice(0, 2).join(" ")
}

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
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Inactivo</Badge>
  }
}

export default function MapaWPAPage() {
  const { pendulos, loading } = usePendulos()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPendulo, setSelectedPendulo] = useState<PenduloUI | null>(null)

  const pendulosUI = useMemo(
    () =>
      pendulos.map((p) => ({
        id: p.id,
        pendulo_id: p.pendulo_id,
        institucion: p.institucion,
        pais: p.pais,
        ciudad: toCityFromInstitution(p.institucion),
        latitud: Number(p.latitud),
        longitud: Number(p.longitud),
        estado: p.estado,
        ultimaActualizacion: new Date().toISOString(),
      })),
    [pendulos]
  )

  const filteredPendulos = pendulosUI.filter(
    (p) =>
      p.institucion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    totalPendulos: pendulosUI.length,
    activos: pendulosUI.filter((p) => p.estado === "Activo").length,
  }

  return (
    <div className="min-h-screen bg-background">
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
                <p className="text-xs text-muted-foreground">Mapa global en tiempo real</p>
              </div>
            </div>
          </div>
          {!user && (
            <Link href="/login">
              <Button variant="outline" size="sm">Iniciar Sesión</Button>
            </Link>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-96 border-r border-border bg-card/30 overflow-y-auto">
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

          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Péndulos de la Red ({filteredPendulos.length})
            </h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando péndulos...</p>
            ) : (
              filteredPendulos.map((pendulo) => (
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
                  <p className="text-sm text-foreground font-medium mb-1 line-clamp-1">{pendulo.institucion}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {pendulo.pais}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <MapaLeaflet pendulos={filteredPendulos} onSelect={(pendulo) => {
              const penduloUI = pendulosUI.find(p => p.id === pendulo.id);
              if (penduloUI) setSelectedPendulo(penduloUI);
            }} />
          </div>

          {selectedPendulo && (
            <div className="absolute bottom-0 left-0 right-0 z-[400] p-4">
              <Card className="border-border bg-card/98 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">{getEstadoBadge(selectedPendulo.estado)}</div>
                      <CardTitle className="text-base truncate">{selectedPendulo.institucion}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {selectedPendulo.ciudad}, {selectedPendulo.pais}
                      </p>
                    </div>
                    <button onClick={() => setSelectedPendulo(null)} className="text-muted-foreground hover:text-foreground ml-2">x</button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex gap-2">
                  <Link href={`/pendulo/${selectedPendulo.pendulo_id || selectedPendulo.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Activity className="w-3 h-3 mr-1" />
                      Visualizar
                    </Button>
                  </Link>
                  {user && selectedPendulo.estado === "Activo" && (
                    <Link href={`/reservas?pendulo=${selectedPendulo.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Calendar className="w-3 h-3 mr-1" />
                        Agendar
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
