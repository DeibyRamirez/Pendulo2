"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type Pendulo = {
  id: string
  institucion: string
  pais: string
  ciudad: string
  latitud: number
  longitud: number
  estado: string
  ultimaActualizacion: string
  sesionesHoy: number
  usuariosActivos: number
}

type Props = {
  pendulos: Pendulo[]
  onSelect: (pendulo: Pendulo) => void
}

export default function MapaLeaflet({ pendulos, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current) return

    // Si ya hay un mapa, destruirlo antes de crear uno nuevo
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Fix íconos
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    // Crear mapa
    const map = L.map(containerRef.current, {
      center: [20, 10],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    })
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map

    // Cleanup al desmontar
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Solo una vez

  // Actualizar marcadores cuando cambian los péndulos
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Agregar nuevos marcadores
    pendulos.forEach((pendulo) => {
      const marker = L.marker([pendulo.latitud, pendulo.longitud])
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px; padding:8px;">
            <p style="font-weight:600; font-size:14px; margin:0 0 4px">${pendulo.institucion}</p>
            <p style="font-size:12px; color:#666; margin:0 0 8px">${pendulo.ciudad}, ${pendulo.pais}</p>
            <div style="display:flex; gap:8px;">
              <a href="/dashboard?pendulo=${pendulo.id}"
                style="font-size:12px; background:#3b82f6; color:white; padding:4px 8px; border-radius:4px; text-decoration:none;">
                Dashboard
              </a>
              <a href="/reservas?pendulo=${pendulo.id}"
                style="font-size:12px; background:#22c55e; color:white; padding:4px 8px; border-radius:4px; text-decoration:none;">
                Agendar
              </a>
            </div>
          </div>
        `)

      marker.on("click", () => onSelect(pendulo))
      markersRef.current.push(marker)
    })
  }, [pendulos, onSelect])

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
}