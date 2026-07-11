# Despliegue real en la Raspberry Pi (runbook)

Este documento resume el **camino real** que se siguió para poner el
bridge a correr en la Raspberry Pi por primera vez, incluyendo los
obstáculos que salieron y cómo se resolvieron. Es el "diario de
instalación" — para los comandos detallados y la referencia completa, ver
`bridge/README.md` (que es la fuente de verdad actualizada, no se duplica
todo aquí para no desincronizar).

## Por qué no fue un simple `npm install` en la Pi

La Raspberry Pi estaba conectada a una red (de universidad) que bloquea la
salida hacia el registro de npm — cualquier `npm install`/`pnpm install`
corrido directo ahí fallaba por error de red. La solución fue el patrón de
**"despliegue por artefacto"**: instalar las dependencias en un PC con
internet normal, empaquetar todo (`node_modules` incluido) y subirlo ya
armado por `scp`, en vez de instalar en el destino final.

## Checklist de instalación (orden real que se siguió)

1. **Generar `node_modules` en el PC con `npm`** (no `pnpm`) dentro de
   `bridge/`. Motivo: `pnpm` usa symlinks/junctions hacia un store central
   (`.pnpm/`) que no sobreviven un `tar` desde Windows + extracción en
   Linux — paquetes anidados (ej. `google-auth-library`, dependencia de
   `firebase-admin`) terminaban faltando aunque el paquete de primer nivel
   sí cargara. `npm` copia archivos reales, sin symlinks, así que es seguro
   entre sistemas operativos distintos.
2. **Cuidado con `pnpm-workspace.yaml` en la raíz del repo.** Si intentas
   igual usar `pnpm` dentro de `bridge/` y el repo tiene un
   `pnpm-workspace.yaml` en un directorio padre (como este, por la web
   Next.js) sin declarar `bridge` como paquete del workspace, `pnpm`
   detecta ese archivo y **opera silenciosamente sobre el proyecto raíz en
   vez de `bridge/`** — sin ningún error, solo termina rápido sin crear
   `node_modules`. Por eso se optó por `npm` para este paquete específico
   (además de resolver el problema de symlinks del punto 1).
3. **Empaquetar y subir por `scp`** (`tar -czvf bridge.tar.gz --exclude=.git *`
   en el PC, `scp` al `home` de la Pi, `tar -xzvf` allá). Detalle: `scp` no
   crea directorios destino automáticamente — hay que `mkdir -p` en la Pi
   primero, o subir al `home` y extraer con `-C` hacia la carpeta destino.
4. **Configurar `.env`** a partir de `.env.example`. Aquí salió el bug más
   difícil de diagnosticar de todo el proceso: `MQTT_SUB_TOPIC=pendulo/#`
   sin comillas se interpretaba como `pendulo/` (el `#` se lee como inicio
   de comentario en el parser de `.env`), así que el bridge se suscribía a
   un tópico que nunca hacía match con `pendulo/mediciones`. Solución:
   comillas — `MQTT_SUB_TOPIC="pendulo/#"` (ya corregido en
   `bridge/.env.example`).
5. **Cuenta de servicio de Firebase (Admin SDK).** Se generó una clave
   dedicada desde Firebase Console (Configuración del proyecto → Cuentas
   de servicio) y se subió por `scp` a `/home/pi/secrets/` (fuera de
   cualquier carpeta con git), con `chmod 600`. Se confirmó que el archivo
   suelto que había en la raíz del repo web (`pendulo-cd66e-8459b20a65bf.json`)
   **nunca llegó a subirse a git** (`git log --all -- <archivo>` vacío) y
   además queda cubierto por `.gitignore` (`pendulo-*-*.json`), así que no
   hubo que rotar ninguna clave.
6. **Probar en modo manual** (`node src/index.js`) antes de instalar como
   servicio — ver `bridge/README.md` sección 3 para la secuencia completa
   de pruebas (telemetría con `mosquitto_pub`, comandos con un documento
   de prueba en Firestore).
7. **Conectar Node-RED al tópico de comandos.** Se importó
   `bridge/node-red-command-flow.json` como una pestaña nueva (no se tocó
   el flujo existente de telemetría). Import correction: hay **dos**
   flujos JSON en `bridge/` y es fácil confundirlos —
   `node-red-command-flow.json` es para comandos (Web → Pi, lo que
   corresponde a esta tarea) y `node-red-estado-flow.json` es para señales
   de estado del hardware (Pi → Web, mejora opcional, no bloqueante). Tras
   importar, hubo que:
   - Reconfigurar usuario/contraseña del nodo de broker MQTT (Node-RED
     nunca exporta contraseñas al importar un flujo, así que el nodo
     `mqtt in` quedaba en "conectando" para siempre hasta corregir esto).
   - Reemplazar el nodo `debug` temporal por un `serial out` real,
     reutilizando (del desplegable) la misma configuración de puerto serie
     que ya usaba el flujo original — sin esto, el comando se traduce
     correctamente pero nunca llega al controlador físico.
8. **Instalar como servicio `systemd`** (`bridge/pendulo-bridge.service`)
   para que sobreviva a reinicios y cierres de sesión SSH.

## Estado confirmado al cierre de esta instalación

- ✅ Telemetría Pi → Firestore (probado con `mosquitto_pub` simulando una
  muestra real).
- ✅ Comandos Firestore → Pi → Node-RED (probado con un documento manual en
  `pendulo_comandos`, traducción a `cfg\t5\t5` verificada en el panel de
  depuración de Node-RED).
- ✅ Bridge corriendo como servicio `systemd`.
- ⬜ Prueba end-to-end disparando "Iniciar práctica" desde la propia web
  (requiere una reserva activa vigente, ver
  `docs/flujo-comandos-web-a-pendulo.md`).
- ⬜ `bridge/node-red-estado-flow.json` (señales de estado del hardware)
  importado pero no confirmado conectado al cable real del serial —
  mejora opcional, no bloqueante.

## Ver también

- `bridge/README.md` — referencia completa de instalación y sección 8
  (solución de problemas) con cada bug documentado en detalle técnico.
- `docs/protocolo-mqtt.md` — tópicos y formatos de mensaje confirmados.
- `docs/flujo-comandos-web-a-pendulo.md` — el flujo completo Web → Pi
  explicado paso a paso.
- `docs/codigo-explicado.md` — lógica de cada archivo de código.
