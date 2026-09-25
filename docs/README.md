# Documentación — UAC Pendulum Lab (Web)

Esta carpeta documenta cómo la web (Next.js) se conecta con el péndulo
físico (Raspberry Pi + Node-RED + broker Mosquitto) para mostrar datos en
tiempo real y enviar comandos, y explica la lógica del código creado para
lograrlo.

## Manuales universitarios (Word)

Entregables formales de la plataforma **World Pendulum Alliance**. En la
portada hay campos editables (`[NOMBRE DEL AUTOR]`, `[DIRECTOR / TUTOR]`,
`[ASIGNATURA]`, `[CÓDIGO]`, `[SEMESTRE / PERIODO]`). Al abrir cada archivo
en Microsoft Word, actualice el índice (clic derecho → Actualizar campos).

1. [`Manual_de_Usuario_WPA.docx`](./Manual_de_Usuario_WPA.docx) — roles
   (Estudiante, Docente, Admin), objetivos, menús, procedimientos, FAQ y
   glosario.
2. [`Manual_Tecnico_WPA.docx`](./Manual_Tecnico_WPA.docx) — arquitectura,
   stack, Firestore, integraciones, MQTT, cámara, despliegue y seguridad.

Para regenerarlos: `cd scripts/documentacion && npm install && npm run generar`.

## Runbooks de ingeniería

Índice:

1. [`arquitectura.md`](./arquitectura.md) — visión general del sistema
   completo: qué corre en cada lugar (web/Vercel, Raspberry Pi, Firestore)
   y por qué.
2. [`protocolo-mqtt.md`](./protocolo-mqtt.md) — tópicos y formatos de
   mensaje MQTT confirmados con capturas reales, y cómo el bridge los
   interpreta (`bridge/src/parsePayload.js`).
3. [`flujo-comandos-web-a-pendulo.md`](./flujo-comandos-web-a-pendulo.md) —
   paso a paso de qué pasa "por debajo" cuando un estudiante hace clic en
   "Iniciar práctica" en la web, sin tener que abrir Node-RED cada vez.
4. [`codigo-explicado.md`](./codigo-explicado.md) — recorrido archivo por
   archivo del código creado (bridge y web), qué hace y por qué existe.
5. [`despliegue-raspberry.md`](./despliegue-raspberry.md) — runbook del
   despliegue real en la Raspberry Pi: qué se hizo, en qué orden, y los
   problemas concretos que salieron (y cómo se resolvieron).
6. [`guia-despliegue-nuevo-pendulo.md`](./guia-despliegue-nuevo-pendulo.md)
   — **guía para el equipo**: paso a paso completo para instalar este
   mismo bridge en otra Raspberry Pi / otro péndulo físico nuevo, incluido
   el registro del péndulo en la web y el checklist de requisitos previos.
7. [`camara-en-vivo.md`](./camara-en-vivo.md) — publicar el MJPEG con
   Cloudflare Tunnel named + `https://camarapendulo.cheiviz.com`. Scripts
   en `scripts/camara/`.
8. [`flujos-excel.md`](./flujos-excel.md) — diagramas de cada descarga de
   Excel (estudiante, docente de dos hojas, cuestionario/plus y admin).
9. [`modo-prueba-manual.md`](./modo-prueba-manual.md) — captura automatizada
   desde Node-RED: activar sesión manual en la web, persistir muestras y
   exportar Excel (docente/admin).

Para instrucciones de **instalación/despliegue** del bridge en la
Raspberry Pi (referencia técnica completa, con comandos, incluye
troubleshooting), ver [`../bridge/README.md`](../bridge/README.md) — no se
duplica aquí para que no queden desincronizados.

## Resumen en una frase

La web nunca habla directo con el péndulo. La web solo lee/escribe en
**Firestore**; un proceso Node.js separado (el "bridge", corriendo 24/7 en
la Raspberry Pi) es el único que habla MQTT con el broker Mosquitto local,
y traduce en ambas direcciones entre Firestore y MQTT.

```
┌─────────┐   Firestore (HTTPS)   ┌───────────────┐   MQTT (localhost)   ┌───────────┐   Serial   ┌────────────────┐
│   Web   │ <───────────────────> │ pendulo-bridge │ <──────────────────> │ Mosquitto │            │ Microcontrolador│
│ (Vercel)│                       │ (Raspberry Pi) │                      │  (broker) │ <── Node-RED ──> │  del péndulo   │
└─────────┘                       └───────────────┘                      └───────────┘            └────────────────┘
```
