import { NOMBRE_PROYECTO, NOMBRE_RED } from "@/lib/marca"
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
            <blockquote className="bg-[var(--color-naranja-tinte)] p-8 text-lg leading-relaxed text-[var(--color-grafito)]">
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
              lead="La Raspberry Pi mide, Firebase reparte la telemetría y la aplicación la muestra."
            />
          </Reveal>
          <div className="mt-12 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <Node title="Raspberry Pi" detail="Captura de datos del péndulo" />
            <Connector />
            <Node title="Firebase" detail="Base de datos en tiempo real" />
            <Connector />
            <Node title="Aplicación web" detail="Interfaz del laboratorio" emphasis />
          </div>
        </div>
      </section>
    </>
  )
}

function Node({ title, detail, emphasis = false }: { title: string; detail: string; emphasis?: boolean }) {
  return (
    <div className={`border px-5 py-6 ${emphasis ? "border-primary" : "border-border bg-card"}`}>
      <p className="font-display text-xl font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function Connector() {
  return (
    <svg viewBox="0 0 80 16" className="mx-auto h-4 w-20 rotate-90 md:w-full md:rotate-0" aria-hidden>
      <line x1="0" y1="8" x2="80" y2="8" stroke="rgb(247 245 241 / .18)" strokeWidth="1" />
      <line className="pulso" x1="0" y1="8" x2="80" y2="8" stroke="var(--color-naranja)" strokeWidth="1.5" />
    </svg>
  )
}
