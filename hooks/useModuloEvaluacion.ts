"use client"

import { useEffect, useState } from "react"
import { escucharModuloEvaluacion } from "@/lib/moduloEvaluacion"

export function useModuloEvaluacion() {
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cancelar = escucharModuloEvaluacion(
      (valor) => {
        setActivo(valor)
        setCargando(false)
        setError(null)
      },
      (err) => {
        setActivo(false)
        setCargando(false)
        setError(err.message)
      }
    )
    return cancelar
  }, [])

  return { activo, cargando, error }
}
