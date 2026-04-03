"use client"

import { useState } from "react"
import { Activity, ChevronDown, CircleHelp, Facebook, Globe, Instagram, ListChecks } from "lucide-react"

const socialLinks = [
  { name: "Página principal UAC", href: "https://www.uniautonoma.edu.co", icon: Globe },
  { name: "Facebook UAC", href: "https://www.facebook.com/uniautonomadelcauca", icon: Facebook },
  { name: "Instagram UAC", href: "https://www.instagram.com/uniautonomadelcauca", icon: Instagram },
]

const guideSteps = [
  "Regístrate con correo institucional y completa tu perfil.",
  "Consulta disponibilidad en Calendario y agenda un bloque de 30 minutos.",
  "Ingresa a Tiempo Real durante tu turno e inicia la práctica.",
  "Revisa resultados y exporta datos desde Historial.",
]

const faqs = [
  {
    q: "¿Por qué no puedo reservar un horario?",
    a: "Ese bloque ya está ocupado (pending o active). Selecciona otro horario disponible.",
  },
  {
    q: "¿Cuánto dura cada sesión?",
    a: "Cada sesión tiene una duración máxima de 30 minutos.",
  },
  {
    q: "¿Cuándo puedo iniciar la práctica en tiempo real?",
    a: "Solo durante tu turno reservado. Fuera de ese tiempo, el inicio permanece bloqueado.",
  },
]

export function Footer() {
  const [resourceView, setResourceView] = useState<"guide" | "faq">("guide")
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">WPA</span>
                <span className="text-xs text-muted-foreground">UAC</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Laboratorio remoto de péndulo físico para la comunidad académica global.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Redes sociales UAC</h3>
              <ul className="space-y-3">
                {socialLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Ayuda rápida</h3>
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setResourceView("guide")}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    resourceView === "guide"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListChecks className="h-3.5 w-3.5" /> Guía de uso
                </button>
                <button
                  type="button"
                  onClick={() => setResourceView("faq")}
                  className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    resourceView === "faq"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CircleHelp className="h-3.5 w-3.5" /> Preguntas frecuentes
                </button>
              </div>

              {resourceView === "guide" ? (
                <ol className="space-y-2 text-sm text-muted-foreground">
                  {guideSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-2">
                  {faqs.map((item, index) => {
                    const isOpen = openFaq === index
                    return (
                      <div key={item.q} className="rounded-md border border-border">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-foreground"
                        >
                          {item.q}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && <p className="px-3 pb-3 text-sm text-muted-foreground">{item.a}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} World Pendulum Alliance. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Corporación Universitaria Autónoma del Cauca</span>
            <span>Erasmus+</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
