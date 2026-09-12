#!/usr/bin/env bash
# Instala y arranca el cliente frp hacia la VPS (fallback del campus).
# Uso (en la Pi):
#   sudo cp scripts/camara/frpc.toml.ejemplo /etc/frp/frpc.toml
#   sudo nano /etc/frp/frpc.toml   # IP de la VPS y el token
#   bash scripts/camara/activar-frp-en-pi.sh
set -euo pipefail

ARCHIVO_CONFIG="${FRPC_CONFIG:-/etc/frp/frpc.toml}"

if [[ ! -f "${ARCHIVO_CONFIG}" ]]; then
  echo "Falta ${ARCHIVO_CONFIG}. Copia frpc.toml.ejemplo, pon la IP de la VPS y el token."
  exit 1
fi

if ! command -v frpc >/dev/null 2>&1; then
  echo "Descarga frpc para ARM desde https://github.com/fatedier/frp/releases"
  echo "Ejemplo (64 bits):"
  echo "  curl -LO https://github.com/fatedier/frp/releases/download/v0.61.2/frp_0.61.2_linux_arm64.tar.gz"
  echo "  tar -xzf frp_0.61.2_linux_arm64.tar.gz"
  echo "  sudo cp frp_0.61.2_linux_arm64/frpc /usr/local/bin/"
  exit 1
fi

sudo mkdir -p /etc/frp
echo "Arrancando frpc con ${ARCHIVO_CONFIG} ..."
sudo frpc -c "${ARCHIVO_CONFIG}"
