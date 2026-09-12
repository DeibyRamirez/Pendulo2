"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Camera,
  RefreshCw,
  X,
} from "lucide-react"
import { ReproductorWebrtcCamara } from "@/components/reproductor-webrtc-camara"
import {
  construirUrlMjpeg,
  construirUrlWhep,
  obtenerProtocoloCamara,
  obtenerUrlBaseCamara,
  textoAyudaSinSenal,
  textoPieCamara,
} from "@/lib/camaraEnVivo"

type EstadoConexionCamara = "conectando" | "conectado" | "sin_senal"

interface CameraStreamProps {
  penduloId?: string
  isLive?: boolean
}

export function CameraStream({ penduloId = "UAC-01" }: CameraStreamProps) {
  const urlBase = useMemo(() => obtenerUrlBaseCamara(), [])
  const protocolo = useMemo(() => obtenerProtocoloCamara(), [])
  const [reproduciendo, setReproduciendo] = useState(true)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const [reintento, setReintento] = useState(0)
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionCamara>("conectando")

  const urlMjpeg = construirUrlMjpeg(urlBase, reintento)
  const urlWhep = useMemo(() => construirUrlWhep(urlBase), [urlBase])
  const ayudaSinSenal = useMemo(
    () => textoAyudaSinSenal(urlBase, protocolo),
    [urlBase, protocolo]
  )
  const pieCamara = useMemo(
    () => textoPieCamara(urlBase, protocolo),
    [urlBase, protocolo]
  )

  const marcarConectado = useCallback(() => setEstadoConexion("conectado"), [])
  const marcarSinSenal = useCallback(() => setEstadoConexion("sin_senal"), [])

  useEffect(() => {
    if (!pantallaCompleta) return
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setPantallaCompleta(false)
    }
    window.addEventListener("keydown", alPulsarTecla)
    return () => window.removeEventListener("keydown", alPulsarTecla)
  }, [pantallaCompleta])

  const colorEstado =
    estadoConexion === "conectado"
      ? "bg-green-500"
      : estadoConexion === "conectando"
        ? "bg-yellow-500 animate-pulse"
        : "bg-red-500"

  const textoEstado =
    estadoConexion === "conectado"
      ? "EN VIVO"
      : estadoConexion === "conectando"
        ? "CONECTANDO..."
        : "SIN SEÑAL"

  const mostrarStream = reproduciendo && estadoConexion !== "sin_senal"

  const salirPantallaCompleta = () => setPantallaCompleta(false)

  return (
    <Card
      className={
        pantallaCompleta
          ? "fixed inset-0 z-50 flex flex-col rounded-none border-0 bg-background"
          : "border-border/50"
      }
    >
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Visualización en vivo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <span className={`w-2 h-2 rounded-full mr-2 ${colorEstado}`} />
              {textoEstado}
            </Badge>
            {pantallaCompleta && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={salirPantallaCompleta}
                aria-label="Cerrar pantalla completa"
              >
                <X className="w-4 h-4 mr-1" />
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={pantallaCompleta ? "flex-1 min-h-0 flex flex-col" : ""}>
        <div
          className={
            pantallaCompleta
              ? "relative flex-1 min-h-0 rounded-lg overflow-hidden border border-border bg-black"
              : "relative aspect-video bg-secondary/30 rounded-lg overflow-hidden border border-border"
          }
        >
          {reproduciendo && protocolo === "mjpeg" ? (
            <img
              key={urlMjpeg}
              src={urlMjpeg}
              alt={`Transmisión en vivo de la cámara del péndulo ${penduloId}`}
              className={`absolute inset-0 h-full w-full object-contain bg-black ${
                mostrarStream ? "opacity-100" : "opacity-0"
              }`}
              onLoad={marcarConectado}
              onError={marcarSinSenal}
            />
          ) : null}

          {reproduciendo && protocolo === "webrtc" ? (
            <ReproductorWebrtcCamara
              key={`${urlWhep}-${reintento}`}
              urlWhep={urlWhep}
              reintento={reintento}
              penduloId={penduloId}
              visible={mostrarStream}
              alConectar={marcarConectado}
              alError={marcarSinSenal}
            />
          ) : null}

          {(!reproduciendo || estadoConexion === "sin_senal") && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <VideoOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-1">
                  {reproduciendo ? "Sin señal de cámara" : "Transmisión pausada"}
                </p>
                <p className="text-muted-foreground text-sm">{ayudaSinSenal}</p>
              </div>
            </div>
          )}

          {estadoConexion === "conectando" && reproduciendo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground">Conectando a la cámara...</p>
            </div>
          )}

          <div className="absolute top-3 left-3 text-[11px] font-mono text-white/80 drop-shadow">
            Cam: {penduloId}
          </div>

          {pantallaCompleta && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full shadow-lg"
              onClick={salirPantallaCompleta}
              aria-label="Cerrar pantalla completa"
            >
              <X className="w-5 h-5" />
            </Button>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => {
                    setReproduciendo((prev) => !prev)
                    if (!reproduciendo) {
                      setEstadoConexion("conectando")
                    }
                  }}
                  aria-label={reproduciendo ? "Pausar transmisión" : "Reanudar transmisión"}
                >
                  {reproduciendo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => {
                    setEstadoConexion("conectando")
                    setReproduciendo(true)
                    setReintento((n) => n + 1)
                  }}
                  aria-label="Reintentar conexión de cámara"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setPantallaCompleta((prev) => !prev)}
                aria-label={pantallaCompleta ? "Salir de pantalla completa" : "Ver en pantalla completa"}
              >
                {pantallaCompleta ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {!pantallaCompleta && (
          <p className="text-xs text-muted-foreground mt-3 text-center">{pieCamara}</p>
        )}
      </CardContent>
    </Card>
  )
}
