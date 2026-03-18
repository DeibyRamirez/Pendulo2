import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left - Project info */}
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Acerca del Proyecto
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              World Pendulum Alliance
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Este proyecto surge en el marco del convenio entre la{" "}
                <strong className="text-foreground">Corporación Universitaria Autónoma del Cauca</strong> y la{" "}
                <strong className="text-foreground">Universidad de los Andes (UNIANDES)</strong>, como parte 
                de la iniciativa internacional World Pendulum Alliance (WPA).
              </p>
              <p>
                La WPA busca construir una red global de laboratorios remotos basados en péndulos 
                físicos, permitiendo que estudiantes y docentes de distintas universidades del 
                mundo realicen experimentos científicos en tiempo real desde cualquier lugar 
                con conexión a Internet.
              </p>
              <p>
                Financiado por el programa <strong className="text-foreground">Erasmus+</strong> de la 
                Unión Europea, este proyecto representa un paso importante hacia la democratización 
                de la educación científica experimental.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="https://www.worldpendulumalliance.org" target="_blank" rel="noopener noreferrer">
                Conocer más sobre WPA
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Right - Architecture diagram */}
          <div className="relative">
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Arquitectura del Sistema
              </h3>
              <div className="space-y-4">
                {/* Raspberry Pi */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20 text-chart-3">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <circle cx="8" cy="8" r="1" />
                      <circle cx="16" cy="8" r="1" />
                      <circle cx="8" cy="16" r="1" />
                      <circle cx="16" cy="16" r="1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Raspberry Pi</p>
                    <p className="text-sm text-muted-foreground">Captura de datos del péndulo</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="h-8 w-0.5 bg-border relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-border" />
                  </div>
                </div>

                {/* Firebase */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-background">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-4/20 text-chart-4">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 18L12 22L20 18V6L12 2L4 6V18Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <path d="M12 22V12" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 6L12 10L20 6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Firebase / Cloud</p>
                    <p className="text-sm text-muted-foreground">Base de datos en tiempo real</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="h-8 w-0.5 bg-border relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-border" />
                  </div>
                </div>

                {/* Web App */}
                <div className="flex items-center gap-4 p-4 rounded-lg border border-primary/50 bg-primary/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9H21"/>
                      <path d="M9 21V9"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Aplicación Web</p>
                    <p className="text-sm text-muted-foreground">Interfaz de usuario interactiva</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
