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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ArrowLeft, Search, MapPin, Activity, Calendar, Globe, Radio, List, LogIn } from "lucide-react"
import { usePendulos } from "@/hooks/usePendulos"
import { useAuth } from "@/hooks/useAuth"
import { NOMBRE_RED } from "@/lib/marca"
import { obtenerRutaInicioPorRol } from "@/lib/rutas"

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
  if (!institucion) return "Nodo de la red"
  return institucion.split(" ").slice(0, 2).join(" ")
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Activo":
      return "bg-[var(--color-ok)]"
    case "En_uso":
      return "bg-[var(--color-error)]"
    case "En_mantenimiento":
      return "bg-[var(--color-niebla)]"
    default:
      return "bg-[var(--color-serie-3)]"
  }
}

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case "Activo":
      return <Badge className="bg-[rgb(62_224_143/0.16)] text-[var(--color-ok)] border-[rgb(62_224_143/0.35)]">Disponible</Badge>
    case "En_uso":
      return <Badge className="bg-[rgb(255_107_107/0.16)] text-[var(--color-error)] border-[rgb(255_107_107/0.35)]">En uso</Badge>
    case "En_mantenimiento":
      return <Badge className="bg-secondary text-muted-foreground border-border">Mantenimiento</Badge>
    default:
      return <Badge className="bg-[rgb(255_201_74/0.16)] text-[var(--color-serie-3)] border-[rgb(255_201_74/0.35)]">Inactivo</Badge>
  }
}

function ListaNodosPanel({
  stats,
  loading,
  searchTerm,
  onSearchChange,
  filteredPendulos,
  selectedPendulo,
  onSelect,
}: {
  stats: { totalPendulos: number; activos: number }
  loading: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  filteredPendulos: PenduloUI[]
  selectedPendulo: PenduloUI | null
  onSelect: (pendulo: PenduloUI) => void
}) {
  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Radio className="w-4 h-4" />
              <span className="text-xs">Total Nodos</span>
            </div>
            <p className="text-xl font-bold sm:text-2xl">{stats.totalPendulos}</p>
          </div>
          <div className="p-3 rounded-lg bg-[rgb(62_224_143/0.1)]">
            <div className="flex items-center gap-2 text-[var(--color-ok)] mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs">Disponibles</span>
            </div>
            <p className="num text-xl font-medium text-[var(--color-ok)] sm:text-2xl">{stats.activos}</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por institución, país..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-input/50"
          />
        </div>
      </div>

      <div className="p-4 space-y-3 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Péndulos de la Red ({filteredPendulos.length})
        </h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando péndulos...</p>
        ) : (
          filteredPendulos.map((pendulo) => (
            <button
              key={pendulo.id}
              onClick={() => onSelect(pendulo)}
              className={`w-full p-4 rounded-lg border transition-all text-left touch-target ${
                selectedPendulo?.id === pendulo.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card/50 hover:bg-card hover:border-border/80"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`h-2 w-2 shrink-0 rounded-full ${getEstadoColor(pendulo.estado)}`} />
                  <span className="truncate text-sm font-medium">{pendulo.ciudad}</span>
                </div>
                <div className="shrink-0">{getEstadoBadge(pendulo.estado)}</div>
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
    </>
  )
}

export default function PaginaMapaRed() {
  const { pendulos, loading } = usePendulos()
  const { user, rol } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPendulo, setSelectedPendulo] = useState<PenduloUI | null>(null)
  const [listaAbierta, setListaAbierta] = useState(false)

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

  const panelProps = {
    stats,
    loading,
    searchTerm,
    onSearchChange: setSearchTerm,
    filteredPendulos,
    selectedPendulo,
    onSelect: (pendulo: PenduloUI) => {
      setSelectedPendulo(pendulo)
      setListaAbierta(false)
    },
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-card/50 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between gap-1 px-4 sm:h-16 sm:gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href={obtenerRutaInicioPorRol(rol)}>
              <Button variant="ghost" size="icon" className="touch-target shrink-0" aria-label="Volver al panel">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm sm:text-base truncate">{NOMBRE_RED}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Mapa global en tiempo real</p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Sheet open={listaAbierta} onOpenChange={setListaAbierta}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target lg:hidden"
                  aria-label="Abrir lista de nodos"
                >
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nodos</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex h-[100dvh] max-h-[100dvh] w-[min(100vw-2rem,24rem)] flex-col p-0 pb-[env(safe-area-inset-bottom,0px)]"
              >
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle>Lista de nodos</SheetTitle>
                </SheetHeader>
                <ListaNodosPanel {...panelProps} />
              </SheetContent>
            </Sheet>
            {!user && (
              <Link href="/login">
                <Button variant="outline" size="sm" className="touch-target shrink-0" aria-label="Iniciar sesión">
                  <LogIn className="h-4 w-4 sm:hidden" aria-hidden />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 h-[calc(100dvh-3.5rem)] min-h-[calc(100vh-3.5rem)] sm:h-[calc(100dvh-4rem)] sm:min-h-[calc(100vh-4rem)]">
        <aside className="hidden flex-col overflow-hidden border-r border-border bg-card/30 lg:flex lg:w-80 xl:w-96">
          <ListaNodosPanel {...panelProps} />
        </aside>

        <main className="flex-1 relative overflow-hidden min-w-0">
          <div className="absolute inset-0 z-0">
            <MapaLeaflet
              layoutKey={listaAbierta}
              pendulos={filteredPendulos}
              onSelect={(pendulo) => {
                const penduloUI = pendulosUI.find((p) => p.id === pendulo.id)
                if (penduloUI) setSelectedPendulo(penduloUI)
              }}
            />
          </div>

          {selectedPendulo && (
            <div className="absolute bottom-0 left-0 right-0 z-[400] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:p-4">
              <Card className="max-h-[min(50dvh,420px)] overflow-y-auto rounded-t-xl border-border bg-card/98 shadow-lg backdrop-blur-sm sm:rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">{getEstadoBadge(selectedPendulo.estado)}</div>
                      <CardTitle className="truncate text-sm sm:text-base">{selectedPendulo.institucion}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {selectedPendulo.ciudad}, {selectedPendulo.pais}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPendulo(null)}
                      className="text-muted-foreground hover:text-foreground ml-2 touch-target"
                      aria-label="Cerrar detalle"
                    >
                      ×
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col sm:flex-row gap-2">
                  <Link href={`/pendulo/${selectedPendulo.pendulo_id || selectedPendulo.id}`} className="flex-1">
                    <Button className="w-full touch-target" size="sm">
                      <Activity className="w-3 h-3 mr-1" />
                      Visualizar
                    </Button>
                  </Link>
                  {user && selectedPendulo.estado === "Activo" && (
                    <Link href={`/reservas?pendulo=${selectedPendulo.id}`} className="flex-1">
                      <Button variant="outline" className="w-full touch-target" size="sm">
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
