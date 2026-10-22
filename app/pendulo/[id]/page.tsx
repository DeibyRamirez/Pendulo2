"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { getDashboardPathByRole } from "@/lib/roles"
import { IconoPendulo } from "@/components/IconoPendulo"
import { NOMBRE_PROYECTO, NOMBRE_RED } from "@/lib/marca"
import { VistaPublicaPendulo } from "@/components/vista-publica-pendulo"
import {
  buscarPenduloEnCatalogo,
  resolverIdTelemetria,
} from "@/lib/penduloEnVivo"
import { usePendulos } from "@/hooks/usePendulos"

export default function PenduloPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const { user, rol } = useAuth()
  const { pendulos } = usePendulos()

  const penduloSeleccionado = useMemo(
    () => buscarPenduloEnCatalogo(pendulos, resolvedParams.id),
    [pendulos, resolvedParams.id],
  )
  const penduloId = resolverIdTelemetria(resolvedParams.id, penduloSeleccionado)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <IconoPendulo className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Péndulo {penduloId}</h1>
              <p className="text-xs text-muted-foreground">{NOMBRE_PROYECTO}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href={`/${getDashboardPathByRole(rol)}`}>
                <Button size="sm" variant="outline" className="touch-target">
                  <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ir a mi panel</span>
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

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <VistaPublicaPendulo catalogId={resolvedParams.id} />

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Este péndulo forma parte de la {NOMBRE_RED}
          </p>
          <p className="text-xs text-muted-foreground">
            Convenio UAC - Universidad de los Andes
          </p>
        </div>
      </main>
    </div>
  )
}
