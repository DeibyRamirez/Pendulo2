"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { Atom, Maximize2, Send, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useChatIA } from "@/hooks/useChatIA"
import { MensajeChat } from "@/components/chat/MensajeChat"

/**
 * Burbuja flotante del asistente de física para la portada.
 * Con sesión permite chatear (con ID token) o ir al chat completo; sin sesión
 * solo invita a iniciar sesión y no llama a /api/chat.
 */
export function BurbujaChatFlotante() {
  const { user, loading } = useAuth()
  const { mensajes, enviarMensaje, cargando, error, limpiarChat } = useChatIA()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const campoRef = useRef<HTMLTextAreaElement>(null)
  const finRef = useRef<HTMLDivElement>(null)

  // Cierre con Escape.
  useEffect(() => {
    if (!abierto) return
    const alPresionar = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false)
    }
    window.addEventListener("keydown", alPresionar)
    return () => window.removeEventListener("keydown", alPresionar)
  }, [abierto])

  // Foco en el campo al abrir (solo con sesión).
  useEffect(() => {
    if (abierto && user) campoRef.current?.focus()
  }, [abierto, user])

  // Auto-scroll al final.
  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes, cargando, abierto])

  const enviar = async () => {
    const limpio = texto.trim()
    if (!limpio) return
    setTexto("")
    await enviarMensaje(limpio)
  }

  const alPresionarTecla = (evento: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault()
      void enviar()
    }
  }

  return (
    <>
      {abierto && (
        <div
          role="dialog"
          aria-label="Asistente de física"
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[480px] sm:w-[360px]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2.5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Atom className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">
                  Asistente de física
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  Physics AI · solo preguntas de Física
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && mensajes.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={limpiarChat}
                  aria-label="Limpiar conversación"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : !user ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Atom className="h-8 w-8 text-primary/60" />
              <p className="text-sm text-muted-foreground">
                Inicia sesión para hablar con el asistente
              </p>
              <Button asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {mensajes.length === 0 && !cargando && (
                  <div className="flex flex-col items-center gap-3 text-center pt-8">
                    <Atom className="h-8 w-8 text-primary/60" />
                    <p className="text-sm text-muted-foreground max-w-[240px]">
                      Pregúntame sobre mecánica, ondas, termodinámica o cualquier tema de Física.
                    </p>
                  </div>
                )}

                {mensajes.map((mensaje) => (
                  <MensajeChat key={mensaje.id} mensaje={mensaje} />
                ))}

                {cargando && (
                  <p className="text-xs text-muted-foreground">El asistente está escribiendo…</p>
                )}
                {error && <p className="text-xs text-destructive">{error}</p>}
                <div ref={finRef} />
              </div>

              <div className="shrink-0 border-t border-border px-3 py-3 space-y-2">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/50">
                  <textarea
                    ref={campoRef}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={alPresionarTecla}
                    placeholder="Escribe tu pregunta…"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-5 max-h-24"
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7 rounded-lg shrink-0"
                    disabled={!texto.trim() || cargando}
                    onClick={() => void enviar()}
                    aria-label="Enviar mensaje"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/agente-ia">
                    <Maximize2 className="h-3.5 w-3.5 mr-2" />
                    Abrir chat completo
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir asistente de física"
          className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
        >
          <Atom className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}
    </>
  )
}
