"use client"

import type { Timestamp } from "firebase/firestore"
import { AlertTriangle } from "lucide-react"
import { usePenduloData } from "@/hooks/usePenduloData"
import { PENDULO_PRINCIPAL_ID } from "@/lib/constantes"
import { Skeleton } from "@/components/ui/skeleton"

function formatearValor(valor: number | undefined): string {
  if (typeof valor !== "number" || Number.isNaN(valor)) return "—"
  return valor.toFixed(2)
}

function formatearFecha(fecha: Timestamp | undefined): string | null {
  const convertida = fecha?.toDate?.()
  if (!convertida) return null
  return convertida.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Indicadores públicos de la última medición del péndulo principal.
 * Se suscribe a un único documento de Firestore y se desuscribe al desmontar.
 */
export function IndicadoresUltimaPrueba() {
  const { enVivo, loading, error } = usePenduloData(PENDULO_PRINCIPAL_ID)

  if (loading && !enVivo) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Cargando última medición">
        {[0, 1, 2, 3].map((indice) => (
          <div key={indice} className="rounded-lg border border-border bg-background/60 p-3">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!enVivo) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {error ? "No se pudieron cargar las mediciones." : "Sin mediciones disponibles"}
      </p>
    )
  }

  const indicadores = [
    { etiqueta: "Gravedad", valor: enVivo.gravedad, unidad: "m/s²" },
    { etiqueta: "Frecuencia", valor: enVivo.frecuencia, unidad: "Hz" },
    { etiqueta: "Periodo", valor: enVivo.periodo, unidad: "s" },
    { etiqueta: "Temperatura", valor: enVivo.temperatura, unidad: "°C" },
  ]

  const fecha = formatearFecha(enVivo.actualizadoEn)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {indicadores.map((indicador) => (
          <div
            key={indicador.etiqueta}
            className="rounded-lg border border-border bg-background/60 p-3"
          >
            <p className="text-xs text-muted-foreground">{indicador.etiqueta}</p>
            <p className="text-lg font-bold font-mono text-foreground">
              {formatearValor(indicador.valor)}{" "}
              <span className="text-xs font-normal text-muted-foreground">{indicador.unidad}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {fecha && (
          <p className="text-xs text-muted-foreground">Última medición: {fecha}</p>
        )}
        {enVivo.medicionInvalida === true && (
          <p className="inline-flex items-center gap-1 text-xs text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            La última medición no superó la validación
          </p>
        )}
      </div>
    </div>
  )
}
