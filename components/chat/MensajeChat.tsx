"use client"

import { Atom } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MensajeChat as MensajeChatTipo } from "@/hooks/useChatIA"

// Burbuja de mensaje extraída de la página del agente IA.
export function MensajeChat({ mensaje }: { mensaje: MensajeChatTipo }) {
  const esUsuario = mensaje.role === "user"
  const hora = mensaje.timestamp.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={cn(
        "flex items-start gap-3 max-w-3xl mx-auto w-full",
        esUsuario && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 text-xs font-semibold",
          esUsuario
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 border border-primary/20 text-primary"
        )}
      >
        {esUsuario ? "Tú" : <Atom className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap",
          esUsuario
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border text-foreground rounded-tl-sm"
        )}
      >
        {mensaje.content}
        <span
          className={cn(
            "block text-[10px] mt-1.5",
            esUsuario
              ? "text-primary-foreground/60 text-right"
              : "text-muted-foreground"
          )}
        >
          {hora}
        </span>
      </div>
    </div>
  )
}
