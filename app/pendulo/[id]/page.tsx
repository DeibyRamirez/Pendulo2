"use client"

import { useState, useEffect, use, useMemo, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Calendar,
  Clock,
  Gauge,
  MapPin,
  LogIn,
  LayoutDashboard,
  Thermometer,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { usePendulos } from "@/hooks/usePendulos"
import { useAuth } from "@/hooks/useAuth"
import { getDashboardPathByRole } from "@/lib/roles"
import { CameraStream } from "@/components/camera-stream"
import { usePenduloData, type LecturaPendulo } from "@/hooks/usePenduloData"
import { escucharLecturasPractica } from "@/app/services/penduloDataService"
import { count } from "console"

const OSCILACIONES_MAX = 20
const SEGUNDOS_SIN_SENAL = 10
/** El bridge escribe telemetría en pendulo_data/UAC-01, no en el id numérico del catálogo. */
const PENDULO_ID_TELEMETRIA = "UAC-01"

interface PuntoPractica {
  muestra: number
  periodo: number | null
  gravedad: number | null
  frecuencia: number | null
  temperatura: number | null
}

function formatNumber(value: unknown, decimals = 2): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—"
  return value.toFixed(decimals)
}

function limitarOscilaciones(valor: unknown): number | null {
  if (typeof valor !== "number" || Number.isNaN(valor)) return null
  const entero = Math.round(valor)
  if (entero < 1 || entero > OSCILACIONES_MAX) return null
  return entero
}

function etiquetaEstadoCatalogo(estado: string): string {
  if (estado === "En_uso") return "En uso"
  if (estado === "En_mantenimiento") return "En mantenimiento"
  return estado
}

function resolverIdTelemetria(urlId: string, catalogo: { pendulo_id?: string } | null): string {
  const delCatalogo = catalogo?.pendulo_id?.trim()
  if (delCatalogo && /[A-Za-z]/.test(delCatalogo)) return delCatalogo
  if (urlId && /[A-Za-z]/.test(urlId)) return urlId
  return PENDULO_ID_TELEMETRIA
}

export default function PenduloPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { user, rol } = useAuth()
  const { pendulos, loading: cargandoPendulos } = usePendulos()
  const [lecturasPractica, setLecturasPractica] = useState<LecturaPendulo[]>([])
  const [puntosEnVivo, setPuntosEnVivo] = useState<PuntoPractica[]>([])
  const practicaIdAnterior = useRef<string | null>(null)

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

  const penduloId = resolverIdTelemetria(resolvedParams.id, penduloSeleccionado)

  const {
    enVivo,
    segundosDesdeUltimoDato,
    loading: cargandoEnVivo,
  } = usePenduloData(penduloId)

  const practicaEnCurso = enVivo?.estado === "en_progreso"
  const haySenalReciente =
    segundosDesdeUltimoDato !== null && segundosDesdeUltimoDato < SEGUNDOS_SIN_SENAL
  const hayDatosEnVivo = practicaEnCurso && haySenalReciente
  const hayUltimoMuestreo =
    typeof enVivo?.muestras === "number" ||
    typeof enVivo?.periodo === "number" ||
    typeof enVivo?.gravedad === "number" ||
    typeof enVivo?.frecuencia === "number" ||
    typeof enVivo?.temperatura === "number"

  const maxMuestras =
    limitarOscilaciones(enVivo?.oscilacionesConfirmadas) ??
    limitarOscilaciones(enVivo?.oscilaciones) ??
    OSCILACIONES_MAX

  useEffect(() => {
    const practicaId = typeof enVivo?.practicaId === "string" ? enVivo.practicaId : null
    if (practicaId !== practicaIdAnterior.current) {
      practicaIdAnterior.current = practicaId
      setPuntosEnVivo([])
      setLecturasPractica([])
    }
  }, [enVivo?.practicaId])

  useEffect(() => {
    if (!enVivo) return
    const muestra = enVivo.muestras
    if (typeof muestra !== "number" || muestra < 1) return

    const punto: PuntoPractica = {
      muestra,
      periodo: typeof enVivo.periodo === "number" ? enVivo.periodo : null,
      gravedad: typeof enVivo.gravedad === "number" ? enVivo.gravedad : null,
      frecuencia: typeof enVivo.frecuencia === "number" ? enVivo.frecuencia : null,
      temperatura: typeof enVivo.temperatura === "number" ? enVivo.temperatura : null,
    }

    setPuntosEnVivo((prev) => {
      const sinEsta = prev.filter((p) => p.muestra !== muestra)
      const siguiente =
        muestra === 1
          ? [punto]
          : [...sinEsta, punto].filter((p) => p.muestra >= 1 && p.muestra <= maxMuestras)
      return siguiente.sort((a, b) => a.muestra - b.muestra)
    })
  }, [
    enVivo?.muestras,
    enVivo?.periodo,
    enVivo?.gravedad,
    enVivo?.frecuencia,
    enVivo?.temperatura,
    enVivo?.estado,
    maxMuestras,
  ])

  useEffect(() => {
    const uidPractica = typeof enVivo?.usuarioActivo === "string" ? enVivo.usuarioActivo : null
    const practicaInicio = enVivo?.practicaInicio
    if (!uidPractica || !practicaInicio) {
      setLecturasPractica([])
      return
    }

    return escucharLecturasPractica(
      penduloId,
      uidPractica,
      practicaInicio,
      OSCILACIONES_MAX,
      (data: LecturaPendulo[]) => setLecturasPractica(data),
    )
  }, [penduloId, enVivo?.usuarioActivo, enVivo?.practicaInicio])

  const chartData = useMemo(() => {
    if (lecturasPractica.length > 0) {
      return lecturasPractica
        .map((l, i) => {
          const muestraRaw =
            typeof l.muestras === "number"
              ? l.muestras
              : typeof l.muestra === "number"
                ? l.muestra
                : i + 1
          return {
            muestra: muestraRaw,
            periodo: typeof l.periodo === "number" ? l.periodo : null,
            gravedad: typeof l.gravedad === "number" ? l.gravedad : null,
            frecuencia: typeof l.frecuencia === "number" ? l.frecuencia : null,
            temperatura: typeof l.temperatura === "number" ? l.temperatura : null,
          }
        })
        .filter((p) => p.muestra >= 1 && p.muestra <= maxMuestras)
        .sort((a, b) => a.muestra - b.muestra)
    }
    if (puntosEnVivo.length > 0) return puntosEnVivo
    if (typeof enVivo?.muestras === "number" && enVivo.muestras >= 1) {
      return [
        {
          muestra: enVivo.muestras,
          periodo: typeof enVivo.periodo === "number" ? enVivo.periodo : null,
          gravedad: typeof enVivo.gravedad === "number" ? enVivo.gravedad : null,
          frecuencia: typeof enVivo.frecuencia === "number" ? enVivo.frecuencia : null,
          temperatura: typeof enVivo.temperatura === "number" ? enVivo.temperatura : null,
        },
      ]
    }
    return []
  }, [lecturasPractica, puntosEnVivo, maxMuestras, enVivo])

  const ticksMuestra = Array.from({ length: maxMuestras }, (_, i) => i + 1)

  const estadoVisible = hayDatosEnVivo
    ? "En práctica"
    : hayUltimoMuestreo
      ? "Último muestreo"
      : penduloSeleccionado
        ? etiquetaEstadoCatalogo(penduloSeleccionado.estado)
        : "Sin registro"

  const badgeEstadoClass = hayDatosEnVivo
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : hayUltimoMuestreo
      ? "bg-primary/15 text-primary border-primary/30"
      : penduloSeleccionado?.estado === "Activo"
        ? "bg-primary/15 text-primary border-primary/30"
        : penduloSeleccionado?.estado === "En_mantenimiento"
          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
          : "bg-muted text-muted-foreground border-border"

  const textoActualizacion =
    segundosDesdeUltimoDato === null
      ? null
      : segundosDesdeUltimoDato < 5
        ? "hace un instante"
        : `hace ${segundosDesdeUltimoDato}s`

  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="font-semibold">Péndulo {penduloId}</h1>
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
                  Iniciar sesión
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Información del péndulo</CardTitle>
                <Badge className={badgeEstadoClass}>{estadoVisible}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {cargandoPendulos ? (
                <p className="text-sm text-muted-foreground">Cargando datos del péndulo...</p>
              ) : !penduloSeleccionado ? (
                <p className="text-sm text-muted-foreground">
                  Este péndulo no está registrado en la red.
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Institución</p>
                    <p className="font-medium">{penduloSeleccionado.institucion}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {penduloSeleccionado.pais}
                  </div>
                  {(penduloSeleccionado.latitud || penduloSeleccionado.longitud) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Latitud</p>
                        <p className="font-medium font-mono">{penduloSeleccionado.latitud}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Longitud</p>
                        <p className="font-medium font-mono">{penduloSeleccionado.longitud}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(typeof enVivo?.oscilacionesConfirmadas === "number" ||
                typeof enVivo?.oscilaciones === "number" ||
                typeof enVivo?.distanciaMuroConfirmada === "number" ||
                typeof enVivo?.distanciaMuro === "number") && (
                <div className="pt-4 border-t border-border space-y-3">
                  <h4 className="font-medium text-sm">Última práctica</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {(limitarOscilaciones(enVivo?.oscilacionesConfirmadas) ??
                      limitarOscilaciones(enVivo?.oscilaciones)) && (
                      <div>
                        <p className="text-muted-foreground">Oscilaciones</p>
                        <p className="font-medium">
                          {limitarOscilaciones(enVivo?.oscilacionesConfirmadas) ??
                            limitarOscilaciones(enVivo?.oscilaciones)}
                        </p>
                      </div>
                    )}
                    {(typeof enVivo?.distanciaMuroConfirmada === "number" ||
                      typeof enVivo?.distanciaMuro === "number") && (
                      <div>
                        <p className="text-muted-foreground">Distancia del muro</p>
                        <p className="font-medium">
                          {enVivo.distanciaMuroConfirmada ?? enVivo.distanciaMuro} cm
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                {user ? (
                  <Link href="/dashboard/reservas">
                    <Button className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Agendar sesión
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

          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Último muestreo
                {textoActualizacion ? ` · ${textoActualizacion}` : ""}
                {cargandoEnVivo ? " · cargando…" : ""}
              </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs">Muestras</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {hayUltimoMuestreo ? (
                      <>
                        {formatNumber(enVivo?.muestras, 0)}
                        <span className="text-sm font-normal text-muted-foreground"> / {maxMuestras}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Período</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {formatNumber(enVivo?.periodo, 5)}{" "}
                    <span className="text-sm font-normal">s</span>
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Gauge className="w-4 h-4" />
                    <span className="text-xs">Gravedad</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {formatNumber(enVivo?.gravedad, 5)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-xs">Temperatura</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {formatNumber(enVivo?.temperatura, 2)}{" "}
                    <span className="text-sm font-normal">°C</span>
                  </p>
                </CardContent>
              </Card>
            </div>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">Período por muestra</CardTitle>
                    <CardDescription>
                      {hayDatosEnVivo
                        ? `Práctica en curso (1 a ${maxMuestras} oscilaciones)`
                        : `Último muestreo registrado (hasta ${maxMuestras} oscilaciones)`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div
                      className={`w-2 h-2 rounded-full ${hayDatosEnVivo ? "bg-green-500 animate-pulse" : hayUltimoMuestreo ? "bg-primary" : "bg-muted-foreground"}`}
                    />
                    {hayDatosEnVivo
                      ? "Práctica en vivo"
                      : hayUltimoMuestreo
                        ? "Último muestreo"
                        : "Sin mediciones"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center px-4">
                      No hay un muestreo en Firestore todavía. Cuando el péndulo mida, aquí verás
                      el último período, gravedad y temperatura, y la gráfica se irá llenando.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          type="number"
                          dataKey="muestra"
                          domain={[1, maxMuestras]}
                          ticks={ticksMuestra}
                          interval={0}
                          allowDecimals={false}
                          tick={{ fill: "var(--muted-foreground)", fontSize: maxMuestras > 12 ? 10 : 12 }}
                          label={{
                            value: "Muestra",
                            position: "insideBottom",
                            offset: -4,
                            fill: "var(--muted-foreground)",
                          }}
                        />
                        <YAxis
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            color: "var(--foreground)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="periodo"
                          name="Período (s)"
                          stroke="var(--chart-1)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <CameraStream penduloId={penduloId} isLive={hayDatosEnVivo} />
          </div>
        </div>

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
