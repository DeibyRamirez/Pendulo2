# Guía paso a paso: desplegar el bridge en un péndulo/Raspberry Pi nuevo

Esta guía es para un compañero que va a repetir esta instalación **en otra
Raspberry Pi, para otro péndulo físico distinto**, probablemente también
desde una red que bloquea `npm`/`pnpm` (como pasó la primera vez). Sigue
los pasos en orden — cada uno indica exactamente qué se complicó la primera
vez y cómo evitarlo.

> Resumen del porqué del método: la Raspberry Pi suele estar en una red
> (de universidad, por ejemplo) que bloquea la salida hacia el registro de
> npm. En vez de instalar las dependencias directo en la Pi, las instalamos
> en un PC normal (con internet sin restricciones) y subimos la carpeta
> **ya armada, con `node_modules` incluido**, comprimida en un solo
> archivo. Es la técnica de "despliegue por artefacto".

## 0. Antes de empezar — checklist de requisitos

- [ ] Acceso SSH a la nueva Raspberry Pi (IP, puerto, usuario, contraseña).
- [ ] Node.js ya instalado en esa Pi (`node -v`, se necesita v18 o superior;
      si no está, instalar con NodeSource o `nvm` antes de seguir).
- [ ] Mosquitto (broker MQTT) y Node-RED **ya instalados y funcionando** en
      esa Pi (eso lo instala/configura el docente responsable del péndulo
      físico, no es parte de esta guía).
- [ ] Usuario/contraseña del broker MQTT local de esa Pi (puede ser
      distinto de `pendulo_u`/`pendulo_u` — pregúntale a quien configuró
      Mosquitto en esa Pi específica).
- [ ] Un PC (Windows, Mac o Linux, no importa) con Node.js + `npm`
      instalados, y con **acceso normal a internet** (no tiene que ser la
      misma red que la Pi — de hecho es mejor que no lo sea, si la red de
      la Pi bloquea npm).
- [ ] Acceso a la consola de Firebase del proyecto (`pendulo-cd66e`) con
      permisos para generar claves de cuenta de servicio.
- [ ] Un usuario con rol **Admin** en la web, para poder registrar el nuevo
      péndulo desde el panel de administración.
- [ ] **Un ID único para este péndulo** decidido de antemano (ej.
      `UAC-02`, `UNIV-05-01`). No puede repetirse con el de otro péndulo ya
      registrado — pídelo/confírmalo con el equipo antes de seguir.

## 1. Copia la carpeta `bridge/` a tu PC

Si ya tienes el repo clonado, solo necesitas la carpeta `bridge/`. Si no,
clónalo:

```powershell
git clone <url-del-repo>
cd <repo>\bridge
```

## 2. Instala las dependencias en tu PC — usa `npm`, no `pnpm`

```powershell
cd bridge
npm install --omit=dev
```

**Por qué `npm` y no `pnpm`:** `pnpm` guarda los paquetes en un almacén
central (`.pnpm/`) y usa symlinks/junctions para enlazarlos dentro de
`node_modules`. Esos enlaces no sobreviven bien un `tar` hecho en Windows y
extraído en Linux — la primera vez que se hizo esto, el bridge arrancaba
pero fallaba con `Cannot find module 'google-auth-library'` (una
dependencia interna de `firebase-admin`) porque el enlace se rompió en la
traducción. `npm` copia archivos reales, sin symlinks, así que es seguro
entre sistemas operativos distintos.

> Si el repo tiene un `pnpm-workspace.yaml` en la raíz (por la web
> Next.js) y accidentalmente corres `pnpm install` en `bridge/`, puede
> terminar en segundos sin crear nada y sin ningún error — porque pnpm
> detecta el workspace del directorio padre y opera sobre el proyecto raíz
> en silencio. Motivo extra para simplemente usar `npm` aquí.

Verifica que sí se creó todo antes de seguir:

```powershell
Get-ChildItem node_modules | Select-Object -First 5
```

## 3. Empaqueta la carpeta completa (incluyendo `node_modules`)

```powershell
tar -czvf bridge.tar.gz --exclude=.git *
```

## 4. Sube el archivo a la Raspberry Pi por `scp`

`scp` **no crea carpetas destino automáticamente** — créala primero por
SSH, o sube al `home` y descomprime con `-C` hacia la carpeta final:

```powershell
ssh -p <PUERTO_SSH> pi@<IP_PI> "mkdir -p /home/pi/pendulo-bridge"
scp -P <PUERTO_SSH> bridge.tar.gz pi@<IP_PI>:/home/pi/pendulo-bridge/
```

## 5. Descomprime en la Raspberry Pi

```bash
cd /home/pi/pendulo-bridge
tar -xzvf bridge.tar.gz
ls node_modules   # confirma que aparecen carpetas como mqtt, firebase-admin, dotenv...
```

Si `node_modules` no aparece o está vacío, algo falló en el paso 2 — no
sigas, vuelve ahí primero.

## 6. Configura el archivo `.env`

```bash
cp .env.example .env
nano .env
```

Ajusta especialmente estos campos (los demás casi siempre se quedan con el
valor de ejemplo):

| Variable | Qué poner | Cuidado |
|---|---|---|
| `MQTT_USERNAME` / `MQTT_PASSWORD` | Las credenciales reales del broker Mosquitto **de esta Pi específica** | Pueden ser distintas a las de otra instalación |
| `MQTT_SUB_TOPIC` | `"pendulo/#"` | **Debe llevar comillas.** Sin comillas, el `#` se interpreta como inicio de comentario en el parser de `.env` y el valor queda truncado en `pendulo/` (sin el `#`) — el bridge se suscribe pero nunca recibe nada, sin ningún error visible. Ya viene bien en `.env.example`, no lo quites al editar. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON de la cuenta de servicio (ver paso 7) | Debe apuntar a un archivo que sí exista en esa Pi |
| `FIREBASE_PROJECT_ID` | `pendulo-cd66e` (el mismo proyecto para todos los péndulos) | No cambia entre instalaciones |
| `DEFAULT_PENDULO_ID` | **El ID único de este péndulo** (ej. `UAC-02`) | Debe coincidir EXACTO (mayúsculas incluidas) con el `pendulo_id` que vas a registrar en el paso 8 |
| `LOG_LEVEL` | `info` | `debug` es más ruidoso, solo para diagnosticar problemas puntuales |

## 7. Cuenta de servicio de Firebase (Admin SDK)

Todos los péndulos comparten **el mismo proyecto de Firebase**
(`pendulo-cd66e`) — solo se distinguen por su `DEFAULT_PENDULO_ID`. Esto
significa que puedes:

- **Reutilizar** el mismo JSON de cuenta de servicio que ya se usó en otra
  Raspberry Pi (simplemente cópialo también a esta), o
- **Generar uno nuevo dedicado** para esta instalación (más trazable si
  algún día hay que revocar acceso de una Pi específica sin afectar a las
  demás — recomendado si tienes la opción).

Para generar uno nuevo: Firebase Console → proyecto `pendulo-cd66e` → ⚙️
Configuración del proyecto → **Cuentas de servicio** → Generar nueva clave
privada (se descarga un `.json`).

Sube el archivo a la Pi, **fuera de cualquier carpeta con git**:

```powershell
ssh -p <PUERTO_SSH> pi@<IP_PI> "mkdir -p /home/pi/secrets"
scp -P <PUERTO_SSH> "ruta\al\archivo.json" pi@<IP_PI>:/home/pi/secrets/
```

Y en la Pi, protégelo:

```bash
chmod 600 /home/pi/secrets/*.json
```

Confirma que la ruta en `GOOGLE_APPLICATION_CREDENTIALS` (paso 6) coincide
exactamente con el nombre de este archivo.

## 8. Registra el péndulo en la web (para que aparezca en reservas y en el mapa)

Con un usuario **Admin**, entra al panel de administración (`/admin`) y
crea el péndulo con:

- `pendulo_id`: el mismo ID exacto que pusiste en `DEFAULT_PENDULO_ID`
  (paso 6) — si no coinciden, la telemetría nunca se va a ver en la web
  aunque el bridge funcione perfecto.
- `institucion`, `pais`, `latitud`, `longitud`: datos reales de dónde está
  instalado este péndulo.
- `estado`: `Activo` (si lo dejas en otro estado, no aparecerá como
  disponible para reservar).

## 9. Prueba en modo manual (antes de instalarlo como servicio)

```bash
cd /home/pi/pendulo-bridge
node src/index.js
```

Deberías ver, sin errores:

```
[INFO] Conectado al broker MQTT.
[INFO] Suscrito a pendulo/# [{"topic":"pendulo/#","qos":0}]
```

(si ves `qos: 128` en vez de `0`/`1`/`2`, el broker rechazó la suscripción
por ACL — revisa usuario/contraseña o permisos en Mosquitto).

En otra terminal, simula una muestra (**una sola línea**, sin `\` de
continuación — pegar con salto de línea desde SSH en Windows puede
corromper el comando):

```bash
mosquitto_pub -h localhost -p 1883 -u <usuario> -P <contraseña> -t "pendulo/mediciones" -m '{"muestra":1,"periodo":2.87,"gravedad":9.78,"frecuencia":9.0,"temperatura":23}'
```

Deberías ver `[INFO] MQTT <- pendulo/mediciones: {...}` en la terminal del
bridge, y el documento `pendulo_data/<TU_ID>` debería aparecer/actualizarse
en Firestore.

Prueba también el sentido Web → Pi creando un documento manual en
`pendulo_comandos` (colección de Firestore) con
`{ penduloId: "<TU_ID>", usuarioId: "test", accion: "iniciar", oscilaciones: 5, distanciaMuro: 5, estado: "pendiente" }`
— el bridge debe detectarlo y publicarlo en `pendulo/comando` en menos de
un segundo, y el documento debe pasar solo a `estado: "enviado"`.

## 10. Conecta Node-RED al tópico de comandos (una sola vez por Pi)

1. Abre el editor de Node-RED de esa Pi (`http://<IP_PI>:1880`).
2. Menú ☰ → Import → selecciona **`bridge/node-red-command-flow.json`**
   (ojo, no confundir con `node-red-estado-flow.json`, que es otra cosa
   opcional — ver sección 5/6 de `bridge/README.md`) → "Nuevo flujo".
3. Abre el nodo `mqtt in` ("Comando desde la web") y edita el nodo de
   broker (ícono ✏️): pestaña Connection (`localhost`, `1883`) y pestaña
   **Security** con el usuario/contraseña reales de Mosquitto de esta Pi
   — Node-RED nunca exporta contraseñas al importar, así que si no la
   escribes de nuevo el nodo se queda colgado en "conectando" para
   siempre.
4. Reemplaza el nodo `debug (borrar luego)` por un `serial out` que
   apunte, del desplegable, a la **misma configuración de puerto serie**
   que ya usa el flujo original de esta Pi para hablar con el
   microcontrolador (no crees una nueva).
5. Despliega ("Deploy").

*(Opcional, no bloqueante)*: importa también `bridge/node-red-estado-flow.json`
si quieres que la web muestre confirmaciones en vivo del hardware
(`CFGOK`/`STROK`/`END`) — instrucciones en la sección 5 de
`bridge/README.md`.

## 11. Instala el bridge como servicio `systemd`

```bash
sudo cp /home/pi/pendulo-bridge/pendulo-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pendulo-bridge
sudo systemctl start pendulo-bridge
sudo systemctl status pendulo-bridge
journalctl -u pendulo-bridge -f   # logs en vivo
```

## 12. Prueba final end-to-end desde la web real

1. Como estudiante (o con cualquier usuario), crea una reserva en
   `/reservas` eligiendo este péndulo nuevo, para el horario actual.
2. Entra a `/dashboard/realtime`, confirma que el botón "Iniciar práctica"
   está habilitado (si dice "Fuera de turno", revisa que la reserva
   cubra la hora actual).
3. Da clic en "Iniciar práctica" con el péndulo físico conectado y
   encendido.
4. Confirma que el péndulo se mueve físicamente y que los datos
   (período/gravedad/frecuencia/temperatura) aparecen en vivo en la
   pantalla, sin recargar.

Si todo eso funciona, la instalación está completa para este péndulo.

## Si algo falla: solución de problemas

No repitas esta sección aquí — la lista completa y actualizada de bugs
reales encontrados (y su solución exacta) vive en
**`bridge/README.md`, sección 8**. Empieza por ahí antes de investigar
desde cero; es muy probable que el problema ya esté documentado.
