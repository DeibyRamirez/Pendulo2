"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Play } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePendulos } from "@/hooks/usePendulos"
import { usePenduloData } from "@/hooks/usePenduloData"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { QRCodeSVG } from "qrcode.react"
import {
  buscarPenduloEnCatalogo,
  esPracticaEnVivo,
  maxMuestrasDesdeEnVivo,
  resolverIdTelemetria,
} from "@/lib/penduloEnVivo"
import { PendulumStage, type SignalMode } from "@/components/lab/pendulum-stage"
import { StatusChip } from "@/components/lab/status-chip"
import { Skeleton } from "@/components/ui/skeleton"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pendulo2.vercel.app/"
const DEMO_PENDULO_ID = "1"

const allies = [
  { name: "UAC", detail: "Corp. Universitaria Autónoma del Cauca" },
  { name: "UNIANDES", detail: "Universidad de los Andes" },
  { name: "Erasmus+", detail: "Unión Europea" },
]

function useQrSize() {
  const [size, setSize] = useState(160)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const apply = () => setSize(media.matches ? 140 : 160)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  return size
}

function estadoTone(estado: string) {
  if (estado === "Activo") return "bg-[var(--color-ok)]"
  if (estado === "En_uso") return "bg-[var(--color-naranja)]"
  if (estado === "Inactivo" || estado === "En_mantenimiento") return "bg-[var(--color-error)]"
  return "bg-[var(--color-niebla)]"
}

export function HeroSection() {
  const { pendulos, loading, error } = usePendulos()
  const penduloDemo = useMemo(
    () => buscarPenduloEnCatalogo(pendulos, DEMO_PENDULO_ID),
    [pendulos],
  )
  const penduloIdTelemetria = useMemo(
    () => resolverIdTelemetria(DEMO_PENDULO_ID, penduloDemo),
    [penduloDemo],
  )
  const { enVivo, segundosDesdeUltimoDato } = usePenduloData(penduloIdTelemetria)
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const qrSize = useQrSize()
  const touchX = useRef<number | null>(null)

  const hayDatosEnVivo = esPracticaEnVivo(enVivo, segundosDesdeUltimoDato)
  const maxMuestras = maxMuestrasDesdeEnVivo(enVivo)

  let signal: SignalMode = "demo"
  if (enVivo?.estado === "error") {
    signal = "sin_senal"
  } else if (enVivo?.estado === "en_progreso") {
    signal = hayDatosEnVivo ? "en_vivo" : "sin_senal"
  }
  if (reduced && signal !== "sin_senal") signal = "pausado"

  const measuredPeriod =
    hayDatosEnVivo && typeof enVivo?.periodo === "number" ? enVivo.periodo : undefined

  const telemetriaEnVivo =
    signal === "en_vivo"
      ? {
          temperatura: typeof enVivo?.temperatura === "number" ? enVivo.temperatura : undefined,
          periodo: typeof enVivo?.periodo === "number" ? enVivo.periodo : undefined,
          muestras: typeof enVivo?.muestras === "number" ? enVivo.muestras : undefined,
          maxMuestras,
          gravedad: typeof enVivo?.gravedad === "number" ? enVivo.gravedad : undefined,
        }
      : undefined

  const items = useMemo(
    () =>
      pendulos.slice(0, 8).map((p) => ({
        id: p.pendulo_id || p.id,
        institucion: p.institucion,
        latitud: p.latitud,
        longitud: p.longitud,
        pais: p.pais,
        estado: p.estado,
      })),
    [pendulos],
  )

  useEffect(() => {
    if (items.length === 0) return
    setIndex((current) => current % items.length)
  }, [items.length])

  const selected = items.length > 0 ? items[index % items.length] : null
  const chipTone =
    signal === "en_vivo" ? "ok" : signal === "sin_senal" ? "error" : signal === "pausado" ? "pause" : "demo"
  const chipLabel =
    signal === "en_vivo"
      ? "EN VIVO · LABORATORIO UAC"
      : signal === "sin_senal"
        ? "SIN SEÑAL"
        : signal === "pausado"
          ? "PAUSADO"
          : "DEMO"

  const step = (direction: number) => {
    if (items.length < 2) return
    setIndex((current) => (current + direction + items.length) % items.length)
  }

  return (
    <section className="relative min-h-[calc(100svh-72px)] overflow-hidden pt-[72px]">
      <div className="relative mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr] md:gap-12">
          <div className="flex flex-col gap-6 md:col-start-1 md:row-start-1">
            <div className="hero-rise" style={{ animationDelay: ".1s" }}>
              <StatusChip tone={chipTone}>{chipLabel}</StatusChip>
            </div>
            <h1 className="font-display text-display font-semibold leading-[.9] tracking-[-0.045em] text-foreground">
              <span className="line-mask">
                <span style={{ animationDelay: ".1s" }}>Experimenta la física</span>
              </span>
              <span className="line-mask">
                <span style={{ animationDelay: ".19s" }}>
                  <span className="subrayado">sin fronteras.</span>
                </span>
              </span>
            </h1>
            <p
              className="hero-rise max-w-[42ch] text-destacado leading-[1.45] text-muted-foreground"
              style={{ animationDelay: ".35s" }}
            >
              Accede al péndulo físico de la Corporación Universitaria Autónoma del Cauca desde cualquier
              lugar del mundo. Visualiza datos en tiempo real, agenda sesiones experimentales y forma parte
              de la red global de laboratorios remotos.
            </p>
          </div>

          <div id="pendulo" className="scroll-mt-24 md:col-start-2 md:row-span-2 md:row-start-1">
            <PendulumStage signal={signal} period={measuredPeriod} telemetriaEnVivo={telemetriaEnVivo} />
          </div>

          <div className="flex flex-col gap-8 md:col-start-1 md:row-start-2">
            <div className="hero-rise flex flex-col gap-3 sm:flex-row" style={{ animationDelay: ".43s" }}>
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Acceder al dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/pendulo/1">
                  <Play className="mr-2 h-4 w-4" />
                  Ver demostración
                </Link>
              </Button>
            </div>

            <div className="hero-rise border-t border-border pt-6" style={{ animationDelay: ".51s" }}>
              <p className="mb-4 font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-muted-foreground">
                Proyecto colaborativo con
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {allies.map((ally) => (
                  <div key={ally.name} className="border-l border-[var(--color-linea-fuerte)] pl-3">
                    <p className="font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-foreground">
                      {ally.name}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">{ally.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-10">
          <p className="mb-6 font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-muted-foreground">
            Accede a nuestros péndulos
          </p>

          {loading ? (
            <div
              className="grid gap-6 rounded-[1.4rem] border border-border bg-card p-6 sm:grid-cols-[140px_1fr]"
              aria-busy="true"
              aria-label="Cargando péndulos"
            >
              <Skeleton className="mx-auto size-[140px]" />
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              No se pudo cargar la red de péndulos. Inténtalo de nuevo en unos minutos.
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-[1.4rem] border border-border bg-card px-6 py-10 text-center">
              <p className="text-foreground">Aún no hay péndulos en la red.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Cuando un laboratorio publique su instrumento, el acceso por QR aparecerá aquí.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/mapa">Ver el mapa de la red</Link>
              </Button>
            </div>
          ) : selected ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="size-11 shrink-0"
                onClick={() => step(-1)}
                disabled={items.length < 2}
                aria-label="Péndulo anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div
                className="min-w-0 flex-1 rounded-[1.4rem] border border-border bg-card p-5 sm:p-8"
                onTouchStart={(event) => {
                  touchX.current = event.touches[0]?.clientX ?? null
                }}
                onTouchEnd={(event) => {
                  if (touchX.current == null) return
                  const end = event.changedTouches[0]?.clientX ?? touchX.current
                  const delta = end - touchX.current
                  if (delta > 40) step(-1)
                  if (delta < -40) step(1)
                  touchX.current = null
                }}
              >
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <Link
                    href={`/pendulo/${selected.id}`}
                    className="shrink-0 rounded-md bg-white p-3"
                    aria-label={`Abrir péndulo de ${selected.institucion}`}
                  >
                    <QRCodeSVG value={`${baseUrl}/pendulo/${selected.id}`} size={qrSize} level="M" />
                  </Link>
                  <div className="grid w-full flex-1 grid-cols-2 gap-x-6 gap-y-5">
                    <div className="col-span-2">
                      <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
                        Institución
                      </p>
                      <p className="mt-1 font-display text-lg font-medium text-foreground">{selected.institucion}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
                        Estado
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-foreground">
                        <span className={`size-1.5 rounded-full ${estadoTone(selected.estado)}`} />
                        <span className="num text-sm">{selected.estado.replaceAll("_", " ")}</span>
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
                        País
                      </p>
                      <p className="num mt-1 text-sm text-foreground">{selected.pais}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
                        Latitud
                      </p>
                      <p className="num mt-1 whitespace-nowrap text-sm text-foreground">{selected.latitud}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
                        Longitud
                      </p>
                      <p className="num mt-1 whitespace-nowrap text-sm text-foreground">{selected.longitud}</p>
                    </div>
                  </div>
                </div>
                <p className="num mt-6 text-center text-[.6875rem] tracking-[.14em] text-muted-foreground">
                  {String((index % items.length) + 1).padStart(1, "0")} / {items.length}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="size-11 shrink-0"
                onClick={() => step(1)}
                disabled={items.length < 2}
                aria-label="Péndulo siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
