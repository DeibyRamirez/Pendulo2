const {
  advertencia,
  bloqueMonospace,
  construirDocumento,
  crearFichaControl,
  crearTablaContenido,
  espacioDespuesTabla,
  guardarDocumento,
  nota,
  parrafo,
  paso,
  pieFigura,
  saltoPagina,
  tabla,
  titulo1,
  titulo2,
  titulo3,
  vineta,
} = require("./estilos");

function cuerpoManualTecnico() {
  return [
    ...crearFichaControl("Manual Técnico"),
    ...crearTablaContenido(),
    saltoPagina(),

    titulo1("1. Introducción técnica"),
    titulo2("1.1 Propósito del documento"),
    parrafo(
      "Este Manual Técnico describe la arquitectura, el stack, el modelo de datos, las integraciones externas, la cadena IoT y los procedimientos de despliegue de la plataforma World Pendulum Alliance (WPA). Está dirigido a desarrolladores, docentes técnicos, administradores de laboratorio y jurados académicos que deban evaluar o mantener el sistema."
    ),
    parrafo(
      "La fuente de verdad es el repositorio de software (aplicación Next.js, reglas de Firestore y proceso pendulo-bridge). No se incluyen secretos reales: las credenciales se documentan solo como nombres de variables, con referencia a los archivos de ejemplo .env.example y bridge/.env.example."
    ),

    titulo2("1.2 Identificación del sistema"),
    tabla(
      ["Elemento", "Valor"],
      [
        ["Nombre visible", "World Pendulum Alliance | UAC"],
        ["Descripción", "Plataforma de laboratorio remoto para experimentos con péndulo físico"],
        ["Institución", "Corporación Universitaria Autónoma del Cauca"],
        ["Proyecto Firebase", "pendulo-cd66e (identificador de CLI; no es una clave secreta)"],
        ["Péndulo de referencia", "UAC-01"],
        ["Aplicación web", "Next.js 16 (App Router), desplegada en Vercel"],
        ["Versión documentada", "1.0 — septiembre de 2026"],
      ],
      [3200, 6160]
    ),
    espacioDespuesTabla(),

    titulo2("1.3 Problema de diseño que resuelve la arquitectura"),
    parrafo(
      "La interfaz web es serverless en Vercel: las funciones se despiertan por petición HTTP y no pueden mantener una conexión MQTT abierta las 24 horas. El broker Mosquitto vive únicamente en la red local de la Raspberry Pi (localhost:1883) y no debe exponerse a internet. Por ello la web nunca habla con el péndulo: lee y escribe Firestore, y un proceso persistente en la Pi (pendulo-bridge) traduce en ambas direcciones entre Firestore y MQTT."
    ),

    titulo1("2. Arquitectura del sistema"),
    titulo2("2.1 Vista de tres capas"),
    parrafo(
      "El sistema es distribuido, no un monolito clásico ni un conjunto de microservicios REST. Las tres capas son: (1) aplicación web en la nube, (2) Firestore como memoria compartida en tiempo real, (3) borde de laboratorio en la Raspberry Pi."
    ),
    bloqueMonospace([
      "Navegador  →  Next.js (Vercel)  ⇄  Firestore (Google Cloud)",
      "                                      ⇄  pendulo-bridge (Raspberry Pi)",
      "                                      ⇄  Mosquitto localhost:1883",
      "                                      ⇄  Node-RED  →  UART  →  dsPIC",
      "Cámara MJPEG: Raspberry Pi → Cloudflare Tunnel → navegador (no pasa por Firestore)",
    ]),
    pieFigura("Figura 1. Cadena de componentes de WPA. La web y el hardware solo se encuentran en Firestore, salvo la cámara."),

    titulo2("2.2 Qué corre en cada lugar"),
    tabla(
      ["Componente", "Dónde", "Tecnología", "Responsabilidad"],
      [
        ["Web WPA", "Vercel", "Next.js App Router, React 18", "UI, auth, reservas, comandos, visualización"],
        ["Firestore + Auth", "Google Cloud", "Firebase", "Identidad, datos y tiempo real"],
        ["pendulo-bridge", "Raspberry Pi", "Node.js 18+, systemd", "MQTT ↔ Firestore 24/7"],
        ["Mosquitto", "Raspberry Pi", "Broker MQTT", "Mensajería local, no pública"],
        ["Node-RED", "Raspberry Pi", "Flujos del laboratorio", "Único proceso con puerto serial"],
        ["dsPIC", "Hardware del péndulo", "Firmware propio", "cfg / str, medición, DAT / END"],
        ["Cámara", "Pi + Cloudflare", "MJPG-streamer", "Stream MJPEG HTTPS al navegador"],
        ["PhysicsAI", "Vercel Route Handler", "Vertex AI Gemini", "POST /api/chat"],
      ],
      [2000, 1800, 2500, 3060]
    ),
    espacioDespuesTabla(),

    titulo2("2.3 Por qué Firestore y no WebSockets propios"),
    parrafo(
      "Montar Socket.io exigiría un servidor Node persistente adicional. Vercel no sostiene WebSockets de larga duración en funciones serverless estándar. Firestore onSnapshot ya cubre reservas, autenticación de perfil y telemetría con el mismo patrón, sin introducir una pieza nueva de infraestructura."
    ),

    titulo2("2.4 Principio de un solo dueño del puerto serial"),
    parrafo(
      "El microcontrolador se controla por UART, no por red. Node-RED, instalado en la Pi, es quien tiene el puerto serial abierto. El bridge nunca abre el serial: solo publica y consume MQTT. Abrir el puerto desde dos procesos a la vez es una condición de falla y está prohibida por diseño."
    ),

    titulo1("3. Stack tecnológico"),
    titulo2("3.1 Aplicación web (raíz del repositorio)"),
    tabla(
      ["Categoría", "Tecnología", "Versión"],
      [
        ["Framework", "Next.js", "16.1.6"],
        ["UI", "React", "^18.3.1"],
        ["Lenguaje", "TypeScript (+ JS en servicios)", "5.7.3"],
        ["Estilos", "Tailwind CSS + PostCSS", "^4.2.0"],
        ["Componentes", "shadcn/ui (Radix UI)", "1.x–2.x"],
        ["Formularios", "react-hook-form + zod", "^7.54.1 / ^3.24.1"],
        ["Mapas", "Leaflet + react-leaflet", "^1.9.4 / ^4.2.1"],
        ["Gráficas", "Recharts", "2.15.0"],
        ["Excel", "xlsx (SheetJS)", "^0.18.5"],
        ["QR", "qrcode.react", "^4.0.1"],
        ["BaaS cliente", "firebase", "^12.10.0"],
        ["Analítica", "@vercel/analytics", "1.6.1"],
        ["Gestor de paquetes", "pnpm", "pnpm-lock.yaml"],
      ],
      [2600, 4000, 2760]
    ),
    espacioDespuesTabla(),
    pieFigura("Tabla 1. Dependencias principales de package.json de la aplicación web."),

    titulo2("3.2 Bridge IoT"),
    tabla(
      ["Tecnología", "Versión / nota"],
      [
        ["Node.js CommonJS", "v18 o superior"],
        ["mqtt", "^5.10.3"],
        ["firebase-admin", "^13.0.2"],
        ["dotenv", "^17.3.1"],
        ["Entrada", "bridge/src/index.js"],
        ["Servicio", "bridge/pendulo-bridge.service (systemd)"],
      ],
      [3600, 5760]
    ),
    espacioDespuesTabla(),

    titulo2("3.3 Laboratorio físico (no versionado como código de aplicación)"),
    vineta("Broker Mosquitto en localhost:1883."),
    vineta("Node-RED como traductor MQTT ↔ UART."),
    vineta("Microcontrolador dsPIC con comandos seriales cfg y str."),
    vineta("MJPG-streamer en el puerto 8080 de la Pi."),
    vineta("cloudflared (túnel Cloudflare) para publicar la cámara en HTTPS."),
    vineta("Opcionales de cámara: MediaMTX (WebRTC/WHEP), Tailscale Funnel, FRP (scripts de ejemplo)."),

    titulo2("3.4 Inteligencia artificial"),
    parrafo(
      "El agente PhysicsAI se invoca desde app/api/chat/route.ts contra Google Vertex AI, modelo gemini-2.5-flash-lite, con el system prompt definido en lib/physics-context.ts. La autenticación del servidor usa cuenta de servicio JSON o Application Default Credentials, nunca el SDK de cliente del navegador."
    ),

    titulo1("4. Estructura del repositorio"),
    tabla(
      ["Ruta", "Responsabilidad"],
      [
        ["app/", "App Router de Next.js: páginas, layout y API /api/chat"],
        ["app/services/", "Capa de datos Firebase (auth, péndulos, reservas, grupos, Excel)"],
        ["components/", "UI React, incluyendo componentes shadcn en components/ui"],
        ["hooks/", "useAuth, usePenduloData, useReservations, useModuloEvaluacion, entre otros"],
        ["lib/", "roles.ts, cámara, diagnóstico, parámetros de firmware, contexto de IA"],
        ["bridge/", "Proceso MQTT ↔ Firestore para la Raspberry Pi"],
        ["docs/", "Documentación técnica y los manuales universitarios Word"],
        ["scripts/", "Migración de lecturas y automatización de cámara"],
        ["firestore.rules", "Autorización de servidor (RBAC real)"],
        ["firestore.indexes.json", "Índices compuestos de consultas"],
        ["firebase.json / .firebaserc", "CLI de Firebase"],
      ],
      [3200, 6160]
    ),
    espacioDespuesTabla(),
    parrafo(
      "No existe middleware.ts de Next.js para proteger rutas. La guarda visual es el componente ProtectedRoute; la autorización efectiva está en las reglas de Firestore. El bridge utiliza Admin SDK y, por diseño, bypasea esas reglas con una cuenta de servicio restringida al entorno de la Pi."
    ),

    titulo2("4.1 Servicios de negocio (cliente)"),
    tabla(
      ["Archivo", "Operaciones principales"],
      [
        ["authService.js", "Registro, login, Google, recuperación, dominio .edu.co"],
        ["usuarioService.js", "Listado y actualización de rol/estado (Admin)"],
        ["penduloService.js", "CRUD del catálogo de estaciones"],
        ["penduloDataService.js", "Telemetría, iniciar/liberar práctica, comandos"],
        ["reservacionService.js", "Reservas, slots atómicos, completar turno"],
        ["grupoService.js", "Grupos, miembros, asignaciones, entregas, estados"],
        ["lecturasExportService.js", "Generación de libros Excel por rol"],
        ["firebase.js", "Inicialización del SDK cliente"],
      ],
      [3600, 5760]
    ),
    espacioDespuesTabla(),

    titulo2("4.2 Bridge (servidor de borde)"),
    tabla(
      ["Archivo", "Función"],
      [
        ["src/index.js", "Arranque del proceso"],
        ["src/config.js", "Lectura de variables de entorno"],
        ["src/mqttToFirestore.js", "Telemetría MQTT → documento en vivo + lecturas"],
        ["src/commandsToMqtt.js", "Comandos pendientes de Firestore → tópico MQTT"],
        ["src/parsePayload.js", "Normalización, alias, errores ERR1/ERR2, rangos físicos"],
        ["src/firebaseAdmin.js", "Admin SDK"],
        ["src/logger.js", "Registro según LOG_LEVEL"],
      ],
      [3600, 5760]
    ),
    espacioDespuesTabla(),

    titulo1("5. Modelo de datos Firestore"),
    parrafo(
      "El motor es Google Cloud Firestore (NoSQL documental). No hay SQL, ORM ni migraciones formales. Existe un script puntual scripts/migrate-lecturas.js que mueve lecturas legacy a practicas/legacy/lecturas."
    ),

    titulo2("5.1 Colecciones"),
    tabla(
      ["Colección", "ID de documento", "Escritura prevista", "Campos / notas"],
      [
        ["usuarios", "uid de Auth", "El propio usuario al crear; Admin al actualizar", "email, nombre, rol, estado, institucion, creadoEn"],
        ["pendulos", "pendulo_id (UAC-01)", "Admin", "institucion, pais, latitud, longitud, estado"],
        ["reservaciones", "automático", "Usuario autenticado", "usuario_id, pendulo_id, inicio/fin, estado, slot_id"],
        ["slots_ocupados", "determinístico", "Transacción atómica", "Evita doble reserva del mismo bloque"],
        ["pendulo_data", "penduloId", "Bridge + sesión con control", "Telemetría en vivo, usuarioActivo, practicaId"],
        ["…/practicas/{uid}/lecturas", "automático", "Solo bridge", "Histórico de muestras por práctica"],
        ["pendulo_comandos", "automático", "Web crea; bridge actualiza", "accion, penduloId, usuarioId, estado"],
        ["grupos / miembros", "auto / uid", "Docente", "nombre, docente_id, institucion"],
        ["asignaciones / entregas", "auto / uid", "Docente / estudiante", "fecha_limite, cuestionario, calificacion"],
        ["configuracion/app", "app", "Admin", "modulo_evaluacion (boolean)"],
      ],
      [2400, 2000, 2400, 2560]
    ),
    espacioDespuesTabla(),
    pieFigura("Tabla 2. Esquema lógico de Firestore. La subcolección lecturas legacy queda en solo lectura."),

    titulo2("5.2 Enumeraciones de estado"),
    vineta("Rol de usuario: Estudiante, Docente, Admin."),
    vineta("Estado de usuario: active, disabled."),
    vineta("Estado de péndulo: Activo, Inactivo, En_uso, En_mantenimiento."),
    vineta("Estado de reservación: pending, active, completed, cancelled."),
    vineta("Acción de comando: configurar, iniciar, detener."),
    vineta("Estado de entrega (derivado): sin_practica, practica_sin_cuestionario, entregado, calificado."),

    titulo2("5.3 Índices"),
    parrafo(
      "firestore.indexes.json declara índices compuestos sobre lecturas (practicaId + timestamp; penduloId + timestamp en collection group), reservaciones (pendulo_id + estado), slots_ocupados (pendulo_id + estado) y un field override de miembros.uid para búsquedas de collection group."
    ),

    titulo2("5.4 Duración máxima de reserva"),
    parrafo(
      "Las reglas validan que el fin sea posterior al inicio y que la diferencia no exceda 30 * 60 * 1000 milisegundos. El servicio de reservas replica la misma invariante en cliente para fallar rápido en la UI."
    ),

    titulo1("6. Autenticación y autorización"),
    titulo2("6.1 Firebase Authentication"),
    vineta("Correo y contraseña: iniciarSesion, registrarUsuario."),
    vineta("Google OAuth (popup): iniciarSesionConGoogle, con validación posterior de dominio."),
    vineta("Recuperación: sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset."),
    vineta("Contexto React: hooks/useAuth.tsx escucha onAuthStateChanged y carga el documento usuarios/{uid}."),
    parrafo(
      "validarDominioInstitucional exige que el correo, en minúsculas, termine en .edu.co. Si Google no cumple, se cierra la sesión y se lanza auth/unauthorized-domain."
    ),

    titulo2("6.2 RBAC"),
    parrafo(
      "lib/roles.ts define ROLES = Estudiante, Docente, Admin, la función normalizeRole, hasRequiredRole (comparación por prioridad) y getDashboardPathByRole (admin, docente o dashboard). ProtectedRoute redirige en el cliente; no es una frontera de seguridad frente a la API de Firestore."
    ),

    titulo2("6.3 Reglas de Firestore (resumen)"),
    tabla(
      ["Recurso", "Estudiante", "Docente", "Admin"],
      [
        ["usuarios", "Leer/crear propio (rol Estudiante)", "Leer otros", "Leer y actualizar rol/estado"],
        ["pendulos", "Lectura pública", "Lectura pública", "CRUD"],
        ["reservaciones", "CRUD propias", "Leer/actualizar todas", "Leer/eliminar"],
        ["pendulo_data control", "Si usuarioActivo = uid", "Lectura de prácticas", "Lectura de prácticas"],
        ["pendulo_comandos", "Crear si tiene control", "Leer", "Leer"],
        ["grupos", "Leer si es miembro", "CRUD propios", "Leer"],
        ["configuracion/app", "Leer", "Leer", "Escribir modulo_evaluacion"],
      ],
      [2400, 2400, 2280, 2280]
    ),
    espacioDespuesTabla(),
    nota(
      "hasPenduloControl comprueba que pendulo_data/{id}.usuarioActivo coincida con el uid autenticado. Esa es la llave para enviar comandos y no un rol elevado."
    ),

    titulo1("7. Integraciones externas"),
    titulo2("7.1 Inventario"),
    tabla(
      ["Servicio", "Uso en WPA", "Configuración"],
      [
        ["Firebase Auth + Firestore", "Identidad, datos, onSnapshot", "NEXT_PUBLIC_FIREBASE_*"],
        ["Vertex AI (Gemini)", "Agente PhysicsAI", "VERTEX_PROJECT_ID, VERTEX_LOCATION, GOOGLE_SERVICE_ACCOUNT_JSON"],
        ["Mosquitto MQTT", "Telemetría y comandos en la Pi", "MQTT_HOST, MQTT_PORT, MQTT_USERNAME, tópicos"],
        ["Cloudflare Tunnel", "Cámara MJPEG en HTTPS", "NEXT_PUBLIC_CAMARA_URL"],
        ["MJPG-streamer", "Origen local del video (puerto 8080)", "scripts/camara/"],
        ["OpenStreetMap / Leaflet", "Mapa de nodos", "Sin clave de API en el código"],
        ["Vercel + Analytics", "Hosting serverless y métricas", "Proyecto Vercel"],
        ["Opcional Tailscale / FRP / MediaMTX", "Túneles o WebRTC alternos", "Solo scripts de ejemplo"],
      ],
      [2600, 3200, 3560]
    ),
    espacioDespuesTabla(),
    pieFigura("Tabla 3. Conexiones a sistemas externos. Ninguna fila reproduce secretos de producción."),

    titulo2("7.2 Variables de entorno — aplicación web"),
    parrafo(
      "Archivo de referencia: .env.example en la raíz. Las claves NEXT_PUBLIC_* se embeben en el cliente; no deben contener secretos de Admin SDK ni contraseñas MQTT."
    ),
    tabla(
      ["Variable", "Propósito"],
      [
        ["NEXT_PUBLIC_FIREBASE_API_KEY", "API key del proyecto Firebase web"],
        ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "Dominio de Authentication"],
        ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "ID de proyecto"],
        ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "Bucket (SDK; el laboratorio no usa Storage como núcleo)"],
        ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "Identificador de mensajería"],
        ["NEXT_PUBLIC_FIREBASE_APP_ID", "App ID web"],
        ["NEXT_PUBLIC_APP_URL", "URL canónica de la aplicación"],
        ["NEXT_PUBLIC_CAMARA_PROTOCOLO", "mjpeg (producción) o webrtc (opcional)"],
        ["NEXT_PUBLIC_CAMARA_URL", "URL HTTPS del stream (ejemplo de túnel named)"],
        ["VERTEX_PROJECT_ID / VERTEX_LOCATION", "Proyecto y región de Vertex AI"],
        ["GOOGLE_SERVICE_ACCOUNT_JSON", "JSON de cuenta de servicio para /api/chat (solo servidor)"],
        ["GOOGLE_AI_API_KEY", "Reservada en el ejemplo; el chat usa Vertex"],
      ],
      [4200, 5160]
    ),
    espacioDespuesTabla(),
    advertencia(
      "Las credenciales MQTT y el JSON de Firebase Admin del bridge NO van en el .env de Vercel. La web nunca abre MQTT. Ver comentarios del propio .env.example."
    ),

    titulo2("7.3 Variables de entorno — bridge"),
    parrafo("Archivo de referencia: bridge/.env.example. Vive solo en la Raspberry Pi, fuera de Git."),
    tabla(
      ["Variable", "Propósito"],
      [
        ["MQTT_HOST / MQTT_PORT", "Broker local (localhost:1883)"],
        ["MQTT_USERNAME / MQTT_PASSWORD", "Usuario Mosquitto de esa instalación"],
        ["MQTT_SUB_TOPIC", "Suscripción, típicamente \"pendulo/#\" (comillas por el carácter #)"],
        ["MQTT_CMD_TOPIC", "Publicación de comandos (pendulo/comando)"],
        ["GOOGLE_APPLICATION_CREDENTIALS", "Ruta absoluta al JSON Admin en la Pi"],
        ["FIREBASE_PROJECT_ID", "Proyecto Firestore destino"],
        ["DEFAULT_PENDULO_ID", "Estación atendida por esta instancia (UAC-01)"],
        ["LECTURAS_THROTTLE_MS", "Mínimo entre escrituras históricas (300 ms por defecto)"],
        ["LOG_LEVEL", "debug | info | warn | error"],
      ],
      [4200, 5160]
    ),
    espacioDespuesTabla(),
    nota(
      "Algunos documentos internos mencionan un usuario MQTT distinto al del .env.example. La fuente de verdad operativa es el archivo .env de cada Raspberry Pi y la configuración real de Mosquitto en esa máquina, no un valor copiado de la guía."
    ),

    titulo1("8. Tiempo real, comandos y protocolo IoT"),
    titulo2("8.1 Mecanismos de tiempo real"),
    tabla(
      ["Mecanismo", "Dónde", "Función"],
      [
        ["Firestore onSnapshot", "Web y bridge", "Canal principal de telemetría, reservas y comandos"],
        ["Polling 1 s", "hooks/usePenduloData.ts", "Contador de segundos desde el último dato"],
        ["Barrido 30 s", "commandsToMqtt.js", "Reprocesar comandos atascados en pendiente"],
        ["WebSockets propios", "No implementados", "Descartados por el modelo serverless"],
      ],
      [2600, 2800, 3960]
    ),
    espacioDespuesTabla(),

    titulo2("8.2 Secuencia «Iniciar práctica»"),
    paso("El estudiante pulsa «Iniciar práctica» con oscilaciones y distancia del muro."),
    paso("La web toma el lock en pendulo_data (usuarioActivo, practicaId) y crea un documento en pendulo_comandos con accion iniciar y estado pendiente."),
    paso("El bridge recibe onSnapshot, publica en MQTT_CMD_TOPIC (pendulo/comando) un JSON {accion, oscilaciones, distanciaMuro, comandoId} y marca el comando como enviado."),
    paso("Node-RED traduce a serial. El firmware interpreta cfg como distancia del muro y luego oscilaciones (orden invertido respecto a la UI; ver lib/parametrosFirmwarePendulo.ts)."),
    paso("Se envían cfg\\t{dist}\\t{osc}\\r y str\\r. El dsPIC responde CFGOK, STROK, DAT, muestras y END por serial."),
    paso("Node-RED publica cada muestra en pendulo/mediciones. El bridge parsea, actualiza el documento en vivo y, con throttling, agrega lecturas históricas."),
    paso("La web refresca gráficas por onSnapshot sin recargar la página. Al terminar se libera la práctica y, al vencer 30 minutos, se completa la reservación."),
    pieFigura("Figura 2. Flujo de comando web → Firestore → bridge → MQTT → Node-RED → dsPIC → telemetría de retorno."),

    titulo2("8.3 Tópicos MQTT confirmados"),
    parrafo(
      "El broker es local. El bridge se suscribe a pendulo/#. Capturas reales con mosquitto_sub confirmaron telemetría en los siguientes tópicos."
    ),
    titulo3("pendulo/mediciones"),
    parrafo(
      "JSON por oscilación. Campos: muestra (normalizado a muestras), periodo (s), gravedad (m/s² calculada), frecuencia (lectura de sensor, no necesariamente 1/periodo), temperatura (°C). El parser marca isSample = true y dispara histórico."
    ),
    titulo3("pendulo/texto"),
    parrafo(
      "Texto plano de diagnóstico o prueba. Se guarda en el documento en vivo; no cambia la máquina de estados de la práctica."
    ),
    titulo3("pendulo/comando"),
    parrafo(
      "JSON de la web hacia Node-RED. Acciones: configurar, iniciar, detener."
    ),
    titulo3("pendulo/estado (propuesto)"),
    parrafo(
      "Las señales CFGOK, STROK, DAT, END existen en el serial y en los nodos debug de Node-RED, pero no necesariamente se publican hoy al broker. Hace falta el flujo adicional de estado para que el bridge las vea. Hasta entonces, la UI infiere fin de práctica por las muestras y por lógica de aplicación."
    ),

    titulo2("8.4 Cámara en vivo"),
    parrafo(
      "La cámara es un canal paralelo. MJPG-streamer sirve en la Pi; Cloudflare Tunnel named publica HTTPS (ejemplo de URL de desarrollo: host de cámara documentado en .env.example). El navegador pide NEXT_PUBLIC_CAMARA_URL. Componentes: camera-stream, reproductor WebRTC opcional y lib/camaraEnVivo.ts. Un fallo de túnel no debe confundirse con un fallo de Firestore."
    ),

    titulo1("9. API interna"),
    parrafo(
      "No existe una API REST de negocio para reservas, usuarios o péndulos. El cliente usa el SDK de Firestore. El único Route Handler de Next.js es:"
    ),
    titulo2("9.1 POST /api/chat"),
    vineta("Archivo: app/api/chat/route.ts."),
    vineta("Cuerpo: { messages: [{ role: \"user\" | \"assistant\", content: string }] }."),
    vineta("Respuesta: { reply: string }."),
    vineta("Consumidor: app/dashboard/agente-ia/page.tsx."),
    vineta("Modelo: gemini-2.5-flash-lite vía Vertex AI, con PHYSICS_SYSTEM_PROMPT."),
    parrafo(
      "El resto de operaciones (enviarComandoPendulo, iniciarPractica, crearReservacion, CRUD de péndulos y grupos) son funciones de app/services/* contra colecciones Firestore."
    ),

    titulo1("10. Despliegue y operación"),
    titulo2("10.1 Matriz de despliegue"),
    tabla(
      ["Componente", "Hosting", "Mecanismo"],
      [
        ["Web Next.js", "Vercel", "next build / next start; URL de referencia del proyecto"],
        ["Reglas e índices", "Firebase", "firebase deploy --only firestore"],
        ["Bridge", "Raspberry Pi", "Artefacto npm + tar + scp + systemd"],
        ["Cámara", "Pi → Cloudflare", "scripts/camara/activar-tunel-cloudflare.sh"],
        ["Node-RED y Mosquitto", "Raspberry Pi", "Instalación de laboratorio (docente técnico)"],
      ],
      [2600, 2800, 3960]
    ),
    espacioDespuesTabla(),
    parrafo(
      "En el repositorio no hay Dockerfile, docker-compose, vercel.json ni flujos de CI/CD en .github/workflows. El despliegue es manual y documentado. El flag typescript.ignoreBuildErrors en next.config.mjs implica que el build de Vercel no falla por errores de TypeScript: el control de calidad debe hacerse por revisión y pruebas funcionales."
    ),

    titulo2("10.2 Instalación del bridge (resumen)"),
    paso("En un PC de desarrollo: instalar dependencias del directorio bridge/ (Node 18+)."),
    paso("Empaquetar el artefacto (sin el JSON de cuenta de servicio) y copiarlo a la Pi."),
    paso("Colocar el JSON Admin en una ruta fuera de Git (por ejemplo /home/pi/secrets/) y apuntar GOOGLE_APPLICATION_CREDENTIALS."),
    paso("Crear bridge/.env a partir de .env.example, con el DEFAULT_PENDULO_ID de esa estación."),
    paso("Instalar pendulo-bridge.service y habilitar systemd (arranca al boot y se reinicia si cae)."),
    paso("Verificar mosquitto_sub en pendulo/# y la aparición de datos en pendulo_data/{id}."),
    parrafo(
      "El procedimiento detallado, incluidos incidentes reales de instalación, está en docs/despliegue-raspberry.md y bridge/README.md. La guía docs/guia-despliegue-nuevo-pendulo.md cubre el alta de un segundo nodo: repetir Pi + bridge + registro del péndulo en /admin."
    ),

    titulo2("10.3 Alta de un nuevo péndulo en la red"),
    paso("Instalar y validar hardware, Node-RED, Mosquitto y cámara en la nueva Pi."),
    paso("Desplegar una instancia de pendulo-bridge con su propio DEFAULT_PENDULO_ID."),
    paso("En el panel Admin, crear el documento en la colección pendulos con el mismo ID, coordenadas y estado Activo."),
    paso("Comprobar mapa, ficha pública y una práctica de prueba con un usuario Estudiante."),

    titulo2("10.4 Exportaciones Excel (servidor inexistente)"),
    parrafo(
      "Cada clic regenera el .xlsx en el navegador desde Firestore mediante lecturasExportService.js. No hay un archivo Excel persistido en Vercel. Tipos: práctica individual, general del estudiante, muestras del docente (dos hojas), entregas (plus), trabajo puntual (plus) y general del administrador con usuario_uid."
    ),

    titulo1("11. Seguridad"),
    vineta("Dominio institucional .edu.co en registro y Google."),
    vineta("Cuentas nuevas forzadas a rol Estudiante en create de usuarios."),
    vineta("Lock atómico de slots para impedir doble reserva."),
    vineta("Control exclusivo usuarioActivo para comandos al hardware."),
    vineta("Duración máxima de 30 minutos aplicada en reglas."),
    vineta("Broker MQTT no publicado a internet."),
    vineta("Admin SDK y JSON de servicio fuera del repositorio y del bundle de Vercel (excepto la cuenta de Vertex, inyectada como secreto de servidor)."),
    vineta("Cámara por HTTPS de túnel; no incrustar HTTP mixto en producción."),
    advertencia(
      "La protección de rutas en React es insuficiente por sí sola. Cualquier evolución del sistema debe mantener y probar firestore.rules. El bridge, al usar Admin SDK, debe correr solo en hardware controlado por la universidad."
    ),

    titulo1("12. Limitaciones conocidas y mantenimiento"),
    vineta("Ausencia de CI/CD y de contenedores en el repositorio."),
    vineta("Rutas prototipo /dashboard/usuarios y /dashboard/configuracion no están conectadas a Firebase."),
    vineta("Cobertura heterogénea de ProtectedRoute (algunas páginas de dashboard se apoyan en reglas y en useAuth interno)."),
    vineta("Señales de estado del firmware no siempre llegan a MQTT; la UI no debe asumir STROK/END por broker hasta desplegar el flujo de Node-RED correspondiente."),
    vineta("Posible divergencia de usuario MQTT entre documentos históricos: validar siempre el .env de la Pi."),
    vineta("Los JSON de ejemplo de flujos Node-RED citados en arquitectura pueden no estar versionados en el árbol actual; conviene exportarlos desde la Pi de laboratorio y anexarlos."),
    vineta("El build ignora errores de TypeScript: no usar esa bandera como evidencia de tipado correcto."),
    parrafo(
      "Mantenimiento recomendado: revisar cuotas de Firestore (throttling de lecturas ya existe), rotar cuentas de servicio, vigilar el túnel de cámara, y actualizar este manual cuando cambien tópicos MQTT, el modelo Gemini o el ID de un nuevo péndulo."
    ),

    titulo1("13. Glosario técnico"),
    tabla(
      ["Término", "Significado"],
      [
        ["BaaS", "Backend as a Service; en WPA, Firebase Auth y Firestore."],
        ["onSnapshot", "Listener en tiempo real del SDK de Firestore."],
        ["Admin SDK", "SDK privilegiado del bridge; ignora security rules."],
        ["Slot atómico", "Documento de exclusión mutua de un bloque horario."],
        ["Throttling", "LECTURAS_THROTTLE_MS para no saturar escrituras históricas."],
        ["cfg / str", "Tramas seriales de configuración e inicio del dsPIC."],
        ["usuarioActivo", "Uid con lock de hardware en pendulo_data."],
        ["Feature flag", "modulo_evaluacion en configuracion/app."],
        ["Tunnel named", "Túnel Cloudflare con hostname estable para la cámara."],
        ["ADC", "Application Default Credentials de Google Cloud."],
        ["App Router", "Sistema de rutas de Next.js 13+ usado en app/."],
        ["RBAC", "Control de acceso basado en los tres roles oficiales."],
      ],
      [2800, 6560]
    ),
    espacioDespuesTabla(),

    titulo1("14. Relación con la documentación existente"),
    parrafo(
      "Este manual unifica, en formato universitario, el material ya presente en docs/: arquitectura.md, protocolo-mqtt.md, flujo-comandos-web-a-pendulo.md, codigo-explicado.md, despliegue-raspberry.md, guia-despliegue-nuevo-pendulo.md, camara-en-vivo.md y flujos-excel.md, además de bridge/README.md. Esos archivos siguen siendo útiles como runbooks de ingeniería; el presente Word es el entregable formal para evaluación académica y transferencia."
    ),
    parrafo(
      "El Manual de Usuario, en la misma carpeta, cubre roles, menús y procedimientos de interfaz. Ambos documentos deben mantenerse en la misma versión (1.0) cuando el sistema cambie de forma incompatible."
    ),
    parrafo("Fin del Manual Técnico de la plataforma World Pendulum Alliance.", {
      run: { italics: true, bold: true, color: "0F2C59" },
    }),
  ];
}

async function generarManualTecnico() {
  const documento = construirDocumento({
    titulo: "Arquitectura, tecnologías, datos e integraciones de la plataforma",
    tituloCorto: "Manual Técnico WPA",
    tipoDocumento: "MANUAL TÉCNICO",
    descripcionCorta:
      "Referencia de ingeniería del laboratorio remoto WPA: web, Firebase, bridge MQTT y estación física.",
    cuerpo: cuerpoManualTecnico(),
  });
  return guardarDocumento(documento, "Manual_Tecnico_WPA.docx");
}

module.exports = { generarManualTecnico };
