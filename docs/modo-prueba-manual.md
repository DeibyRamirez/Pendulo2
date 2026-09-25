# Modo prueba manual (loop automático cfg 15/15)

Permite al docente o administrador **guardar todas las muestras** de campañas
automatizadas de calibración, sin reserva de estudiante ni programar bucles en
Node-RED a mano.

Al pulsar **Iniciar prueba manual**, la web activa captura en Firestore y el
**bridge en la Raspberry Pi** orquesta ciclos automáticos:

1. Verificar conexión MQTT  
2. Enviar comando `iniciar` con **15 cm / 15 oscilaciones** (`cfg\t15\t15` en serial)  
3. Validar fin del ciclo (señal END si llega por MQTT, o muestras + silencio)  
4. Esperar **15 minutos** desde el fin del ciclo  
5. Repetir hasta **Finalizar prueba manual**

## Prerrequisitos

- Bridge `pendulo-bridge` **actualizado** en la Pi (incluye `manualTestLoop.js`).
- Node-RED con `mqtt in` en `pendulo/comando` conectado al `serial out` del péndulo
  (sección 6 de `bridge/README.md`).
- Mosquitto y bridge corriendo (`systemd`).
- Cuenta **Docente** o **Admin** en la web.

Opcional (validación más fiable): flujo que reenvía CFGOK/STROK/END a
`pendulo/estado` (documentado como `node-red-estado-flow.json`). Sin él, el loop
usa fallback por muestras JSON y timeouts.

## Pasos operativos

1. **Desplegar** web (Vercel) y bridge (Pi) con la versión que incluye el loop.
2. Entrar a **Panel docente** (`/docente`) o **Panel admin** (`/admin`).
3. Pulsar **Iniciar prueba manual** → badges **Captura activa** y **Loop automático**.
4. Observar estado del loop en la tarjeta (conectando → midiendo → esperando 15 min).
5. No hace falta abrir Node-RED ni ejecutar inject manual.
6. Al terminar la campaña, pulsar **Finalizar prueba manual** (envía `detener` al hardware).
7. Exportar Excel:
   - **Exportar esta sesión** en la tarjeta,
   - **Historial** (badge **Manual**),
   - Excel de muestras en `/docente`.

## Qué ocurre en Firestore

Al iniciar, la web escribe en `pendulo_data/UAC-01`:

| Campo | Valor |
|-------|--------|
| `usuarioActivo` | UID del docente/admin |
| `practicaId` | `manual_{uid}_{timestamp}` |
| `modoManual` | `true` |
| `loopManual.activo` | `true` |
| `loopManual.intervaloMinutos` | `15` |
| `loopManual.oscilaciones` / `distanciaMuro` | `15` / `15` |

El bridge crea documentos en `pendulo_comandos` y, tras validar cada ciclo,
actualiza `loopManual.estado`, `cicloActual`, `proximoCicloEn`, etc.

Muestras históricas:

`pendulo_data/UAC-01/practicas/{uid}/lecturas/{autoId}`

(todas los ciclos comparten el mismo `practicaId` de la sesión).

## Configuración del bridge (`.env`)

Variables opcionales (ver `bridge/.env.example`):

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MANUAL_LOOP_INTERVAL_MIN` | 15 | Minutos entre ciclos (desde fin del ciclo anterior) |
| `MANUAL_LOOP_OSC` | 15 | Oscilaciones por ciclo |
| `MANUAL_LOOP_DIST` | 15 | Distancia muro (cm) |
| `MANUAL_LOOP_CYCLE_TIMEOUT_MS` | 600000 | Timeout máximo por ciclo (10 min) |
| `MANUAL_LOOP_COMMAND_TIMEOUT_MS` | 30000 | Timeout esperando comando enviado |
| `MANUAL_LOOP_SAMPLE_SILENCE_MS` | 30000 | Silencio tras muestras para cerrar ciclo (fallback) |

Tras cambiar `.env`, reiniciar: `sudo systemctl restart pendulo-bridge`.

## Redeploy del bridge en la Pi

1. Empaquetar `bridge/` actualizado (con `src/manualTestLoop.js`, etc.).
2. Subir a la Pi y reemplazar la instalación.
3. Copiar nuevas variables de `bridge/.env.example` al `.env` local si faltan.
4. `sudo systemctl restart pendulo-bridge`
5. Ver logs: `journalctl -u pendulo-bridge -f`  
   Debe aparecer: `Escuchando modo prueba manual (loop automático)...`

## Verificación

1. Iniciar prueba manual en la web.  
2. En logs del bridge: ciclo 1 → comando creado → enviado → ciclo OK.  
3. Firestore: `loopManual.proximoCicloEn` ~15 min después de `ultimoCicloFin`.  
4. `practicas/{uid}/lecturas` crece en cada ciclo.  
5. Finalizar → el loop deja de crear comandos.

## Mensaje para el docente

> 1. Panel docente → **Iniciar prueba manual**.  
> 2. El sistema ejecuta solo cfg 15/15 cada 15 minutos.  
> 3. Todas las muestras quedan en Firestore.  
> 4. **Finalizar** al terminar y exporte desde Historial o Excel.

## Implementación

- Web: `app/services/reservacionService.js`, `components/prueba-manual-card.tsx`
- Bridge: `bridge/src/manualTestLoop.js`, `bridge/src/parametrosFirmwarePendulo.js`
- Export: `app/services/lecturasExportService.js` (sin cambios)
