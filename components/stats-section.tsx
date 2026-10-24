"use client"

import { useEffect, useRef, useState } from "react"
import { useEstadisticasLanding } from "@/hooks/useEstadisticasLanding"

function formatStat(value: number, decimals: number) {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function StatFigure({
  target,
  suffix,
  decimals,
  label,
  active,
  loading,
  errored,
}: {
  target: number
  suffix: string
  decimals: number
  label: string
  active: boolean
  loading: boolean
  errored: boolean
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (loading || errored) {
      setCurrent(0)
      return
    }
    if (!active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(target)
      return
    }
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1200)
      const eased = 1 - (1 - progress) ** 3
      setCurrent(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target, loading, errored])

  const display =
    loading || errored ? "—" : `${formatStat(current, decimals)}${suffix}`

  return (
    <div className="border-t border-border pt-6">
      <p className="num whitespace-nowrap text-[clamp(2rem,6vw,2.75rem)] leading-none text-foreground">
        {display}
      </p>
      <p className="mt-3 font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)
  const {
    experimentosRealizados,
    universidadesConectadas,
    estudiantesRegistrados,
    loadingExperimentos,
    loadingEstudiantes,
    loadingUniversidades,
    errorLanding,
    errorPublicas,
    errorPendulos,
  } = useEstadisticasLanding()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setActive(true)
        observer.disconnect()
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const stats = [
    {
      target: experimentosRealizados,
      suffix: "",
      decimals: 0,
      label: "Experimentos realizados",
      loading: loadingExperimentos,
      errored: Boolean(errorPublicas),
    },
    {
      target: universidadesConectadas,
      suffix: "",
      decimals: 0,
      label: "Universidades conectadas",
      loading: loadingUniversidades,
      errored: Boolean(errorPendulos),
    },
    {
      target: estudiantesRegistrados,
      suffix: "",
      decimals: 0,
      label: "Estudiantes registrados",
      loading: loadingEstudiantes,
      errored: Boolean(errorPublicas),
    },
    {
      target: 99.9,
      suffix: "%",
      decimals: 1,
      label: "Disponibilidad del sistema",
      loading: false,
      errored: false,
    },
  ]

  return (
    <section ref={ref} className="py-24 md:py-32" aria-label="Estadísticas del laboratorio">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        {errorLanding && (
          <p className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
            {errorLanding}
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatFigure key={stat.label} {...stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  )
}
