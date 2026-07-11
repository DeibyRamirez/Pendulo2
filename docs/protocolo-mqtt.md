# Protocolo MQTT — tópicos y payloads

Fuente de verdad: capturas reales con `mosquitto_sub` (no solo los nodos
`debug` de Node-RED, que muestran señales *internas* que no siempre se
publican al broker). Este documento se actualiza cada vez que confirmamos
algo nuevo con una captura real.

## Broker

- Host: `localhost:1883` (solo accesible desde la propia Raspberry Pi).
- Usuario/contraseña: `pendulo_u` / `pendulo_u`.
- El bridge se suscribe con el wildcard `pendulo/#` (todo lo que empiece
  con `pendulo/`).

## Tópicos confirmados (telemetría, Péndulo → Web)

### `pendulo/mediciones` — una muestra por oscilación medida

Payload JSON, uno por cada oscilación que el péndulo mide durante una
práctica:

```json
{ "muestra": 1, "periodo": 2.8709545, "gravedad": 9.7757502, "frecuencia": 9.0019779, "temperatura": 22.91 }
```

- `muestra` (número de oscilación, 1, 2, 3...) — el bridge lo normaliza a
  `muestras` (alias en `FIELD_ALIASES`, `bridge/src/parsePayload.js`).
- `periodo` (segundos), `gravedad` (m/s², calculada a partir del período),
  `frecuencia` (cruda, del sensor — **no** es `1/periodo`, es una lectura
  aparte), `temperatura` (°C).
- El bridge marca estos mensajes como `isSample: true` → se reflejan en el
  documento "en vivo" **y** se agregan al histórico (`lecturas`, con
  throttling para no saturar Firestore).

### `pendulo/texto` — mensajes de prueba/diagnóstico

```
pendulo/texto "HOLAAA"
```

Payload de texto plano, sin estructura. No es telemetría real (parece un
mensaje manual de prueba). El bridge lo guarda igual (como campo `texto`
en el documento en vivo, usando el último segmento del tópico como nombre
de campo) para no perder información, pero no dispara ninguna lógica de
estado.

## Señales de control — confirmadas *dentro de Node-RED*, NO confirmadas todavía en el broker

Al correr una práctica completa con `mosquitto_sub -t "pendulo/#" -v`
abierto de principio a fin, **solo aparecieron mensajes en
`pendulo/mediciones` y `pendulo/texto`**. Sin embargo, los nodos `debug` de
Node-RED (que ven el tráfico serial crudo, antes de que se decida qué
publicar a MQTT) muestran que el microcontrolador sí envía una secuencia de
señales de control por serial, en este orden:

```
CFG+5+5     eco de la configuración recibida ("cfg" + oscilaciones + distanciaMuro)
CFGOK       configuración confirmada
STR         orden de inicio enviada
STROK       el péndulo confirmó el inicio (aquí arranca realmente la práctica)
DAT         empieza el stream de datos
...         (aquí van las N líneas de muestra, una por oscilación)
END         fin de práctica
{ muestras, promedioPeriodo, promedioGravedad, promedioFrecuencia, promedioTemperatura }   (promedio final, objeto ya parseado por Node-RED)
...STOP/STOPPED   status final (~27s después del END, probablemente un poll periódico ajeno a la práctica)
```

Estas señales **no llegan hoy al broker MQTT**, así que el bridge no puede
verlas todavía. Para que sí lleguen, hay que agregar un pequeño bloque de
nodos a Node-RED — ver `bridge/node-red-estado-flow.json` y la sección 5 de
`bridge/README.md`. Una vez agregado, quedarían así:

### `pendulo/estado` (propuesto) — señales de control

Texto plano, uno de: `CFGOK` | `STR` | `STROK` | `DAT` | `END` | variantes
con `STOP`. El bridge (`tryParseControlSignal` en
`bridge/src/parsePayload.js`) ya sabe reconocer estas señales **en
cualquier tópico** bajo `pendulo/#`, no solo en `pendulo/estado` — así que
funciona apenas Node-RED empiece a publicarlas, sin tener que tocar el
código del bridge otra vez.

### `pendulo/promedio` (propuesto, opcional) — promedio acumulado

```json
{ "muestras": 5, "promedioPeriodo": "2.8698625", "promedioGravedad": "9.7846685", "promedioFrecuencia": "9.2570881", "promedioTemperatura": "23.29" }
```

## Errores de hardware (confirmados en capacitación, formato de mensaje sin confirmar con datos reales)

- Código `1` = falla de alineación del láser emisor/receptor.
- Código `2` = falla del microswitch.

El bridge reconoce patrones de texto tipo `"ERROR 1"`, `"error:2"`, `"err1"`
(`tryParseErrorCode`), y también un campo JSON `error` numérico dentro de
un objeto (`enrichErrorField`). Ajustar el regex en cuanto se vea el
formato real publicado por el firmware/Node-RED.

## Tópicos de comandos (Web → Péndulo)

### `pendulo/comando` — publicado por el bridge, consumido por Node-RED

**Confirmado end-to-end (2026-07-11):** documento de prueba creado en
Firestore (`pendulo_comandos`, `estado: "pendiente"`) → el bridge lo
detectó, publicó en este tópico y marcó el documento como `"enviado"` → el
nodo `mqtt in` de Node-RED (`bridge/node-red-command-flow.json`, importado
como pestaña "Pendulo - Comandos desde la Web") lo recibió y el `function`
lo tradujo correctamente a `cfg\t5\t5` (verificado en el panel de debug de
Node-RED, luego conectado al `serial out` real).

Tópico **fijo** (sin id de péndulo: esta Raspberry solo atiende un péndulo
físico). El bridge publica esto cuando un estudiante hace clic en
"Iniciar práctica"/"Finalizar práctica" en la web:

```json
{ "accion": "iniciar", "oscilaciones": 5, "distanciaMuro": 5, "comandoId": "abc123" }
```

`accion` es una de `"configurar" | "iniciar" | "detener"`. Node-RED debe
tener un nodo `mqtt in` suscrito a este tópico — ver
`bridge/node-red-command-flow.json` y
`docs/flujo-comandos-web-a-pendulo.md`.

> Nota: como el bridge se suscribe con el wildcard `pendulo/#`, también
> recibe sus propios mensajes publicados en `pendulo/comando` (se ve como
> un log `MQTT <- pendulo/comando: {...}` justo después de publicarlo). No
> rompe nada — `parsePayload` no encuentra campos de muestra ahí, así que
> solo agrega un campo `comando` inofensivo al documento en vivo — pero es
> un comportamiento a tener en cuenta si se revisa el histórico de logs.

## Cómo el bridge decide qué escribir en Firestore

Todo pasa por `bridge/src/parsePayload.js` → `parsePayload(topic, message)`,
que devuelve `{ penduloId, fields, raw, topic, isEndSignal, isSample,
isError, isControlSignal }`. Luego `bridge/src/mqttToFirestore.js` decide:

- **Siempre** actualiza (merge) el documento "en vivo"
  `pendulo_data/{penduloId}` con `fields` + metadatos (`ultimoTopico`,
  `ultimoRaw`, `actualizadoEn`).
- **Solo si `isSample`** agrega una entrada nueva a
  `pendulo_data/{penduloId}/lecturas` (con throttling, para no disparar el
  costo de Firestore si llegan muchos mensajes por segundo).
- Los mensajes de control (`isControlSignal`) y errores (`isError`) **no**
  se agregan al histórico, solo actualizan el documento en vivo.

Todo el payload crudo se conserva siempre (`raw`/`ultimoRaw`), así que
ningún mensaje se pierde aunque venga en un formato que el parser no
reconozca todavía.
