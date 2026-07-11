"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, Trash2, Atom, Zap, BookOpen, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// -----------------------------------------------------------
// TYPES
// -----------------------------------------------------------
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [input])

  // Enviar MENSAJE -> POST /api/chat
  const sendMessage = async (text: string = input) => {
    const trimed = text.trim()
    if (!trimed || loading) return


    // Agregar mensaje del usuario
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimed,
      timestamp: new Date(),
    }


    const updateMessages = [...messages, userMsg]
    setMessages(updateMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {

      // Llamada a la API interna que a su vez llama a Gemini
      // Aquí es donde se maneja la lógica de comunicación con el backend y la API de Gemini
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updateMessages.map((m) => ({ role: m.role, content: m.content })), }),
      })

      // Manejo de errores HTTP
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData?.error ?? `HTTP ${res.status}`)
      }


      const data = await res.json()


      // Agregar mensaje del asistente
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])


    } catch (err: any) {
      setError(err.message ?? "Error desconocido")
    } finally {
      setLoading(false)
    }
  }


  // Manejo de Enter para enviar mensaje
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const isEmpty = messages.length === 0

  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur shrink-0">
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
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
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
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Indicador de escritura */}
        {loading && (
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
      <div className="shrink-0 border-t border-border bg-card/60 backdrop-blur px-4 py-4">
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
              disabled={!input.trim() || loading}
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
  )
}

// ─────────────────────────────────────────────────────────────
// BURBUJA DE MENSAJE
// ─────────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  const time = message.timestamp.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className={cn(
      "flex items-start gap-3 max-w-3xl mx-auto w-full",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 text-xs font-semibold",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 border border-primary/20 text-primary"
      )}>
        {isUser ? "Tú" : <Atom className="h-4 w-4" />}
      </div>

      <div className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-card border border-border text-foreground rounded-tl-sm"
      )}>
        {message.content}
        <span className={cn(
          "block text-[10px] mt-1.5",
          isUser ? "text-primary-foreground/60 text-right" : "text-muted-foreground"
        )}>
          {time}
        </span>
      </div>
    </div>
  )

}