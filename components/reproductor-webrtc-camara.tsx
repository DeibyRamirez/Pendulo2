"use client"

import { useEffect, useRef } from "react"

interface ReproductorWebrtcCamaraProps {
  urlWhep: string
  reintento: number
  penduloId: string
  visible: boolean
  alConectar: () => void
  alError: () => void
}

async function esperarHieloCompleto(conexion: RTCPeerConnection): Promise<void> {
  if (conexion.iceGatheringState === "complete") return

  await new Promise<void>((resolver) => {
    const alCambio = () => {
      if (conexion.iceGatheringState === "complete") {
        conexion.removeEventListener("icegatheringstatechange", alCambio)
        resolver()
      }
    }
    conexion.addEventListener("icegatheringstatechange", alCambio)
    window.setTimeout(() => {
      conexion.removeEventListener("icegatheringstatechange", alCambio)
      resolver()
    }, 2500)
  })
}

/**
 * Reproduce un WHEP (MediaMTX u otro). No habla UDP crudo ni playit.gg:
 * el navegador solo usa HTTPS + WebRTC.
 */
export function ReproductorWebrtcCamara({
  urlWhep,
  reintento,
  penduloId,
  visible,
  alConectar,
  alError,
}: ReproductorWebrtcCamaraProps) {
  const refVideo = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = refVideo.current
    if (!video) return

    const abortador = new AbortController()
    let conexion: RTCPeerConnection | null = null
    let urlSesion: string | null = null

    const arrancar = async () => {
      try {
        conexion = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        })
        conexion.addTransceiver("video", { direction: "recvonly" })
        conexion.addTransceiver("audio", { direction: "recvonly" })
        conexion.ontrack = (evento) => {
          const [flujo] = evento.streams
          if (flujo) video.srcObject = flujo
        }

        const oferta = await conexion.createOffer()
        await conexion.setLocalDescription(oferta)
        await esperarHieloCompleto(conexion)

        const sdpLocal = conexion.localDescription?.sdp
        if (!sdpLocal) throw new Error("Sin oferta SDP")

        const respuesta = await fetch(urlWhep, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: sdpLocal,
          signal: abortador.signal,
        })
        if (!respuesta.ok) {
          throw new Error(`WHEP ${respuesta.status}`)
        }

        const ubicacion = respuesta.headers.get("Location")
        if (ubicacion) {
          urlSesion = new URL(ubicacion, urlWhep).toString()
        }

        const sdpRemoto = await respuesta.text()
        await conexion.setRemoteDescription({ type: "answer", sdp: sdpRemoto })
        await video.play().catch(() => undefined)
        alConectar()
      } catch (error) {
        if (abortador.signal.aborted) return
        console.error("Fallo al reproducir la cámara WebRTC", error)
        alError()
      }
    }

    void arrancar()

    return () => {
      abortador.abort()
      if (urlSesion) {
        void fetch(urlSesion, { method: "DELETE" }).catch(() => undefined)
      }
      conexion?.close()
      video.srcObject = null
    }
  }, [urlWhep, reintento, alConectar, alError])

  return (
    <video
      ref={refVideo}
      autoPlay
      muted
      playsInline
      aria-label={`Transmisión en vivo de la cámara del péndulo ${penduloId}`}
      className={`absolute inset-0 h-full w-full object-contain bg-black ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    />
  )
}
