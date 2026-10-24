# Verificación local: landing stats + Firestore (Windows)
# Uso: desde la raíz del repo: .\scripts\verify-landing-stats-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== Git (main) ===" -ForegroundColor Cyan
git fetch origin 2>$null
$branch = git branch --show-current
Write-Host "Rama actual: $branch"
if ($branch -ne "main") {
  Write-Host "Recomendado: git checkout main && git branch --set-upstream-to=origin/main main && git pull" -ForegroundColor Yellow
}
$commit = git log -1 --oneline
Write-Host "Ultimo commit: $commit"

Write-Host "`n=== Archivos stats dinámicas ===" -ForegroundColor Cyan
@(
  "hooks\useEstadisticasLanding.ts",
  "app\services\estadisticasPublicasService.js",
  "firestore.rules"
) | ForEach-Object {
  if (Test-Path $_) { Write-Host "OK $_" -ForegroundColor Green }
  else { Write-Host "FALTA $_" -ForegroundColor Red }
}

$rule = Select-String -Path firestore.rules -Pattern 'estadisticas_publicas'
if ($rule) {
  Write-Host "OK Regla lectura publica estadisticas_publicas en firestore.rules" -ForegroundColor Green
} else {
  Write-Host "FALTA regla publica en firestore.rules (actualiza desde origin/main)" -ForegroundColor Red
}

Write-Host "`n=== Proyecto Firebase (.env.local vs .firebaserc) ===" -ForegroundColor Cyan
$firebaseRc = Join-Path $root ".firebaserc"
$defaultFirebaseProject = $null
if (Test-Path $firebaseRc) {
  try {
    $rc = Get-Content $firebaseRc -Raw | ConvertFrom-Json
    $defaultFirebaseProject = $rc.projects.default
    Write-Host ".firebaserc default: $defaultFirebaseProject"
  } catch {
    Write-Host "No se pudo leer .firebaserc" -ForegroundColor Yellow
  }
}

$envPath = Join-Path $root ".env.local"
$envProjectId = $null
if (-not (Test-Path $envPath)) {
  Write-Host "No existe .env.local — copia .env.example y completa NEXT_PUBLIC_FIREBASE_*" -ForegroundColor Red
} else {
  $pidLine = Select-String -Path $envPath -Pattern "^\s*NEXT_PUBLIC_FIREBASE_PROJECT_ID\s*=\s*(.+)\s*$"
  if ($pidLine) {
    $envProjectId = $pidLine.Matches[0].Groups[1].Value.Trim().Trim('"').Trim("'")
    Write-Host ".env.local NEXT_PUBLIC_FIREBASE_PROJECT_ID=$envProjectId"
  } else {
    Write-Host "Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID en .env.local" -ForegroundColor Red
  }
}

if ($envProjectId -and $defaultFirebaseProject) {
  if ($envProjectId -eq $defaultFirebaseProject) {
    Write-Host "OK Mismo projectId en .env.local y .firebaserc" -ForegroundColor Green
    Write-Host "Deploy reglas: firebase deploy --only firestore:rules" -ForegroundColor Yellow
  } else {
    Write-Host "DESALINEADO: la app usa $envProjectId pero firebase CLI usa $defaultFirebaseProject" -ForegroundColor Red
    Write-Host "Alinea con: firebase use $envProjectId  (o corrige .env.local)" -ForegroundColor Yellow
  }
} elseif ($envProjectId) {
  Write-Host "Deploy reglas: firebase use $envProjectId; firebase deploy --only firestore:rules" -ForegroundColor Yellow
}

Write-Host "`n=== Simulador Firebase (manual) ===" -ForegroundColor Cyan
Write-Host @"
Firestore > Reglas > Playground:
  - Operacion: get
  - Ruta: /configuracion/estadisticas_publicas
  - Auth: sin autenticar
  - Esperado: Allow
"@

Write-Host "`n=== Prueba navegador ===" -ForegroundColor Cyan
Write-Host "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; pnpm dev"
Write-Host "Incognito en http://localhost:3000/ — F12 si persiste banner naranja."
Write-Host "Si el banner desaparece al iniciar sesion pero no en incognito: reglas viejas (solo isSignedIn en configuracion)."
