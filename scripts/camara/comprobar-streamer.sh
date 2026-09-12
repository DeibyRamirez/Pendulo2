#!/usr/bin/env bash
# Comprueba que MJPG-streamer responde en la Raspberry.
# Uso (en la Pi): bash scripts/camara/comprobar-streamer.sh
set -euo pipefail

PUERTO="${PUERTO_CAMARA:-8080}"
URL="http://127.0.0.1:${PUERTO}/?action=stream"

echo "Probando ${URL} ..."
if curl -fsS -I --max-time 8 "${URL}" >/dev/null; then
  echo "OK: el streamer responde en el puerto ${PUERTO}."
  echo "Siguiente paso: Tailscale Funnel (activar-funnel-tailscale.sh)."
  exit 0
fi

echo "FALLO: no hay MJPEG en ${URL}."
echo "Arranca el streamer (puerto ${PUERTO}) y vuelve a ejecutar este script."
exit 1
