# Verificación local — landing (hero + estadísticas)

Si ves **stats antiguas** (`500+`, «Estudiantes activos») pero el **hero nuevo** (Temperatura, Período, etc.), tu entorno no tiene el commit completo o Next sirve caché.

Scripts de verificación:

```powershell
.\scripts\verify-landing-stats-local.ps1
```

Compara `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (`.env.local`) con `.firebaserc` → `projects.default`.

```bash
pnpm verify:landing-stats
```

## 1. Rama y commit

```powershell
git fetch origin
git checkout main
git branch --set-upstream-to=origin/main main
git pull
git log -1 --oneline
```

Esperado en `main`: commit **`4260079`** o posterior (landing grafito + stats dinámicas).

Comprueba archivos:

```powershell
Select-String -Path components\stats-section.tsx -Pattern "Estudiantes registrados"
Test-Path hooks\useEstadisticasLanding.ts
Test-Path app\services\estadisticasPublicasService.js
Select-String -Path firestore.rules -Pattern 'estadisticas_publicas'
```

## 2. Limpiar caché de Next

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm dev
```

Hard refresh (Ctrl+Shift+R) o ventana de incógnito en `http://localhost:3000/`.

(`NEXT_PUBLIC_*` se embebe al compilar; tras cambiar `.env.local`, reinicia `pnpm dev` y borra `.next`.)

## 3. Banner: «Sin permiso para leer estadísticas públicas»

Ese aviso aparece solo cuando Firestore devuelve **`permission-denied`** al leer `configuracion/estadisticas_publicas` (visitante no logueado). Las **universidades** vienen de `pendulos` (lectura pública desde siempre), así que pueden verse bien aunque falle este documento.

Regla necesaria en [`firestore.rules`](../firestore.rules):

```text
match /configuracion/{docId} {
  allow read: if docId == "estadisticas_publicas" || isSignedIn();
```

### 3.1 Mismo proyecto Firebase

```powershell
Select-String -Path .env.local -Pattern "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
```

El banner (y la consola F12) muestran el **projectId** que usa la app. En [Firebase Console](https://console.firebase.google.com) abre **ese** proyecto → Firestore → **Reglas** y confirma la línea anterior.

### 3.2 Simulador de reglas

- Operación: **get** (lectura)
- Ruta: `/configuracion/estadisticas_publicas`
- Autenticación: **sin autenticar**
- Resultado esperado: **Allow**

Si el simulador dice **Deny**, publica reglas del repo en ese proyecto:

```powershell
firebase login
firebase use <TU_PROJECT_ID>
firebase deploy --only firestore:rules
```

Volver a «cargar reglas» en otro proyecto o pegar reglas antiguas (`allow read: if isSignedIn()` en todo `configuracion`) **no** arregla el problema.

### 3.3 Prueba cruzada en el navegador

- Incógnito (sin login): si falla, revisa reglas.
- Logueado como admin: si el banner **desaparece** solo cuando hay sesión, confirma reglas sin lectura pública para `estadisticas_publicas`.

Consola (F12): busca `Error al escuchar estadísticas públicas` con `path` y `projectId`.

## 4. Después de que la lectura funcione

- Firestore → Datos → `configuracion` → `estadisticas_publicas` (puede no existir; entonces verás **0**).
- **Admin** → «Recalcular estadísticas públicas» (una vez) para contadores históricos.

## 5. Comportamiento esperado

| UI | Sin práctica / sin backfill |
|----|-----------------------------|
| Hero (telemetría) | `—` y demo/sin señal (normal) |
| Universidades | Número real desde `pendulos` (p. ej. 1) |
| Experimentos / estudiantes | `0` hasta backfill o nuevos eventos |
| Disponibilidad | `99.9%` fijo |
| `/pendulo-publico` | Misma telemetría que `/pendulo/UAC-01` (`VistaPublicaPendulo`), sin gráfica simulada |

## 6. Causas menos frecuentes

- **App Check** forzado sin token en dev.
- Base de datos Firestore **no default** (el SDK usa la default en [`app/services/firebase.js`](../app/services/firebase.js)).
