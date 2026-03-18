import { 
  Activity, 
  Calendar, 
  History, 
  Users, 
  Globe, 
  Shield 
} from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "Visualización en Tiempo Real",
    description: "Observa las oscilaciones, velocidad angular y posición del péndulo mientras se ejecuta tu experimento, con gráficas actualizadas en milisegundos.",
  },
  {
    icon: Calendar,
    title: "Sistema de Reservas",
    description: "Agenda tus sesiones experimentales a través de un calendario intuitivo. Selecciona fecha, hora y duración de tu práctica.",
  },
  {
    icon: History,
    title: "Historial de Experimentos",
    description: "Accede a todos tus datos pasados, descarga reportes en PDF y compara resultados entre diferentes sesiones.",
  },
  {
    icon: Users,
    title: "Gestión de Usuarios",
    description: "Roles diferenciados para estudiantes, docentes y administradores con permisos específicos según sus necesidades.",
  },
  {
    icon: Globe,
    title: "Acceso Global",
    description: "Conecta desde cualquier lugar con Internet. Forma parte de la World Pendulum Alliance y colabora con universidades de todo el mundo.",
  },
  {
    icon: Shield,
    title: "Datos Seguros",
    description: "Tus experimentos y datos están protegidos con autenticación segura y respaldos automáticos en la nube.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-medium uppercase tracking-wider text-primary mb-4">
            Características
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Todo lo que necesitas para experimentar remotamente
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Una plataforma completa diseñada para facilitar el aprendizaje de física 
            a través de experimentos reales controlados a distancia.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
