/** Marca de desarrollo para el ingreso. En producción no escribe en consola. */
export function marcarTiempo(etiqueta: string, inicio?: number): number {
  const ahora = typeof performance !== "undefined" ? performance.now() : Date.now()
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    const detalle = inicio == null ? "" : `: ${Math.round(ahora - inicio)} ms`
    console.info(`[ingreso] ${etiqueta}${detalle}`)
    performance.mark?.(`ingreso:${etiqueta}`)
  }
  return ahora
}
