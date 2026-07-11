# Lógica del código creado, archivo por archivo

## `bridge/` (proceso Node.js que corre en la Raspberry Pi)

### `bridge/src/config.js`

Lee variables de entorno (`.env`, ver `bridge/.env.example`) y expone un
único objeto `config` con: credenciales/host de MQTT, tópicos de
suscripción y de comandos, ruta de la cuenta de servicio de Firebase,
`DEFAULT_PENDULO_ID` (id del péndulo que atiende esta Pi), y el intervalo
de throttling para el histórico. Lanza un error claro al arrancar si falta
alguna variable requerida (`MQTT_USERNAME`, `MQTT_PASSWORD`), en vez de
fallar silenciosamente más adelante.

### `bridge/src/logger.js`

Utilidad mínima de logging con niveles (`debug`/`info`/`warn`/`error`),
respetando `LOG_LEVEL` de `.env`. Todo el resto del código llama a esto en
vez de `console.log` directo, para poder silenciar el ruido de `debug` en
producción sin tocar código.

### `bridge/src/firebaseAdmin.js`

Inicializa el **Admin SDK** de Firebase (una sola vez, patrón *singleton*)
usando el JSON de cuenta de servicio apuntado por
`GOOGLE_APPLICATION_CREDENTIALS`. El Admin SDK puede leer/escribir en
Firestore **sin pasar por las reglas de seguridad** (`firestore.rules`),
que es justo lo que necesita el bridge para escribir telemetría en
`pendulo_data` (donde los clientes web solo tienen permiso de lectura).

### `bridge/src/parsePayload.js` — el corazón del parseo

Punto de entrada: `parsePayload(topic, message)`. Recibe el tópico y el
payload crudo de un mensaje MQTT y devuelve un objeto normalizado:
`{ penduloId, fields, raw, topic, isEndSignal, isSample, isError,
isControlSignal }`.

Por dentro, en orden de prioridad:

1. **`tryParseControlSignal(trimmed)`** — ¿es una señal de control del
   handshake serial (`CFG+osc+dist`, `CFGOK`, `STR`, `STROK`, `DAT`, `END`,
   o algo con `STOP`)? Si sí, devuelve campos como
   `{ estadoDispositivo: "iniciado", estado: "en_progreso" }` (ver
   `docs/protocolo-mqtt.md` para el detalle de cada señal). Se guardan en
   `estadoDispositivo` (no en `estado`) para no pisar la máquina de
   estados de alto nivel de la práctica con texto crudo del firmware.
2. **`tryParseErrorCode(trimmed)`** — ¿es un código de error de texto
   plano tipo `"ERROR 1"`? Si sí, marca `estado: "error"` +
   `errorCodigo`/`errorMensaje`.
3. Si no es ninguna señal especial, intenta interpretar el payload como
   datos normales, en este orden:
   - **`tryParseJson(raw)`** — JSON válido (caso de `pendulo/mediciones`).
   - **`tryParseKeyValuePairs(raw)`** — texto tipo `"clave:valor
     clave2:valor2"`.
   - **`fallbackFieldFromTopic(topicSegments, raw)`** — si nada de lo
     anterior aplica, usa el último segmento del tópico como nombre de
     campo (caso de `pendulo/texto` → `{ texto: "HOLAAA" }`).
   - Luego `enrichErrorField` revisa si el resultado trae un campo `error`
     numérico (formato JSON, no texto plano) y también lo convierte en
     `estado: "error"`.
4. `normalizeKeys` (usado dentro de los parsers de JSON/key-value) aplica
   `FIELD_ALIASES` para que variantes de nombre (`muestra`→`muestras`,
   `period`→`periodo`, etc.) siempre terminen con el mismo nombre de campo
   en Firestore, y `coerceNumberIfPossible` convierte strings numéricos a
   `number` de verdad (para que las gráficas y comparaciones funcionen).
5. `hasSampleData(fields)` decide si el mensaje cuenta como **muestra
   real** (`isSample`): true si trae al menos uno de
   `periodo`/`gravedad`/`frecuencia`/`temperatura` como número. Solo las
   muestras reales se agregan al histórico (`lecturas`); todo lo demás
   solo actualiza el documento "en vivo".

`extractPenduloId()` siempre devuelve `config.defaultPenduloId`: se
confirmó con captura real que el tópico es plano (`pendulo/mediciones`,
sin id de péndulo en el medio) porque esta Raspberry atiende un solo
péndulo físico.

### `bridge/src/mqttToFirestore.js`

Se conecta al broker (`mqtt.connect`), se suscribe a `pendulo/#`, y por
cada mensaje llama a `parsePayload` y luego:

- El callback de `client.subscribe(...)` no solo revisa `err` (errores de
  red/local): también inspecciona el array `granted` que devuelve el
  broker. Esto es necesario porque la librería `mqtt.js` no siempre reporta
  como `err` una suscripción **rechazada por ACL** del broker — el broker
  puede responder con `qos: 128` en el SUBACK sin que la librería lo trate
  como error. Si detecta algún `granted[].qos >= 128`, lo loguea como
  `ERROR` explícito en vez de reportar "Suscrito" como si todo estuviera
  bien (bug real encontrado y corregido durante la puesta en marcha, ver
  `bridge/README.md` sección 8).
- El log de "mensaje recibido" (`MQTT <- {topic}: {payload}`) está a nivel
  `info` (no `debug`), así que se ve por defecto con la configuración de
  `.env` normal — útil para verificar rápidamente que el bridge está
  recibiendo tráfico sin tener que subir el nivel de log.

- Actualiza (con `merge: true`, para no borrar campos que no vinieron en
  este mensaje) el documento `pendulo_data/{penduloId}` con los campos
  parseados + `ultimoTopico`/`ultimoRaw`/`actualizadoEn`. Si `isSample` es
  true, fuerza `estado: "en_progreso"` (una muestra nueva implica que la
  práctica sigue corriendo).
- Si `isSample` es true (y no `isEndSignal`), además agrega un documento
  nuevo a la subcolección `lecturas` — pero solo si pasó el tiempo mínimo
  configurado en `LECTURAS_THROTTLE_MS` desde la última escritura para
  ese péndulo (`shouldWriteLectura`), para no disparar el costo/cuota de
  Firestore si llegan muchos mensajes por segundo.

### `bridge/src/commandsToMqtt.js`

`startCommandsListener(mqttClient)` abre un `onSnapshot` sobre
`pendulo_comandos where estado == "pendiente"`. Por cada documento nuevo
(`docChanges().type === "added"`), `processComando`:

1. Publica en el tópico fijo `config.mqtt.commandTopic` (`pendulo/comando`)
   un JSON `{ accion, oscilaciones, distanciaMuro, comandoId }`.
2. Si el publish fue exitoso, marca el comando como `estado: "enviado"`.
3. Si falla (broker caído, etc.), marca `estado: "error"` con el mensaje
   de error, para que la web pueda mostrarlo (hoy no lo muestra
   explícitamente, es una mejora futura sencilla: escuchar ese campo en
   `usePenduloData`).

### `bridge/src/index.js`

Punto de entrada (`npm start`): inicializa Firebase Admin, arranca
`startMqttToFirestoreBridge()` (que devuelve el cliente MQTT ya
conectado), y le pasa ese mismo cliente a `startCommandsListener` (así
ambas direcciones comparten una sola conexión MQTT). Registra manejadores
de `SIGINT`/`SIGTERM` para cerrar limpio si el proceso se detiene
(`systemctl stop`, `Ctrl+C`, etc.).

### `bridge/node-red-command-flow.json` y `bridge/node-red-estado-flow.json`

No son código del bridge en sí, son **flujos de Node-RED exportados** que
el usuario importa en el editor de Node-RED (no en el bridge). El primero
agrega el `mqtt in` que recibe comandos de la web y los traduce a
serial. El segundo reenvía a MQTT las señales de control que hoy solo se
ven en los `debug` nodes de Node-RED. Ver
`docs/flujo-comandos-web-a-pendulo.md` para el paso a paso de instalación.

## Web (`Next.js`)

### `app/services/penduloDataService.js`

Capa de acceso a Firestore para todo lo relacionado con el péndulo, usando
el SDK **cliente** de Firebase (sujeto a `firestore.rules`, a diferencia
del bridge que usa el Admin SDK):

- `escucharPenduloEnVivo(penduloId, callback, onError)` — `onSnapshot`
  sobre `pendulo_data/{penduloId}`.
- `escucharLecturasRecientes(penduloId, cantidad, callback, onError)` —
  `onSnapshot` sobre una query de `pendulo_data/{penduloId}/lecturas`
  ordenada por `timestamp desc` con `limit`, invertida antes de entregarla
  (para graficar en orden cronológico).
- `enviarComandoPendulo(comando)` — valida los campos requeridos y crea un
  documento en `pendulo_comandos` con `estado: "pendiente"`. El bridge
  recoge este documento y hace el resto (ver
  `docs/flujo-comandos-web-a-pendulo.md`).

### `hooks/usePenduloData.ts`

Hook de React que envuelve el servicio anterior para un componente:
expone `enVivo`, `lecturas`, `loading`, `error`,
`segundosDesdeUltimoDato` (calculado con un `setInterval` de 1s comparando
contra `enVivo.actualizadoEn`, para poder mostrar "sin señal" si el bridge
o el péndulo se caen), y `enviarComando`/`enviandoComando`. Se
desuscribe de ambos `onSnapshot` en el `useEffect` de limpieza.

### `app/dashboard/realtime/page.tsx`

Página del dashboard que consume `usePenduloData`. Contiene:

- Controles de "Oscilaciones" y "Distancia del muro" con límites de
  seguridad (`OSCILACIONES_MIN/MAX`, `DISTANCIA_MURO_MIN/MAX`) que
  deshabilitan el botón "Iniciar práctica" si el estudiante pone valores
  fuera de rango (para no dañar el mecanismo físico).
- **Confirmación antes de enviar** (`AlertDialog`): "Iniciar práctica" abre
  un diálogo con los valores ingresados y solo se envía el comando al
  darle "Sí, iniciar práctica" — evita disparos accidentales.
- **Bloqueo durante la configuración inicial** (`practicaEnCurso`,
  `configurandoHasta`, `SEGUNDOS_CONFIGURACION = 15`): Node-RED espera 15s
  entre `cfg` y `str` (ver `bridge/node-red-command-flow.json`) antes de
  que el péndulo realmente arranque. Durante esa ventana la UI muestra una
  cuenta atrás ("Configurando péndulo… el movimiento iniciará en Xs") y
  **deshabilita "Finalizar práctica"**, para que un clic apresurado no
  mande `detener` (→ `stop\r` por serial) y corte la práctica antes de que
  empiece de verdad (bug real que pasó durante las pruebas). El bloqueo se
  libera solo cuando termina la cuenta atrás, o antes si `enVivo.estado`
  ya confirma `"finalizado"`/`"error"`.
- Badge de estado derivado de `enVivo.estado` y `segundosDesdeUltimoDato`:
  "En vivo" | "Práctica finalizada" | "Error de hardware" | "Sin señal".
- Línea adicional con `enVivo.estadoDispositivo` (si existe) mostrando la
  última confirmación del hardware ("Péndulo confirmó el inicio", etc.) —
  solo aparece si se agregó `bridge/node-red-estado-flow.json` en
  Node-RED; si no, la web sigue funcionando igual, solo sin ese detalle.
- Tarjetas de valores instantáneos (período/gravedad/frecuencia/
  temperatura), tarjeta de resumen (muestras + promedios), **cuatro**
  gráficas (`MetricChart`, con Recharts: período, gravedad, frecuencia y
  temperatura — las dos últimas se agregaron porque ya se capturaban en
  `lecturas` pero no se graficaban) y tabla de histórico, todas
  alimentadas por `lecturas`/`enVivo` reales (nada simulado).
