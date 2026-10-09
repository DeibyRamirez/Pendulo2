"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Trash2, Atom, Zap, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useChatIA } from "@/hooks/useChatIA"
import { MensajeChat } from "@/components/chat/MensajeChat"

// -----------------------------------------------------------
// SUGGESTED QUESTIONS
// -----------------------------------------------------------
const SUGGESTIONS = [
  "¿Qué es la mecánica cuántica?",
  "Explica la relatividad especial de Einstein",
  "¿Cómo funciona la fisión nuclear?",
  "¿Qué es un campo electromagnético?",
  "Diferencia entre energía cinética y potencial",
]

// -----------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------
export default function AgenteIAPage() {
  const { mensajes, enviarMensaje, cargando, error, limpiarChat } = useChatIA()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes, cargando])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [input])

  // Enviar MENSAJE -> POST /api/chat (con ID token, vía useChatIA)
  const sendMessage = async (text: string = input) => {
    const limpio = text.trim()
    if (!limpio) return
    setInput("")
    await enviarMensaje(limpio)
  }


  // Manejo de Enter para enviar mensaje
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = mensajes.length === 0

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <ProtectedRoute requiredRole="Estudiante">
    <div className="flex flex-col min-h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh)] md:max-h-[calc(100dvh)] bg-background overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/60 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Atom className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-none">
              Physics AI
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tutor especializado en Física · Gemini 1.5 Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En línea
          </span>
          {mensajes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarChat}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Limpiar</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── MENSAJES ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* Estado vacío con sugerencias */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8 border border-primary/15">
                <Atom className="h-10 w-10 text-primary/60" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  ¿Tienes dudas de Física?
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Soy tu tutor virtual. Pregúntame sobre mecánica, termodinámica,
                  electromagnetismo, cuántica y más.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-2 rounded-full border border-border bg-card hover:bg-accent hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de mensajes */}
        {mensajes.map((msg) => (
          <MensajeChat key={msg.id} mensaje={msg} />
        ))}

        {/* Indicador de escritura */}
        {cargando && (
          <div className="flex items-start gap-3 max-w-3xl mx-auto w-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0 mt-0.5">
              <Atom className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1 items-center h-5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-4 py-3">
              <Zap className="h-4 w-4 shrink-0" />
              <span>Error: {error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT ── */}
      <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur px-3 sm:px-4 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-background border border-border rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <BookOpen className="h-4 w-4 text-muted-foreground mb-1.5 shrink-0" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta de Física… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-6 max-h-36"
            />
            <Button
              size="icon"
              className="h-8 w-8 rounded-xl shrink-0 mb-0.5"
              disabled={!input.trim() || cargando}
              onClick={() => sendMessage()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
            Shift+Enter para nueva línea · Solo respuestas sobre Física
          </p>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
