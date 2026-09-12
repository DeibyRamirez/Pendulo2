"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Check, Activity, AlertTriangle, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { escucharPenduloEnVivo, escucharComandosRecientes } from "@/app/services/penduloDataService"
import type { PenduloEnVivo } from "@/hooks/usePenduloData"
import {
  diagnosticarPendulo,
  UMBRAL_SIN_SENAL_S,
  type DiagnosticoPendulo,
  type EstadoComandoDiag,
} from "@/lib/diagnosticoPendulo"

interface PenduloResumen {
  id: string
  pendulo_id: string
  institucion: string
}

interface ComandoReciente {
  id: string
  penduloId?: string
  estado?: "pendiente" | "enviado" | "error"
  errorMsg?: string
  fechaCreacion?: { toDate?: () => Date }
}

function badgeNivel(nivel: DiagnosticoPendulo["nivel"]) {
  if (nivel === "error") return { variant: "destructive" as const, label: "Error" }
  if (nivel === "aviso") return { variant: "outline" as const, label: "Aviso" }
  return { variant: "outline" as const, label: "Info" }
}

function ComandoCopiable({ comando }: { comando: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(comando)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="rounded-md border border-border bg-muted/40 p-2 space-y-2">
      <pre className="text-[11px] font-mono whitespace-pre-wrap break-all text-foreground">{comando}</pre>
      <Button type="button" size="sm" variant="outline" onClick={() => void copiar()}>
        {copiado ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
        {copiado ? "Copiado" : "Copiar comando"}
      </Button>
    </div>
  )
}

function TarjetaDiagnostico({
  pendulo,
  enVivo,
  comando,
  ahora,
}: {
  pendulo: PenduloResumen
  enVivo: PenduloEnVivo | null
  comando: ComandoReciente | undefined
  ahora: number
}) {
  const segundos = (() => {
    const fecha = enVivo?.actualizadoEn?.toDate?.()
    if (!fecha) return null
    return Math.floor((ahora - fecha.getTime()) / 1000)
  })()

  const diagnostico = diagnosticarPendulo({
    ultimoRaw: enVivo?.ultimoRaw,
    estadoDispositivo: enVivo?.estadoDispositivo,
    estado: enVivo?.estado,
    errorCodigo: enVivo?.errorCodigo,
    errorMensaje: enVivo?.errorMensaje,
    periodo: enVivo?.periodo,
    gravedad: enVivo?.gravedad,
    medicionInvalida: enVivo?.medicionInvalida,
    segundosDesdeUltimoDato: segundos,
    estadoComando: (comando?.estado as EstadoComandoDiag) ?? null,
    errorComando: comando?.errorMsg ?? null,
    umbralSinSenal: UMBRAL_SIN_SENAL_S,
  })

  const badge = badgeNivel(diagnostico.nivel)
  const borde =
    diagnostico.nivel === "error"
      ? "border-destructive/40"
      : diagnostico.nivel === "aviso"
        ? "border-amber-500/40"
        : "border-border"

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${borde}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{pendulo.pendulo_id}</p>
          <p className="text-xs text-muted-foreground">{pendulo.institucion}</p>
        </div>
        <Badge
          variant={badge.variant}
          className={
            diagnostico.nivel === "aviso"
              ? "border-amber-500/60 text-amber-700 dark:text-amber-400"
              : diagnostico.nivel === "info"
                ? "border-chart-2/50 text-chart-2"
                : undefined
          }
        >
          {diagnostico.nivel === "error" && <AlertTriangle className="h-3 w-3" />}
          {diagnostico.nivel === "info" && <Info className="h-3 w-3" />}
          {badge.label} · {diagnostico.codigo}
        </Badge>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{diagnostico.titulo}</p>
        <p className="text-xs text-muted-foreground mt-1">{diagnostico.resumen}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/30 p-2">
          <p className="text-muted-foreground">Causa</p>
          <p className="text-foreground mt-0.5">{diagnostico.causa}</p>
        </div>
        <div className="rounded-md bg-muted/30 p-2">
          <p className="text-muted-foreground">Solución</p>
          <p className="text-foreground mt-0.5">{diagnostico.solucion}</p>
        </div>
      </div>

      {diagnostico.comando && <ComandoCopiable comando={diagnostico.comando} />}

      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground font-mono">
        <span>Última actualización: {segundos === null ? "sin datos" : `hace ${segundos}s`}</span>
        {enVivo?.estadoFirmware && <span>Firmware: {enVivo.estadoFirmware}</span>}
        {enVivo?.estadoDispositivo && <span>Dispositivo: {enVivo.estadoDispositivo}</span>}
        {typeof enVivo?.periodo === "number" && <span>T={enVivo.periodo.toFixed(4)}s</span>}
        {typeof enVivo?.gravedad === "number" && <span>g={enVivo.gravedad.toFixed(2)}</span>}
      </div>
      {enVivo?.ultimoRaw && (
        <p className="text-[11px] font-mono text-muted-foreground break-all">
          ultimoRaw: {enVivo.ultimoRaw}
        </p>
      )}
    </div>
  )
}

export function DiagnosticoPenduloAdmin({ pendulos }: { pendulos: PenduloResumen[] }) {
  const [enVivoPorId, setEnVivoPorId] = useState<Record<string, PenduloEnVivo | null>>({})
  const [comandos, setComandos] = useState<ComandoReciente[]>([])
  const [ahora, setAhora] = useState(() => Date.now())

  const idsDatos = useMemo(
    () => [...new Set(pendulos.map((p) => p.pendulo_id).filter(Boolean))],
    [pendulos],
  )
  const idsClave = idsDatos.join(",")

  useEffect(() => {
    const interval = window.setInterval(() => setAhora(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const ids = idsClave.length > 0 ? idsClave.split(",") : []
    if (ids.length === 0) return
    const unsubs = ids.map((penduloId) =>
      escucharPenduloEnVivo(
        penduloId,
        (data: PenduloEnVivo | null) => {
          setEnVivoPorId((prev) => ({ ...prev, [penduloId]: data }))
        },
        (err: Error) => console.error("Error escuchando diagnóstico del péndulo:", err),
      ),
    )
    return () => {
      unsubs.forEach((fn) => fn())
    }
  }, [idsClave])

  useEffect(() => {
    return escucharComandosRecientes(
      40,
      (lista: ComandoReciente[]) => setComandos(lista),
      (err: Error) => console.error("Error escuchando comandos del péndulo:", err),
    )
  }, [])

  const comandoPorPendulo = useMemo(() => {
    const mapa = new Map<string, ComandoReciente>()
    for (const cmd of comandos) {
      const id = cmd.penduloId
      if (!id || mapa.has(id)) continue
      mapa.set(id, cmd)
    }
    return mapa
  }, [comandos])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" /> Diagnóstico del péndulo
        </CardTitle>
        <CardDescription>
          Estados del dsPic (IDS / RESETED / STOPED), errores de láser y comandos del bridge. Para ver
          RESETED en vivo, Node-RED debe publicar las líneas de debug 14 en el tópico pendulo/estado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendulos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay péndulos registrados.</p>
        ) : (
          pendulos.map((p) => (
            <TarjetaDiagnostico
              key={p.id}
              pendulo={p}
              enVivo={enVivoPorId[p.pendulo_id] ?? null}
              comando={comandoPorPendulo.get(p.pendulo_id)}
              ahora={ahora}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
