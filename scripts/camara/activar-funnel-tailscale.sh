#!/usr/bin/env bash
# Publica el MJPEG local por Tailscale Funnel (HTTPS, hostname *.ts.net).
# Uso (en la Pi, con cuenta Tailscale): bash scripts/camara/activar-funnel-tailscale.sh
set -euo pipefail

PUERTO="${PUERTO_CAMARA:-8080}"

if ! command -v tailscale >/dev/null 2>&1; then
  echo "Instalando Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
fi

if ! tailscale status >/dev/null 2>&1; then
  echo "Inicia sesión (se abre un enlace):"
  sudo tailscale up
fi

echo "Publicando Funnel hacia http://127.0.0.1:${PUERTO} ..."
sudo tailscale funnel --bg "${PUERTO}"

echo
echo "Estado del Funnel:"
tailscale funnel status || true
echo
echo "Hostname de esta máquina:"
tailscale status --json 2>/dev/null | grep -oE '"DNSName":"[^"]+"' | head -n 1 || true
echo
echo "En Vercel (Production) pon:"
echo "  NEXT_PUBLIC_CAMARA_PROTOCOLO=mjpeg"
echo "  NEXT_PUBLIC_CAMARA_URL=https://ESTE-NOMBRE.ts.net/?action=stream"
echo
echo "Comprueba el Funnel desde el móvil con datos (no WiFi del lab)."
echo "Si el campus bloquea Tailscale, usa el fallback VPS (docs/camara-en-vivo.md)."
