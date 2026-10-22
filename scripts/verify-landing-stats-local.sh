#!/usr/bin/env bash
# Verificación repo: landing stats + reglas Firestore (Linux/macOS/CI)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

echo "=== Git (main) ==="
git fetch origin 2>/dev/null || true
echo "Rama: $(git branch --show-current)"
echo "Commit: $(git log -1 --oneline)"

echo ""
echo "=== Archivos ==="
for f in hooks/useEstadisticasLanding.ts app/services/estadisticasPublicasService.js firestore.rules; do
  test -f "$f" && echo "OK $f" || { echo "FALTA $f"; exit 1; }
done
rg -q 'docId == "estadisticas_publicas"' firestore.rules && echo "OK regla lectura publica estadisticas_publicas"

echo ""
echo "=== .firebaserc ==="
if test -f .firebaserc; then
  default_project="$(node -e "console.log(JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default||'')")"
  echo "default: ${default_project:-?(vacío)}"
fi

echo ""
echo "=== .env.local (solo si existe) ==="
if test -f .env.local; then
  env_project="$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID .env.local | head -1 | cut -d= -f2- | xargs)"
  echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${env_project:-?(no encontrado)}"
  if test -n "${default_project:-}" && test -n "${env_project:-}" && test "$default_project" != "$env_project"; then
    echo "DESALINEADO: firebase use $env_project"
  fi
else
  echo "(sin .env.local en este entorno — normal en CI)"
fi

echo ""
echo "Simulador Firebase: get /configuracion/estadisticas_publicas sin auth → Allow"
echo "Tras deploy: incognito localhost, sin banner; Admin → Recalcular estadísticas públicas"
