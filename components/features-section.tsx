import {
  Activity,
  Calendar,
  History,
  Users,
  Globe,
  Shield,
} from "lucide-react"
import { NOMBRE_RED } from "@/lib/marca"
import { SectionHeader } from "@/components/lab/section-header"
import { Reveal } from "@/components/lab/reveal"

const features = [
  {
    icon: Activity,
    title: "Visualización en tiempo real",
    description: "Observa las oscilaciones, la velocidad angular y la posición del péndulo mientras corre el experimento.",
  },
  {
    icon: Calendar,
    title: "Sistema de reservas",
    description: "Agenda la sesión en el calendario. Elige fecha, hora y un bloque de hasta 30 minutos.",
  },
  {
    icon: History,
    title: "Historial de experimentos",
    description: "Vuelve a tus datos, descarga el reporte y compara sesiones anteriores.",
  },
  {
    icon: Users,
    title: "Gestión de usuarios",
    description: "Estudiantes, docentes y administradores entran con permisos distintos.",
  },
  {
    icon: Globe,
    title: "Acceso global",
    description: `Conéctate desde cualquier lugar con internet y forma parte de la ${NOMBRE_RED}.`,
  },
  {
    icon: Shield,
    title: "Datos seguros",
    description: "La autenticación y los respaldos en la nube protegen cada práctica.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" data-tema="marfil" className="scroll-mt-24 bg-background py-24 text-foreground md:py-32">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <Reveal>
          <SectionHeader
            index="02"
            kicker="Características"
            title="Lo necesario para experimentar a distancia"
            lead="Una plataforma para aprender física con un péndulo real, controlado desde el laboratorio."
          />
        </Reveal>

        <ul className="feature-list mt-12 grid gap-x-12 md:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal key={feature.title} variant="x" delay={index * 100}>
              <li className="feature-row grid grid-cols-[3rem_1fr] gap-3 border-b border-border py-6 transition-[filter,opacity] duration-300">
                <span className="num pt-1 text-lg text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <feature.icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                    <h3 className="font-display text-[1.375rem] font-medium leading-[1.1] tracking-[-0.02em]">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
