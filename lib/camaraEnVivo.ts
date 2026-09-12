/**
 * Resolución de URL y protocolo de la cámara del péndulo.
 * El camino por defecto es MJPEG por HTTPS (túnel named Cloudflare).
 * WebRTC (WHEP) es opcional y no usa playit.gg ni UDP crudo en el <img>.
 */

export const URL_CAMARA_LOCAL_POR_DEFECTO = "https://camarapendulo.cheiviz.com/?action=stream"
export const TEXTO_TUNEL_PUTTY = "L8090 10.10.161.61:8080"
export const HOST_CAMARA_CLOUDFLARE = "camarapendulo.cheiviz.com"

export type ProtocoloCamara = "mjpeg" | "webrtc"

export type OrigenCamara = "local" | "tailscale" | "cloudflare" | "https_publico" | "http_inseguro"

export function urlEsLocal(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url)
}

export function urlPareceTailscale(url: string): boolean {
  return /\.ts\.net/i.test(url)
}

export function urlPareceCloudflare(url: string): boolean {
  return /cheiviz\.com/i.test(url)
}

export function clasificarOrigenCamara(url: string): OrigenCamara {
  if (urlEsLocal(url)) return "local"
  if (urlPareceCloudflare(url)) return "cloudflare"
  if (urlPareceTailscale(url)) return "tailscale"
  if (/^https:\/\//i.test(url)) return "https_publico"
  return "http_inseguro"
}

export function normalizarUrlMjpeg(url: string): string {
  const recortada = url.trim()
  if (/\/stream\.html\/?(\?|#|$)/i.test(recortada)) {
    return recortada.replace(/\/stream\.html\/?/i, "/?action=stream")
  }
  return recortada
}

export function obtenerUrlBaseCamara(): string {
  const desdeEnv = process.env.NEXT_PUBLIC_CAMARA_URL?.trim()
  const base = desdeEnv && desdeEnv.length > 0 ? desdeEnv : URL_CAMARA_LOCAL_POR_DEFECTO
  return normalizarUrlMjpeg(base)
}

export function obtenerProtocoloCamara(): ProtocoloCamara {
  const valor = process.env.NEXT_PUBLIC_CAMARA_PROTOCOLO?.trim().toLowerCase()
  return valor === "webrtc" ? "webrtc" : "mjpeg"
}

export function construirUrlMjpeg(urlBase: string, reintento: number): string {
  const separador = urlBase.includes("?") ? "&" : "?"
  return `${urlBase}${separador}r=${reintento}`
}

export function construirUrlWhep(urlBase: string): string {
  try {
    const url = new URL(urlBase)
    url.search = ""
    url.hash = ""
    const limpia = url.toString().replace(/\/+$/, "")
    if (/\/whep$/i.test(limpia)) return limpia
    return `${limpia}/whep`
  } catch {
    const sinQuery = urlBase.split("?")[0].split("#")[0].replace(/\/+$/, "")
    if (/\/whep$/i.test(sinQuery)) return sinQuery
    return `${sinQuery}/whep`
  }
}

export function textoAyudaSinSenal(urlBase: string, protocolo: ProtocoloCamara): string {
  const origen = clasificarOrigenCamara(urlBase)

  if (origen === "local") {
    return `En local: activa el túnel SSH en PuTTY (${TEXTO_TUNEL_PUTTY}) y comprueba http://localhost:8090/stream.html. En Vercel usa https://${HOST_CAMARA_CLOUDFLARE}/?action=stream (túnel named en la Raspberry).`
  }

  if (protocolo === "webrtc") {
    return `No llega el WebRTC (WHEP). En la Raspberry, MediaMTX y cloudflared deben estar encendidos. NEXT_PUBLIC_CAMARA_URL debe ser https://${HOST_CAMARA_CLOUDFLARE}/cam y CORS debe permitir el origen de Vercel. No uses playit.gg ni UDP crudo en esta página.`
  }

  if (origen === "cloudflare") {
    return `No llega el MJPEG por Cloudflare. En la Raspberry el streamer (8080) y cloudflared (túnel camara-pendulo) deben estar Healthy. Comprueba https://${HOST_CAMARA_CLOUDFLARE}/?action=stream en un móvil con datos.`
  }

  if (origen === "tailscale") {
    return "No llega el MJPEG por Tailscale Funnel. En la Raspberry comprueba que MJPG-streamer escucha en 8080 y que `tailscale funnel status` sigue publicado."
  }

  if (origen === "http_inseguro") {
    return `La URL de la cámara es HTTP. El navegador la bloquea en Vercel (contenido mixto). Usa HTTPS: https://${HOST_CAMARA_CLOUDFLARE}/?action=stream`
  }

  return `No llega el MJPEG. En la Raspberry el streamer y cloudflared deben estar encendidos, y NEXT_PUBLIC_CAMARA_URL debe ser https://${HOST_CAMARA_CLOUDFLARE}/?action=stream`
}

export function textoPieCamara(urlBase: string, protocolo: ProtocoloCamara): string {
  if (urlEsLocal(urlBase)) {
    return "Transmisión local: requiere el túnel PuTTY en este equipo."
  }
  if (protocolo === "webrtc") {
    return "Transmisión WebRTC desde el laboratorio. La URL WHEP se configura en Vercel."
  }
  if (urlPareceCloudflare(urlBase)) {
    return "Transmisión en vivo por Cloudflare Tunnel (camarapendulo.cheiviz.com)."
  }
  if (urlPareceTailscale(urlBase)) {
    return "Transmisión en vivo por Tailscale Funnel. La URL pública se configura en Vercel."
  }
  return "Transmisión en tiempo real desde el laboratorio. La URL pública se configura en Vercel."
}
