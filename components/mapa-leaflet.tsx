"use client"

import { useEffect, useRef } from "react"
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
}

type Props = {
  pendulos: Pendulo[]
  onSelect: (pendulo: Pendulo) => void
}

function markerColor(estado: string) {
  if (estado === "Activo") return "#16a34a"
  if (estado === "En_uso") return "#dc2626"
  if (estado === "En_mantenimiento") return "#6b7280"
  return "#ca8a04"
}

export default function MapaLeaflet({ pendulos, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    pendulos
      .filter((p) => Number.isFinite(p.latitud) && Number.isFinite(p.longitud))
      .forEach((pendulo) => {
        const icon = L.divIcon({
          className: "custom-pendulo-marker",
          html: `<div style="width:14px;height:14px;border-radius:9999px;background:${markerColor(pendulo.estado)};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

        const marker = L.marker([pendulo.latitud, pendulo.longitud], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:180px; padding:6px;">
              <p style="font-weight:600; font-size:14px; margin:0 0 4px;">${pendulo.institucion}</p>
              <p style="font-size:12px; margin:0; color:#334155;">${pendulo.ciudad}, ${pendulo.pais}</p>
              <p style="font-size:11px; margin:6px 0 0; color:#64748b;">Estado: ${pendulo.estado}</p>
            </div>
          `)

        marker.on("click", () => onSelect(pendulo))
        markersRef.current.push(marker)
      })
  }, [pendulos, onSelect])

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
}
