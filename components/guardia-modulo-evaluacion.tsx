"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useModuloEvaluacion } from "@/hooks/useModuloEvaluacion"

interface GuardiaModuloEvaluacionProps {
  destino: string
  children: ReactNode
}

export function GuardiaModuloEvaluacion({ destino, children }: GuardiaModuloEvaluacionProps) {
  const router = useRouter()
  const { activo, cargando } = useModuloEvaluacion()

  useEffect(() => {
    if (!cargando && !activo) {
      router.replace(destino)
    }
  }, [activo, cargando, destino, router])

  if (cargando) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando…
      </div>
    )
  }

  if (!activo) return null

  return <>{children}</>
}
