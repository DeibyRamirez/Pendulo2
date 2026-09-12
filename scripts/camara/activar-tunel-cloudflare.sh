#!/usr/bin/env bash
# Prepara cloudflared en la Raspberry para el túnel named camara-pendulo.
# El token NO va en este repo: cópialo del dashboard de Cloudflare
# (Zero Trust → Tunnels → camara-pendulo → Install connector).
#
# Uso (en la Pi):
#   bash scripts/camara/activar-tunel-cloudflare.sh
#   sudo cloudflared service install <token>
#
# URL pública: https://camarapendulo.cheiviz.com/?action=stream
set -euo pipefail

PUERTO="${PUERTO_CAMARA:-8080}"
URL_LOCAL="http://127.0.0.1:${PUERTO}/?action=stream"
URL_PUBLICA="https://camarapendulo.cheiviz.com/?action=stream"
DIR_CONFIG="/etc/cloudflared"
ARCHIVO_CONFIG="${DIR_CONFIG}/config.yml"

echo "1) Streamer local (${URL_LOCAL})..."
if ! curl -fsS -I --max-time 8 "${URL_LOCAL}" >/dev/null; then
  echo "FALLO: MJPG-streamer no responde en el puerto ${PUERTO}."
  echo "Arráncalo y vuelve a ejecutar este script."
  exit 1
fi
echo "   OK."

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "2) Instalando cloudflared..."
  ARCH="$(uname -m)"
  DEB="cloudflared-linux-arm64.deb"
  if [[ "${ARCH}" == "armv7l" || "${ARCH}" == "armv6l" ]]; then
    DEB="cloudflared-linux-arm.deb"
  fi
  curl -L --output /tmp/cloudflared.deb \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/${DEB}"
  sudo dpkg -i /tmp/cloudflared.deb || sudo apt-get install -f -y
  rm -f /tmp/cloudflared.deb
else
  echo "2) cloudflared ya está instalado: $(cloudflared --version | head -n 1)"
fi

echo "3) Forzando protocol: http2 (por si el campus bloquea QUIC)..."
sudo mkdir -p "${DIR_CONFIG}"
if [[ ! -f "${ARCHIVO_CONFIG}" ]]; then
  sudo tee "${ARCHIVO_CONFIG}" >/dev/null <<EOF
protocol: http2

ingress:
  - hostname: camarapendulo.cheiviz.com
    service: http://127.0.0.1:${PUERTO}
  - service: http_status:404
EOF
  echo "   Creado ${ARCHIVO_CONFIG}"
elif ! grep -q '^protocol:' "${ARCHIVO_CONFIG}"; then
  sudo sed -i '1iprotocol: http2\n' "${ARCHIVO_CONFIG}"
  echo "   Añadido protocol: http2 a ${ARCHIVO_CONFIG}"
else
  echo "   ${ARCHIVO_CONFIG} ya tiene protocol."
fi

if systemctl list-unit-files cloudflared.service >/dev/null 2>&1 \
  && systemctl is-enabled cloudflared >/dev/null 2>&1; then
  echo "4) Reiniciando cloudflared..."
  sudo systemctl restart cloudflared
  sudo systemctl status cloudflared --no-pager || true
else
  echo "4) El servicio aún no está instalado."
  echo "   En el dashboard copia el comando y pégalo aquí:"
  echo "   sudo cloudflared service install <token>"
fi

echo
echo "Cuando el conector esté Healthy, prueba en el móvil con datos:"
echo "  ${URL_PUBLICA}"
echo
echo "En Vercel (Production), sin Custom Domain:"
echo "  NEXT_PUBLIC_CAMARA_PROTOCOLO=mjpeg"
echo "  NEXT_PUBLIC_CAMARA_URL=${URL_PUBLICA}"
