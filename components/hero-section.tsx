"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, QrCode } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left content */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Laboratorio Remoto Activo
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Experimenta la física{" "}
              <span className="text-primary">sin fronteras.</span>
            </h1>

            <p className="text-lg leading-relaxed text-muted-foreground">
              Accede al péndulo físico de la Corporación Universitaria Autónoma del Cauca 
              desde cualquier lugar del mundo. Visualiza datos en tiempo real, agenda sesiones 
              experimentales y forma parte de la red global de laboratorios remotos.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Acceder al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Ver demostración
                </Link>
              </Button>
            </div>

            {/* Partner logos */}
            <div className="pt-8 border-t border-border">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
                Proyecto colaborativo con
              </p>
              <div className="flex flex-wrap items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">UAC</span>
                  <span className="text-xs text-muted-foreground">Corp. Universitaria Autónoma del Cauca</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">UNIANDES</span>
                  <span className="text-xs text-muted-foreground">Universidad de los Andes</span>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">Erasmus+</span>
                  <span className="text-xs text-muted-foreground">Unión Europea</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right content - Pendulum visualization */}
          <div className="relative">
            <div className="relative aspect-square rounded-2xl border border-border bg-card p-8 overflow-hidden">
              {/* Animated pendulum visualization */}
              <div className="absolute inset-0 flex items-start justify-center pt-8">
                <div className="relative">
                  {/* Pivot point */}
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  
                  {/* Pendulum arm and bob */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 origin-top animate-pendulum">
                    <div className="h-48 w-0.5 bg-gradient-to-b from-primary to-primary/50" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-primary shadow-lg shadow-primary/50" />
                  </div>

                  {/* Motion trail */}
                  <div className="absolute top-52 left-1/2 -translate-x-1/2 h-0.5 w-40 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </div>
              </div>

              {/* Data overlay cards */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-4">
                <div className="flex-1 rounded-lg border border-border bg-background/80 backdrop-blur-sm p-3">
                  <p className="text-xs text-muted-foreground">Ángulo</p>
                  <p className="text-xl font-bold text-foreground">15.7°</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background/80 backdrop-blur-sm p-3">
                  <p className="text-xs text-muted-foreground">Velocidad</p>
                  <p className="text-xl font-bold text-foreground">0.42 m/s</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-background/80 backdrop-blur-sm p-3">
                  <p className="text-xs text-muted-foreground">Período</p>
                  <p className="text-xl font-bold text-foreground">2.01 s</p>
                </div>
              </div>

              {/* QR Code badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 rounded-lg border border-border bg-background/80 backdrop-blur-sm px-3 py-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Escanea para acceder</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pendulum {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        .animate-pendulum {
          animation: pendulum 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
