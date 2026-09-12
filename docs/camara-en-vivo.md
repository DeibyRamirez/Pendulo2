# Cámara en vivo: Cloudflare + cheiviz.com

La web en Vercel solo pinta un reproductor. El vídeo sale **desde la
Raspberry** por **HTTPS**. El protocolo es **MJPEG**
(`/?action=stream`).

Hostname fijo de este laboratorio:

`https://camarapendulo.cheiviz.com/?action=stream`

- Dominio: `cheiviz.com` (Cloudflare Registrar).
- Subdominio: `camarapendulo`.
- Túnel named: `camara-pendulo` (`cloudflared` como systemd en la Pi).

**No crees un registro A** hacia `10.10.161.61`. Esa IP no es pública.
Cloudflare crea un CNAME `camarapendulo` → el túnel. HTTPS lo pone
Cloudflare.

El túnel rápido `trycloudflare.com` solo sirve para probar: la URL cambia
al cerrar la terminal. No lo uses en Vercel.

```
Alumno (Vercel) → https://camarapendulo.cheiviz.com
               → cloudflared (Pi) → MJPG-streamer 127.0.0.1:8080
```

## Variables en Vercel

Production (y Preview si hace falta):

```text
NEXT_PUBLIC_CAMARA_PROTOCOLO=mjpeg
NEXT_PUBLIC_CAMARA_URL=https://camarapendulo.cheiviz.com/?action=stream
```

En local se puede dejar el túnel PuTTY:

```text
NEXT_PUBLIC_CAMARA_URL=http://localhost:8090/?action=stream
```

Si en Vercel pones `http://`, el navegador bloquea el vídeo (contenido
mixto). Tras cambiar variables públicas hay que **redeploy**.

**No** añadas `camarapendulo.cheiviz.com` ni `cheiviz.com` como Custom
Domain del proyecto Next.js: eso sería otra web, no el stream.

## 0. Comprobar el streamer en la Pi

IP típica del lab: `10.10.161.61`, puerto **8080**.

```bash
curl -I --max-time 8 "http://127.0.0.1:8080/?action=stream"
```

O:

```bash
bash scripts/camara/comprobar-streamer.sh
```

Si esto falla, arranca MJPG-streamer. Sin eso el dominio no sirve.

---

## 1. Dashboard de Cloudflare (un PC)

1. Entra a [dash.cloudflare.com](https://dash.cloudflare.com) y abre
   **cheiviz.com**.
2. El dominio debe estar **Active**. Si está Pending, espera.
3. Zero Trust → Networks → **Tunnels**
   ([one.dash.cloudflare.com](https://one.dash.cloudflare.com)).
4. Create a tunnel → **Cloudflared** → nombre `camara-pendulo` → Save.
5. En **Install connector** elige Debian. Copia el comando
   `sudo cloudflared service install <token>`. Ese token va **en la Pi**,
   no en Vercel.
6. Public hostname:
   - Subdomain: `camarapendulo`
   - Domain: `cheiviz.com`
   - Service type: HTTP
   - URL: `http://127.0.0.1:8080`
7. Save. Debe aparecer un CNAME `camarapendulo` con nube naranja hacia
   `….cfargotunnel.com`.

## 2. Raspberry: instalar el conector

Si `cloudflared` no está (ARM64; si `dpkg` se queja, usa
`cloudflared-linux-arm.deb`):

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
```

Pega el comando del dashboard:

```bash
sudo cloudflared service install <token>
```

Eso deja el servicio systemd: no se cae al cerrar SSH.

Si el campus bloquea UDP (QUIC), fuerza HTTP/2. Copia
`scripts/camara/config.yml.ejemplo` a `/etc/cloudflared/config.yml` o
usa el script:

```bash
bash scripts/camara/activar-tunel-cloudflare.sh
```

El script no instala el token (eso es del dashboard). Solo comprueba el
streamer, instala el `.deb` si falta y deja `protocol: http2`.

```bash
sudo systemctl status cloudflared
```

En el dashboard el conector debe verse **Healthy**.

## 3. Probar sin Vercel

En el **móvil con datos** (no WiFi del lab):

`https://camarapendulo.cheiviz.com/?action=stream`

Si se ve el MJPEG, pega esa URL en Vercel y redespliega.

Si no se ve:

- Streamer caído en la Pi
- `cheiviz.com` aún Pending
- `cloudflared` no Healthy
- Puerto mal (8000 vs 8080)

## 4. Si el campus bloquea Cloudflare

1. Tailscale Funnel: `bash scripts/camara/activar-funnel-tailscale.sh`
   y otra URL `https://….ts.net/?action=stream` en Vercel.
2. VPS + Caddy + frp: ver ejemplos en `scripts/camara/frp*.ejemplo` y
   `Caddyfile.ejemplo`.

## 5. WebRTC opcional (MediaMTX)

Solo si más adelante se quiere menos bitrate. En Vercel:

```text
NEXT_PUBLIC_CAMARA_PROTOCOLO=webrtc
NEXT_PUBLIC_CAMARA_URL=https://camarapendulo.cheiviz.com/cam
```

`CameraStream` hará POST a `…/cam/whep`. Configura
`scripts/camara/mediamtx.yml.ejemplo`. No uses playit.gg ni UDP crudo
en el `<img>`.

## Más adelante (docentes)

El túnel `camara-pendulo` se queda. Se añade otro Public hostname al
mismo túnel y se cambia `NEXT_PUBLIC_CAMARA_URL`. No hay que reinstalar
la Pi.

## Qué no usar

- Registro A a `10.10.161.61`
- `trycloudflare.com` en Vercel
- ngrok gratis, Cloudinary, playit.gg, port-forward del campus

## Checklist

- [ ] `curl` al streamer en `127.0.0.1:8080` funciona en la Pi.
- [ ] Túnel `camara-pendulo` Healthy en Cloudflare.
- [ ] CNAME `camarapendulo` (nube naranja), sin A a la IP del lab.
- [ ] `https://camarapendulo.cheiviz.com/?action=stream` se ve en un
      móvil con datos.
- [ ] `NEXT_PUBLIC_CAMARA_URL` en Vercel es esa URL HTTPS.
- [ ] Redeploy de Production.
- [ ] `/dashboard/realtime` y `/pendulo/...` muestran EN VIVO.
