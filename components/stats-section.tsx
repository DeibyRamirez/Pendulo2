"use client"

import { useEffect, useRef, useState } from "react"

const stats = [
  { value: 500, suffix: "+", decimals: 0, label: "Experimentos realizados" },
  { value: 15, suffix: "", decimals: 0, label: "Universidades conectadas" },
  { value: 1200, suffix: "+", decimals: 0, label: "Estudiantes activos" },
  { value: 99.9, suffix: "%", decimals: 1, label: "Disponibilidad del sistema" },
]

function formatStat(value: number, decimals: number) {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function StatFigure({
  value,
  suffix,
  decimals,
  label,
  active,
}: {
  value: number
  suffix: string
  decimals: number
  label: string
  active: boolean
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value)
      return
    }
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 1200)
      const eased = 1 - (1 - progress) ** 3
      setCurrent(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, value])

  return (
    <div className="border-t border-border pt-6">
      <p className="num whitespace-nowrap text-[clamp(2rem,6vw,2.75rem)] leading-none text-foreground">
        {formatStat(current, decimals)}
        {suffix}
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

  return (
    <section ref={ref} className="py-24 md:py-32">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-10 px-5 md:px-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatFigure key={stat.label} {...stat} active={active} />
        ))}
      </div>
    </section>
  )
}
