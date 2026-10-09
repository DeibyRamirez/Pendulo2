"use client"

import { useCallback, useState } from "react"
import { auth } from "@/app/services/firebase"

export interface MensajeChat {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Debe coincidir con MAX_MENSAJES_HISTORIAL del endpoint.
const MAX_MENSAJES_ENVIO = 20

/**
 * Estado del chat con el asistente de física. Envía el ID token de Firebase
 * en cada petición; el endpoint lo verifica en el servidor.
 */
export function useChatIA() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviarMensaje = useCallback(
    async (texto: string) => {
      const contenido = texto.trim()
      if (!contenido || cargando) return

      const mensajeUsuario: MensajeChat = {
        id: crypto.randomUUID(),
        role: "user",
        content: contenido,
        timestamp: new Date(),
      }
      const historial = [...mensajes, mensajeUsuario]

      setMensajes(historial)
      setCargando(true)
      setError(null)

      try {
        const usuario = auth.currentUser
        if (!usuario) {
          throw new Error("Inicia sesión para hablar con el asistente.")
        }
        const token = await usuario.getIdToken()

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: historial
              .slice(-MAX_MENSAJES_ENVIO)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!res.ok) {
          const datos = await res.json().catch(() => null)
          throw new Error(datos?.error ?? `HTTP ${res.status}`)
        }

        const datos = await res.json()
        setMensajes((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: datos.reply,
            timestamp: new Date(),
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setCargando(false)
      }
    },
    [mensajes, cargando]
  )

  const limpiarChat = useCallback(() => {
    setMensajes([])
    setError(null)
  }, [])

  return { mensajes, enviarMensaje, cargando, error, limpiarChat }
}
