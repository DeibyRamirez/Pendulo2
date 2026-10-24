import { CircuitBoard, Database, Monitor, type LucideIcon } from "lucide-react"
import { NOMBRE_PROYECTO, NOMBRE_RED } from "@/lib/marca"
import { Corners } from "@/components/lab/corners"
import { SectionHeader } from "@/components/lab/section-header"
import { Reveal } from "@/components/lab/reveal"

export function AboutSection() {
  return (
    <>
      <section id="about" data-tema="marfil" className="scroll-mt-24 bg-background py-24 text-foreground md:py-32">
        <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeader
              index="03"
              kicker="Acerca del proyecto"
              title={NOMBRE_PROYECTO}
            />
            <div className="mt-6 max-w-[42ch] space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Este proyecto surge del convenio entre la{" "}
                <strong className="font-semibold text-foreground">Corporación Universitaria Autónoma del Cauca</strong> y la{" "}
                <strong className="font-semibold text-foreground">Universidad de los Andes (UNIANDES)</strong>, dentro de la {NOMBRE_RED}.
              </p>
              <p>
                La red reúne laboratorios remotos de péndulo físico para que estudiantes y docentes hagan el experimento en tiempo real, desde cualquier lugar con internet.
              </p>
              <a
                href="https://www.worldpendulumalliance.org"
                target="_blank"
                rel="noopener noreferrer"
                className="enlace inline-block pt-2 font-semibold text-primary"
              >
                Conocer más sobre la alianza
              </a>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <blockquote
              className="relative overflow-hidden border border-border/60 border-l-2 border-l-primary bg-[var(--color-naranja-tinte)] p-6 not-italic text-base leading-relaxed text-[var(--color-grafito)] sm:p-8 sm:text-lg"
            >
              <Corners />
              Un péndulo físico en Popayán, medido en el laboratorio y leído desde cualquier aula de la red.
            </blockquote>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32" aria-labelledby="arquitectura-titulo">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8">
          <Reveal>
            <SectionHeader
              index="04"
              kicker="Arquitectura"
              title="Del sensor a la pantalla"
              titleId="arquitectura-titulo"
              lead="La Raspberry Pi mide, Firebase reparte la telemetría y la aplicación la muestra."
            />
          </Reveal>
          <div className="relative mt-12 overflow-hidden border border-border bg-card/40 p-4 sm:p-6 md:p-8">
            <Corners />
            <div
              className="arch-flow grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4"
              role="list"
              aria-label="Flujo de datos del laboratorio"
            >
              <Reveal delay={0} className="min-w-0 h-full">
                <Node icon={CircuitBoard} title="Raspberry Pi" detail="Captura de datos del péndulo" />
              </Reveal>
              <Reveal delay={80} className="flex min-w-0 justify-center self-center">
                <Connector />
              </Reveal>
              <Reveal delay={160} className="min-w-0 h-full">
                <Node icon={Database} title="Firebase" detail="Base de datos en tiempo real" />
              </Reveal>
              <Reveal delay={240} className="flex min-w-0 justify-center self-center">
                <Connector />
              </Reveal>
              <Reveal delay={320} className="min-w-0 h-full">
                <Node icon={Monitor} title="Aplicación web" detail="Interfaz del laboratorio" emphasis />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function Node({
  icon: Icon,
  title,
  detail,
  emphasis = false,
}: {
  icon: LucideIcon
  title: string
  detail: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`arch-node h-full min-w-0 border px-3 py-4 transition-[border-color,box-shadow,transform] duration-300 ease-out sm:px-5 sm:py-6 ${
        emphasis ? "border-primary bg-card" : "border-border bg-card"
      }`}
      role="listitem"
    >
      <div
        className={`arch-node-icon mb-3 flex h-10 w-10 items-center justify-center border transition-transform duration-300 ${
          emphasis ? "border-primary/30 bg-primary/10" : "border-border bg-muted/40"
        }`}
      >
        <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="font-display text-base font-medium leading-tight text-foreground sm:text-lg md:text-xl">{title}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{detail}</p>
      {emphasis ? (
        <p className="mt-2 font-mono text-[.625rem] uppercase tracking-[.12em] text-primary">Destino</p>
      ) : null}
    </div>
  )
}

function Connector() {
  return (
    <svg viewBox="0 0 80 16" className="arch-connector h-4 w-10 shrink-0 sm:w-14" aria-hidden>
      <circle cx="2" cy="8" r="1.5" fill="var(--color-naranja)" opacity="0.85" />
      <circle cx="78" cy="8" r="1.5" fill="var(--color-naranja)" opacity="0.85" />
      <line x1="0" y1="8" x2="80" y2="8" stroke="rgb(247 245 241 / .18)" strokeWidth="1" />
      <line className="pulso" x1="0" y1="8" x2="80" y2="8" stroke="var(--color-naranja)" strokeWidth="1.5" />
    </svg>
  )
}
