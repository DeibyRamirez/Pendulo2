# pendulo-bridge

Proceso Node.js **independiente de la web** (no corre en Vercel/Next.js) que
vive de forma permanente en la Raspberry Pi del péndulo. Hace dos cosas:

1. **Telemetría (Pi → Web)**: se suscribe al broker Mosquitto local
   (`pendulo/#`), limpia/normaliza cada mensaje y lo escribe en Firestore
   (`pendulo_data/{penduloId}` en vivo + histórico en
   `pendulo_data/{penduloId}/lecturas`).
2. **Comandos (Web → Pi)**: escucha la colección `pendulo_comandos` en
   Firestore (donde la web crea un documento cuando el estudiante da
   "Iniciar práctica") y publica el comando en el tópico fijo
   `pendulo/comando` para que **Node-RED** lo traduzca a las instrucciones
   seriales (`cfg\t..\t..\r`, `str\r`) que ya usa el docente.

No hay que exponer el broker Mosquitto a internet en ningún sentido: todo el
tráfico con el broker es local (`localhost:1883`), y la única cosa que sale
a internet es tráfico HTTPS hacia Firestore.

## Por qué esto vive aquí y no en la web (Next.js/Vercel)

Vercel ejecuta la web como funciones serverless: se despiertan por
petición y no pueden mantener una conexión MQTT abierta 24/7. Este proceso
necesita estar siempre corriendo, así que vive en la propia Raspberry Pi
(o cualquier máquina siempre encendida con acceso a `localhost:1883`).

## 1. Instalar en la Raspberry Pi

### Opción A — la Pi SÍ tiene salida a internet (npm/pnpm funcionan ahí)

```bash
# En la Raspberry (por SSH)
sudo apt update
node -v   # si no hay Node 18+, instalar con NodeSource o nvm

# Copia esta carpeta bridge/ a la Pi, por ejemplo con scp desde tu PC:
#   scp -r bridge pi@<179.1.113.102>:/home/pi/pendulo-bridge
cd /home/pi/pendulo-bridge
npm install --omit=dev
cp .env.example .env
```

### Opción B — la red bloquea npm/pnpm (ej. red de universidad) → "despliegue por artefacto"

Si la Pi está en una red que bloquea la salida hacia el registro de npm (error de
red al hacer `npm install`/`pnpm install` directo en la Pi), instala las
dependencias en tu PC y sube la carpeta ya lista por `scp`. Pasos confirmados
(Windows como PC, Raspberry Pi como destino):

**En tu PC (PowerShell), dentro de `bridge/`:**

```powershell
# IMPORTANTE: usa npm, no pnpm, para generar node_modules aqui.
# pnpm usa symlinks/junctions hacia un "store" central (.pnpm) que NO
# sobreviven bien un tar en Windows + extraccion en Linux (paquetes
# transitivos como google-auth-library terminan "rotos"/faltantes).
# npm copia archivos reales, sin symlinks, por eso es seguro entre
# Windows y Linux para este caso.
npm install --omit=dev

# Empaqueta todo (incluyendo node_modules) en un solo archivo
tar -czvf bridge.tar.gz --exclude=.git *
```

**Sube el archivo (créale antes la carpeta destino en la Pi, o sube a `/home/pi/`):**

```powershell
ssh -p <PUERTO_SSH> pi@<IP_PI> "mkdir -p /home/pi/pendulo-bridge"
scp -P <PUERTO_SSH> bridge.tar.gz pi@<IP_PI>:/home/pi/pendulo-bridge/
```

**En la Raspberry, descomprime:**

```bash
cd /home/pi/pendulo-bridge
tar -xzvf bridge.tar.gz
ls node_modules   # confirma que SI llegaron los paquetes (mqtt, firebase-admin, dotenv, etc.)
cp .env.example .env
```

> ⚠️ **Si tu repo raíz tiene un `pnpm-workspace.yaml`** (monorepo con la web
> Next.js), NO corras `pnpm install` dentro de `bridge/` sin más: si `bridge`
> no está declarado como paquete del workspace, pnpm detecta el
> `pnpm-workspace.yaml` del directorio padre y **silenciosamente instala/verifica
> el proyecto raíz en vez de `bridge/`** (sin ningún error, solo dice "Done" y
> no crea `node_modules` en `bridge/`). Por eso esta guía usa `npm` para
> `bridge/` — al ser un proyecto standalone (no corre en Vercel, no depende
> del resto del monorepo), evita este problema por completo.

Edita `.env` con:
- `MQTT_USERNAME` / `MQTT_PASSWORD`: `pendulo_u` / `pendulo_u` (las que te
  compartió el docente).
- `GOOGLE_APPLICATION_CREDENTIALS`: ruta al JSON de la cuenta de servicio de
  Firebase (ver siguiente sección).
- `DEFAULT_PENDULO_ID`: el id del péndulo (ej. `UAC-01`, debe coincidir con
  el `pendulo_id` que ya existe en la colección `pendulos` de Firestore).

## 2. Cuenta de servicio de Firebase (Admin SDK)

El bridge necesita permisos para escribir en Firestore **saltándose las
reglas de seguridad** (por eso `pendulo_data` tiene `allow write: if false`
para clientes: solo el Admin SDK con esta credencial puede escribir ahí).

> ⚠️ Detectamos un archivo `pendulo-cd66e-8459b20a65bf.json` suelto en la
> raíz del repo web. Ese archivo **no debe usarse tal cual** para el
> bridge ni quedar en ningún repositorio. Recomendado:
> 1. Ve a Firebase Console → Configuración del proyecto → Cuentas de
>    servicio → Generar nueva clave privada. Genera una clave **nueva**
>    dedicada a este bridge.
> 2. Sube ese JSON únicamente a la Raspberry Pi (por `scp`), fuera de
>    cualquier carpeta con git, por ejemplo `/home/pi/secrets/`.
> 3. Restringe permisos: `chmod 600 /home/pi/secrets/*.json`.
> 4. Si el archivo viejo (`pendulo-cd66e-8459b20a65bf.json`) llegó a
>    commitearse alguna vez (revisa con
>    `git log --all -- pendulo-cd66e-8459b20a65bf.json` en tu PC), rota/borra
>    esa clave desde la consola de Firebase.

## 3. Probar en modo manual

**Confirmado funcionando (2026-07-11)** siguiendo estos pasos:

```bash
node src/index.js
```

Deberías ver, sin errores:

```
[INFO] Conectando a broker MQTT mqtt://localhost:1883 ...
[INFO] Escuchando comandos pendientes en Firestore (pendulo_comandos)...
[INFO] Conectado al broker MQTT.
[INFO] Suscrito a pendulo/# [{"topic":"pendulo/#","qos":0}]
```

El `qos` del `granted` debe ser `0`, `1` o `2` — si alguna vez ves `128` ahí,
el broker **rechazó la suscripción por ACL** aunque no hubo `err` (ver
sección de troubleshooting más abajo).

En otra terminal de la Pi, genera tráfico de prueba y confirma que el
bridge lo recibe (escribe el comando en **una sola línea**, sin `\` de
continuación — pegar un comando con salto de línea desde un cliente SSH en
Windows puede corromper el `-t` siguiente):

```bash
mosquitto_pub -h localhost -p 1883 -u pendulo_u -P pendulo_u -t "pendulo/mediciones" -m '{"muestra":1,"periodo":2.87,"gravedad":9.78,"frecuencia":9.0,"temperatura":23}'
```

Deberías ver el log `[INFO] MQTT <- pendulo/mediciones: {...}` (nivel
`info` por defecto, no hace falta `LOG_LEVEL=debug` para verlo) y, en la
consola de Firebase → Firestore, un documento `pendulo_data/UAC-01` con los
campos `muestras: 1, periodo: 2.87, gravedad: 9.78, ...` actualizándose, más
una entrada nueva en la subcolección `pendulo_data/UAC-01/lecturas`.

### Probar también el sentido Web → Pi (comandos)

Sin tocar la web todavía, crea un documento de prueba directo en Firestore
Console, colección `pendulo_comandos`:

```
penduloId: "UAC-01"
usuarioId: "test"
accion: "iniciar"
oscilaciones: 5
distanciaMuro: 5
estado: "pendiente"
```

El bridge debe reaccionar casi al instante (verás
`Comando <id> -> pendulo/comando: {...}` en su consola) y el documento debe
pasar solo de `estado: "pendiente"` a `estado: "enviado"`. Con
`mosquitto_sub -h localhost -p 1883 -u pendulo_u -P pendulo_u -t "pendulo/comando" -v`
en otra terminal deberías ver el JSON publicado.

**Nota:** el bridge está suscrito a `pendulo/#`, que también hace match con
`pendulo/comando` — vas a ver un log `MQTT <- pendulo/comando: {...}`
inmediatamente después de publicar el comando; es el bridge "escuchándose a
sí mismo" (no rompe nada, solo agrega un campo `comando` inofensivo al
documento en vivo).

## 4. Instalar como servicio (arranca solo, se reinicia si falla)

**Confirmado funcionando (2026-07-11).** Una vez que probaste el paso 3 en
modo manual y todo funciona, instálalo como servicio para que no dependa de
mantener una sesión SSH abierta:

```bash
sudo cp pendulo-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pendulo-bridge
sudo systemctl start pendulo-bridge
sudo systemctl status pendulo-bridge
journalctl -u pendulo-bridge -f   # ver logs en vivo
```

## 5. Formato de los mensajes (confirmado con `mosquitto_sub` real)

El péndulo mide **período de oscilación** y a partir de él calcula la
**gravedad local**, además de reportar **frecuencia** (cruda, del sensor) y
**temperatura**. Esta captura real confirma el tópico y el payload:

```bash
$ mosquitto_sub -h localhost -p 1883 -u pendulo_u -P pendulo_u -t "pendulo/#" -v
pendulo/texto "HOLAAA"
pendulo/mediciones {"muestra":1,"periodo":2.8709545,"gravedad":9.7757502,"frecuencia":9.0019779,"temperatura":22.91}
pendulo/mediciones {"muestra":2,"periodo":2.8722787,"gravedad":9.7667389,"frecuencia":9.001255,"temperatura":22.9}
pendulo/mediciones {"muestra":3,"periodo":2.8727145,"gravedad":9.7637758,"frecuencia":9.0056019,"temperatura":23}
```

Puntos clave confirmados:

- **El tópico de las muestras es fijo y plano: `pendulo/mediciones`**. No
  lleva ningún id de péndulo en el medio (esta Pi/broker atiende un solo
  péndulo físico). Por eso `extractPenduloId()` en `parsePayload.js` ya no
  intenta leer el tópico: siempre devuelve `DEFAULT_PENDULO_ID` (`.env`).
- El campo llega como `muestra` (singular); el parser ya lo mapea a
  `muestras` (alias en `FIELD_ALIASES`).
- `gravedad` sale ~9.76–9.78 m/s² (coherente con la gravedad real), buena
  señal de que el péndulo está bien calibrado.
- `pendulo/texto` parece un tópico de prueba/diagnóstico (mensaje `"HOLAAA"`
  de texto plano, no JSON) — se guarda igual como campo `texto` en el
  documento en vivo, sin romper nada, pero no es telemetría real.

**CONFIRMADO (2026-07-10, corriendo una práctica completa con
`mosquitto_sub` abierto de principio a fin): ni la señal `END` ni los
promedios se publican al broker todavía.** Solo llegan las muestras de
`pendulo/mediciones`. Node-RED sí genera internamente (visible únicamente
en sus nodos `debug`) todo el handshake serial de la práctica, en este
orden:

```
CFG+5+5   (eco de la config recibida: "cfg" + oscilaciones + distanciaMuro)
CFGOK     (config confirmada)
STR       (orden de inicio enviada)
STROK     (el péndulo confirmó el inicio -> aquí empieza realmente la práctica)
DAT       (empieza el stream de datos)
5+2.868...+9.793...+9.184...+23.31   (líneas de muestra crudas, una por oscilación,
                                       esto SÍ se parsea y publica en pendulo/mediciones)
END       (fin de práctica)
{ muestras, promedioPeriodo, promedioGravedad, ... }   (promedio acumulado final)
...STOP/STOPPED  (status final, ~27s después, probablemente un poll periódico)
```

Ninguna de estas señales de control (todo excepto las líneas de muestra)
sale del editor de Node-RED hoy. **Por eso agregamos
`bridge/node-red-estado-flow.json`**: un bloque de nodos que puedes pegar en
tu flujo existente (sin tocar lo que ya funciona) para reenviarlas a MQTT:

1. Abre el editor de Node-RED (`http://<IP_PI>:1880`).
2. Menú (☰) → Import → pega/importa `node-red-estado-flow.json`. Elige
   "Importar a: flujo actual" (o el flujo donde vive tu procesamiento de
   serial) para que quede en la misma pestaña que ya tienes.
3. Sigue las instrucciones del nodo `comment` amarillo que aparece
   ("LEER: cómo conectar este bloque"): básicamente agregar UN cable
   adicional desde el nodo que ya alimenta tu `debug` de líneas seriales
   crudas, hacia la entrada del nuevo nodo función "Filtrar señales de
   control". No requiere tocar ni desconectar nada existente.
4. Despliega y confirma con:
   ```bash
   mosquitto_sub -h localhost -p 1883 -u pendulo_u -P pendulo_u -t "pendulo/estado" -v
   ```
   Deberías ver `CFGOK`, `STR`, `STROK`, `DAT`, `END` mientras corres una
   práctica.
5. (Opcional) repite el paso 3 pero conectando el nodo que alimenta tu
   `debug` de promedios hacia el nodo mqtt out "Promedio (opcional) -> MQTT"
   del mismo bloque (topico `pendulo/promedio`), si quieres que
   `promedioPeriodo`/`promedioGravedad`/etc. lleguen a Firestore.

El bridge (`src/parsePayload.js`, función `tryParseControlSignal`) **ya
sabe interpretar** `CFGOK`/`STR`/`STROK`/`DAT`/`END`/`STOP` en cualquier
tópico bajo `pendulo/#` (no hace falta que sea exactamente `pendulo/estado`,
aunque es el que sugerimos) y los guarda en un campo separado
`estadoDispositivo` del documento en vivo (para no pisar el campo `estado`,
que es la máquina de estados de alto nivel de la práctica:
`en_progreso`/`finalizado`/`error`). `STROK` también marca
`estado: "en_progreso"` de inmediato (antes de que llegue la primera
muestra), y `END` marca `estado: "finalizado"`.

**Si decides NO hacer este cambio en Node-RED** (queda como mejora
opcional), el sistema sigue funcionando: el frontend ya tiene un timeout de
"sin señal" (`segundosDesdeUltimoDato` en el dashboard) que detecta que la
práctica terminó cuando dejan de llegar muestras nuevas por
`SEGUNDOS_SIN_SENAL` (10s), solo que sin la confirmación instantánea de
`END`/`STROK`.

**Código de error del firmware** (confirmado en la capacitación de
instalación de la World Pendulum Alliance, formato exacto del mensaje aún
sin confirmar con datos reales):
- `1` = problema de alineación del láser (emisor/receptor).
- `2` = problema con el microswitch.

`src/parsePayload.js` reconoce patrones de texto plano tipo `"ERROR 1"`,
`"error:2"`, `"err1"` (ver `tryParseErrorCode`), y también un campo JSON
`error` si viniera dentro de un objeto. Cuando detecta un error, marca
`estado: "error"` en el documento en vivo (no se agrega al histórico).
Ajusta el regex en `tryParseErrorCode` en cuanto veamos el formato real.

Resumen de cómo clasifica cada mensaje `src/parsePayload.js`:
- Si el payload (recortado) es exactamente `"END"` (sin importar mayúsculas),
  se marca `estado: "finalizado"` y **no** se escribe en el histórico.
- Si es JSON con alguno de `periodo`/`gravedad`/`frecuencia`/`temperatura`
  (como en `pendulo/mediciones`), se trata como una **muestra real**
  (`isSample: true`): se refleja en el documento en vivo y se agrega al
  histórico (`lecturas`).
- Si es JSON solo con los `promedio*`, se refleja en el documento en vivo
  pero **no** se agrega al histórico (para no duplicar la serie de tiempo).
- Cualquier otro mensaje (ej. `pendulo/texto`) se guarda igual con el
  nombre del último segmento del tópico como campo (ej. `texto: "HOLAAA"`).

En cualquier caso, el mensaje crudo se guarda siempre en `ultimoRaw`
(doc en vivo) y `raw` (histórico), así que **nada se pierde** aunque
aparezca un mensaje con un formato distinto al esperado.

## 8. Solución de problemas (bugs reales que salieron durante la puesta en marcha)

Esta sección documenta problemas concretos ya diagnosticados y resueltos,
para no perder tiempo re-descubriéndolos en la próxima instalación
(nueva SD, nueva Pi, reinstalación, etc.):

### "Cannot find module 'google-auth-library'" (o cualquier dependencia transitiva de `firebase-admin`)

**Causa:** `node_modules` se generó con `pnpm` en Windows y se copió tal
cual (por `tar`/`scp`) a la Raspberry. `pnpm` usa symlinks/junctions hacia
un store central (`.pnpm/`) que no se traducen bien de Windows a Linux, así
que algunos paquetes anidados quedan "rotos" (el paquete de primer nivel
carga, pero sus propias dependencias no).

**Solución:** usa `npm install --omit=dev` (no `pnpm`) para generar
`node_modules` en el PC antes de empaquetar — ver sección 1, Opción B.

### `pnpm install` termina en segundos sin crear `node_modules`, sin ningún error

**Causa:** existe un `pnpm-workspace.yaml` en un directorio padre (ej. la
raíz del repo, si `bridge/` vive dentro del repo de la web) y `bridge` no
está declarado como paquete de ese workspace. `pnpm` detecta el
`pnpm-workspace.yaml` del padre y silenciosamente opera sobre el **proyecto
raíz del workspace**, ignorando el `package.json` de `bridge/` por
completo — sin avisar.

**Solución:** usa `npm` en vez de `pnpm` para `bridge/` (más simple), o si
insistes con `pnpm`, usa `pnpm install --ignore-workspace`.

### El bridge se suscribe ("Suscrito a ...") pero nunca recibe mensajes, aunque `mosquitto_sub` en otra terminal sí los recibe con las mismas credenciales

Dos posibles causas, en este orden de probabilidad:

1. **El tópico en `.env` quedó truncado por el carácter `#`.** Los parsers
   de `.env` (dotenv/dotenvx) tratan `#` como inicio de comentario cuando
   el valor no está entre comillas — así que
   `MQTT_SUB_TOPIC=pendulo/#` se lee como `pendulo/` (sin el `#`), que en
   MQTT es un tópico exacto y **no** hace match con `pendulo/mediciones`.
   Solución: usa comillas, `MQTT_SUB_TOPIC="pendulo/#"` (ya corregido en
   `.env.example`). Para diagnosticarlo, revisa el log de arranque: el
   bridge imprime el `granted` real de la suscripción
   (`JSON.stringify(granted)`), compáralo con lo que esperas.
2. **El broker rechazó la suscripción por ACL, sin reportarlo como `err`.**
   La librería `mqtt.js` no siempre traduce un SUBACK con código de
   denegación (`qos: 128`) en un `err` del callback de `subscribe()` — el
   código de `mqttToFirestore.js` ya revisa el array `granted` a mano y
   loguea un `ERROR` explícito si detecta `qos >= 128` en vez de quedarse
   callado. Si ves ese error, revisa la configuración de ACL de Mosquitto
   para el usuario usado.

### `mosquitto_pub`/`mosquitto_sub`: `Error: Unknown option ' -t'` (con un espacio raro dentro del mensaje de error)

**Causa:** al pegar un comando multilínea con `\` de continuación en
algunos clientes SSH sobre Windows, el salto de línea no se interpreta
igual que en un terminal Linux nativo y se cuela un carácter extra que
corrompe la siguiente opción.

**Solución:** pega el comando completo **en una sola línea**, sin `\`.

### Node-RED: el nodo `mqtt in` queda en "conectando" (punto azul) para siempre

**Causa:** al importar un flujo `.json` exportado, Node-RED **nunca
incluye contraseñas** de los nodos de configuración de broker (por
seguridad) — el nodo de broker importado suele quedar sin usuario/contraseña
configurados, así que Mosquitto nunca completa el handshake.

**Solución:** edita el nodo de broker (ícono ✏️ junto al campo "Servidor"),
revisa pestaña "Security" y vuelve a escribir el usuario/contraseña
(`pendulo_u`/`pendulo_u`), luego Deploy de nuevo.

## 6. Canal de comandos (Web → Pi) y cambios necesarios en Node-RED

Hoy, según nos comentaste, dentro de Node-RED hay un `function` node que se
dispara manualmente y envía por serial:

```js
node.send({ payload: "cfg\t5\t5\r" });
setTimeout(() => {
  node.send({ payload: "str\r" });
}, 15000);
return null;
```

Para que la web pueda disparar esto (botón "Iniciar práctica"), hay que
agregar en Node-RED un nodo `mqtt in` suscrito al tópico fijo
`pendulo/comando` que alimente una versión parametrizada de esa función (en
vez de `5, 5` fijos, toma `oscilaciones`/`distanciaMuro` del comando enviado
desde la web).

Pasos:

1. Abre el editor de Node-RED de la Pi (normalmente `http://<IP_PI>:1880`).
2. Menú (☰) → Import → pega/importa `node-red-command-flow.json` (este
   repo). Se crea una nueva pestaña "Pendulo - Comandos desde la Web".
3. Abre el nodo **mqtt in**: en "Server" selecciona o crea el broker
   (`localhost:1883`, usuario/contraseña `pendulo_u`/`pendulo_u` — Node-RED
   no exporta contraseñas, hay que escribirla de nuevo).
4. El nodo **function** ya trae la lógica parametrizada (`cfg\t{osc}\t{dist}\r`
   y luego `str\r` a los 15s, igual que el flujo actual pero con los
   valores que manda la web).
5. Reemplaza el nodo `debug (borrar luego)` conectando la salida del
   `function` directamente al **mismo nodo `serial out`** que ya usan hoy
   para hablar con el controlador del péndulo (o copia el código de la
   función dentro de tu flujo actual si prefieres no duplicar nodos).
6. Despliega ("Deploy").

Este bridge publica en el tópico fijo `pendulo/comando` un JSON:

```json
{ "accion": "iniciar", "oscilaciones": 5, "distanciaMuro": 5, "comandoId": "..." }
```

## 7. Modelo de datos en Firestore

```
pendulo_data/{penduloId}                      (doc "en vivo", se sobreescribe)
  muestras, periodo, gravedad, frecuencia, temperatura,       (última muestra)
  promedioPeriodo, promedioGravedad,
  promedioFrecuencia, promedioTemperatura,                    (promedios acumulados,
                                                                 solo si se activó el paso opcional 5)
  estado: en_progreso | finalizado | error,
  estadoDispositivo: configurando | configurado | iniciando | iniciado |
                      recibiendo_datos | finalizado | detenido,             (solo si se
                                                                 activó pendulo/estado)
  oscilacionesConfirmadas, distanciaMuroConfirmada,            (eco de "CFG+osc+dist")
  errorCodigo, errorMensaje,                                   (solo si estado === error)
  ultimoTopico, ultimoRaw, actualizadoEn

pendulo_data/{penduloId}/lecturas/{autoId}    (histórico, solo muestras reales,
                                                append-only, throttled)
  muestras, periodo, gravedad, frecuencia, temperatura,
  topico, raw, timestamp

pendulo_comandos/{autoId}                      (creado por la web)
  penduloId, usuarioId, accion, oscilaciones,
  distanciaMuro, estado: pendiente|enviado|error,
  fechaCreacion, atendidoEn, errorMsg?
```
