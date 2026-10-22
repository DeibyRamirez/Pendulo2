# Verificación local — landing (hero + estadísticas)

Si ves **stats antiguas** (`500+`, «Estudiantes activos») pero el **hero nuevo** (Temperatura, Período, etc.), tu entorno no tiene el commit completo o Next sirve caché.

## 1. Rama y commit

```bash
git fetch origin
git checkout cursor/hero-live-telemetry-3dd6
git pull origin cursor/hero-live-telemetry-3dd6
git log -1 --oneline
```

Debe mostrar: `8042f23 Landing: estadísticas dinámicas desde Firestore` (o un commit posterior en esa rama).

En `main` tras fusionar el PR, el equivalente es `git pull origin main`.

## 2. Archivos que deben existir

- `components/stats-section.tsx` — label **«Estudiantes registrados»** (no «activos»).
- `hooks/useEstadisticasLanding.ts`
- `app/services/estadisticasPublicasService.js`
- `lib/penduloEnVivo.ts` (hero en vivo)

PowerShell:

```powershell
Select-String -Path components\stats-section.tsx -Pattern "Estudiantes registrados"
Test-Path hooks\useEstadisticasLanding.ts
Test-Path app\services\estadisticasPublicasService.js
```

## 3. Limpiar caché de Next

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm dev
```

Hard refresh (Ctrl+Shift+R) o ventana de incógnito en `http://localhost:3000/`.

## 4. Firebase

- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` en `.env.local` debe coincidir con el proyecto donde desplegaste [`firestore.rules`](../firestore.rules).
- Lectura pública: `configuracion/estadisticas_publicas` y colección `pendulos`.
- **Admin** → «Recalcular estadísticas públicas» (una vez) para contadores históricos de experimentos y estudiantes.

## 5. Comportamiento esperado

| UI | Sin práctica / sin backfill |
|----|-----------------------------|
| Hero (telemetría) | `—` y «Sin práctica en curso» (normal) |
| Universidades | Número real desde `pendulos` (p. ej. 1) |
| Experimentos / estudiantes | `0` hasta backfill o nuevos eventos |
| Disponibilidad | `99.9%` fijo |

Si la sección de stats muestra un aviso naranja, revisa la consola del navegador (F12) y las reglas del proyecto Firebase.
