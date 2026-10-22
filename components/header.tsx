"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { IconoPendulo } from "@/components/IconoPendulo"
import { NOMBRE_PROYECTO, NOMBRE_RED, SIGLA_PROYECTO } from "@/lib/marca"
import { obtenerRutaInicioPorRol } from "@/lib/rutas"
import { cn } from "@/lib/utils"

function navigationFor(panelHref: string) {
  return [
    { name: "Inicio", href: "/" },
    { name: "Dashboard", href: panelHref },
    { name: "Reservas", href: "/reservas" },
    { name: NOMBRE_RED, href: "/mapa" },
    { name: "Acerca de", href: "/#about" },
  ]
}

function isCurrent(href: string, pathname: string) {
  if (href === "/") return pathname === "/"
  if (href.startsWith("/#")) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, rol, logout } = useAuth()
  const pathname = usePathname()
  const navigation = navigationFor(user ? obtenerRutaInicioPorRol(rol) : "/dashboard")

  const handleLogout = async () => {
    await logout()
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-border bg-[rgb(20_21_23/0.86)] backdrop-blur-[10px]"
          : "border-transparent bg-background",
      )}
    >
      <nav className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <IconoPendulo className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="font-display text-base font-semibold leading-none text-foreground">{SIGLA_PROYECTO}</span>
            <span className="mt-1 block max-w-[11rem] truncate font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground sm:max-w-[16rem]">
              {NOMBRE_PROYECTO}
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "text-sm font-medium tracking-[.02em] transition-colors",
                isCurrent(item.href, pathname) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isCurrent(item.href, pathname) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm text-muted-foreground">{user.nombre || user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/registro">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="space-y-1 px-5 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-base text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Iniciar sesión</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
