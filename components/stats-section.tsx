const stats = [
  { value: "500+", label: "Experimentos realizados" },
  { value: "15", label: "Universidades conectadas" },
  { value: "1,200+", label: "Estudiantes activos" },
  { value: "99.9%", label: "Disponibilidad del sistema" },
]

export function StatsSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-background"
            >
              <span className="text-4xl font-bold text-primary lg:text-5xl">
                {stat.value}
              </span>
              <span className="mt-2 text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
