"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Camera,
  Settings,
  Volume2,
  VolumeX
} from "lucide-react"

interface CameraStreamProps {
  penduloId?: string
  isLive?: boolean
}

export function CameraStream({ penduloId = "UAC-01", isLive = true }: CameraStreamProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")

  // Simular reconexión
  useEffect(() => {
    if (!isPlaying) {
      setConnectionStatus("disconnected")
    } else {
      setConnectionStatus("connecting")
      const timer = setTimeout(() => {
        setConnectionStatus("connected")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isPlaying])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500 animate-pulse"
      case "disconnected":
        return "bg-red-500"
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "EN VIVO"
      case "connecting":
        return "CONECTANDO..."
      case "disconnected":
        return "DESCONECTADO"
    }
  }

  return (
    <Card className={`border-border/50 ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Cámara del Péndulo
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor()}`} />
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-secondary/30 rounded-lg overflow-hidden border border-border">
          {/* Video placeholder - En producción conectar a stream real */}
          {isPlaying && connectionStatus === "connected" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Simulación visual del péndulo */}
              <div className="relative w-full h-full">
                {/* Fondo de laboratorio */}
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-secondary/80" />
                
                {/* Grid de fondo */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                      linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px"
                  }}
                />
                
                {/* Estructura del péndulo */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  {/* Soporte */}
                  <div className="w-48 h-3 bg-muted-foreground rounded" />
                  
                  {/* Péndulo animado */}
                  <div 
                    className="relative"
                    style={{
                      transformOrigin: "center top",
                      animation: "pendulum 2s ease-in-out infinite"
                    }}
                  >
                    {/* Hilo */}
                    <div className="w-0.5 h-40 bg-muted-foreground mx-auto" />
                    
                    {/* Esfera */}
                    <div className="w-10 h-10 rounded-full bg-primary mx-auto -mt-1 shadow-lg shadow-primary/30" />
                  </div>
                </div>
                
                {/* Indicadores de medición */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-muted-foreground font-mono">
                  <span>Cam: {penduloId}</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                  <span>1080p @ 30fps</span>
                </div>
              </div>
              
              {/* Estilo de animación */}
              <style jsx>{`
                @keyframes pendulum {
                  0%, 100% { transform: rotate(-15deg); }
                  50% { transform: rotate(15deg); }
                }
              `}</style>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <VideoOff className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {connectionStatus === "connecting" ? "Conectando a la cámara..." : "Transmisión pausada"}
                </p>
              </div>
            </div>
          )}
          
          {/* Controles de video */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Transmisión en tiempo real desde el Laboratorio de Física - UAC
        </p>
      </CardContent>
    </Card>
  )
}
