import { Activity } from "lucide-react"
import Link from "next/link"

const footerLinks = {
  platform: [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Reservas", href: "/reservas" },
    { name: "Historial", href: "/historial" },
  ],
  resources: [
    { name: "Documentación", href: "#" },
    { name: "Guía de uso", href: "#" },
    { name: "Preguntas frecuentes", href: "#" },
  ],
  legal: [
    { name: "Términos de uso", href: "#" },
    { name: "Privacidad", href: "#" },
    { name: "Contacto", href: "#" },
  ],
}

export function Footer() {
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

          {/* Links */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Plataforma</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Recursos</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} World Pendulum Alliance. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Corporación Universitaria Autónoma del Cauca</span>
            <span>Universidad de los Andes</span>
            <span>Erasmus+</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
