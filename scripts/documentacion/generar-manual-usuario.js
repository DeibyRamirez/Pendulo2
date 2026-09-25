const {
  advertencia,
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

function cuerpoManualUsuario() {
  return [
    ...crearFichaControl("Manual de Usuario"),
    ...crearTablaContenido(),
    saltoPagina(),

    titulo1("1. Introducción"),
    titulo2("1.1 Presentación de la plataforma"),
    parrafo(
      "La plataforma World Pendulum Alliance (WPA) es un laboratorio remoto de péndulo físico desarrollado por la Corporación Universitaria Autónoma del Cauca, en articulación con la Universidad de los Andes y la red internacional Erasmus+. Su propósito es permitir que estudiantes y docentes de instituciones de educación superior realicen experimentos de medición de gravedad, periodo, frecuencia y temperatura sin estar físicamente frente al aparato, desde un navegador web."
    ),
    parrafo(
      "El sistema conecta tres mundos: la interfaz académica (sitio web), la base de datos en tiempo real (Firebase Firestore) y la estación física instalada en laboratorio (Raspberry Pi, broker MQTT, Node-RED y microcontrolador dsPIC). El usuario nunca habla de forma directa con el hardware: reserva un turno, inicia la práctica en su franja y observa lecturas y cámara en vivo mientras el puente técnico traduce órdenes y telemetría."
    ),
    parrafo(
      "La marca visible de la plataforma es WPA / UAC. El subtítulo institucional de la aplicación es «Plataforma de laboratorio remoto para experimentos con péndulo físico». El péndulo de referencia en producción se identifica como UAC-01."
    ),

    titulo2("1.2 A quién está dirigido este manual"),
    vineta("Estudiantes que se registran con correo institucional y realizan prácticas remotas."),
    vineta("Docentes que organizan grupos, asignan trabajos y califican entregas."),
    vineta("Administradores que gestionan el catálogo de péndulos, usuarios y la configuración global."),
    vineta("Evaluadores académicos que necesitan comprender objetivos, roles y procedimientos del sistema."),

    titulo2("1.3 Propósito del manual"),
    parrafo(
      "Este documento describe, en lenguaje operativo, todas las funciones habilitadas para cada rol, los menús reales de la interfaz, los flujos de trabajo de extremo a extremo y las condiciones de uso (correo .edu.co, turnos de 30 minutos, estados de reserva y de péndulo). No sustituye el Manual Técnico: aquí no se detallan protocolos MQTT ni variables de entorno, sino lo que el usuario ve y debe hacer."
    ),

    titulo2("1.4 Alcance y limitaciones"),
    parrafo("Queda dentro del alcance:"),
    vineta("Páginas públicas: inicio, login, registro, recuperación de contraseña, mapa de la red y ficha de péndulo."),
    vineta("Panel del estudiante, docente y administrador, con las funciones conectadas a Firebase."),
    vineta("Reservas, práctica en tiempo real, historial, exportación a Excel, mapa, agente PhysicsAI y módulo de evaluación (cuando un administrador lo activa)."),
    parrafo("Queda fuera del alcance operativo:"),
    vineta("Las pantallas de prototipo /dashboard/usuarios y /dashboard/configuracion, que no persisten datos reales en Firebase."),
    vineta("La instalación de Raspberry Pi, Node-RED o el firmware del dsPIC (se documentan en el Manual Técnico)."),
    vineta("El auto-registro con rol Docente o Admin: toda cuenta nueva nace como Estudiante."),
    nota(
      "El módulo de evaluación (grupos, cuestionarios y calificación) solo aparece cuando el administrador activa el interruptor «Módulo de evaluación» en el panel Admin. Si el interruptor está apagado, las opciones de Trabajos asignados y Excel de entregas no se muestran."
    ),

    titulo2("1.5 Convenciones de este documento"),
    vineta("Los nombres de botones, menús y pantallas se escriben tal como aparecen en la interfaz, entre comillas (por ejemplo, «Iniciar práctica»)."),
    vineta("Las rutas web se indican con barra inicial (por ejemplo, /dashboard/realtime)."),
    vineta("Los tres roles oficiales del sistema son exactamente: Estudiante, Docente y Admin."),
    vineta("Los campos de portada entre corchetes son editables en Microsoft Word."),

    titulo1("2. Objetivos"),
    titulo2("2.1 Objetivos de la plataforma"),
    parrafo("Objetivo general:"),
    parrafo(
      "Proveer un laboratorio remoto institucional que permita medir magnitudes del péndulo físico (periodo, gravedad, frecuencia y temperatura) de forma reservada, trazable y colaborativa entre universidades de la red WPA."
    ),
    parrafo("Objetivos específicos de la plataforma:"),
    vineta("Garantizar el acceso exclusivo al hardware mediante reservas de 30 minutos y un usuario activo por péndulo."),
    vineta("Visualizar telemetría y cámara en tiempo real durante el turno."),
    vineta("Conservar el historial de muestras y permitir su exportación a Excel."),
    vineta("Soportar tres perfiles de responsabilidad académica: Estudiante, Docente y Admin."),
    vineta("Opcionalmente, articular la práctica experimental con grupos, cuestionarios y calificación (0 a 5)."),
    vineta("Mostrar la red global de nodos WPA en un mapa público."),

    titulo2("2.2 Objetivos de este manual"),
    vineta("Describir las responsabilidades de cada rol sin ambigüedad."),
    vineta("Guiar el registro, el ingreso y la recuperación de contraseña."),
    vineta("Documentar procedimientos paso a paso de reserva, práctica, historial, evaluación y administración."),
    vineta("Ofrecer una matriz de funciones, un mapa de menús, preguntas frecuentes y un glosario del dominio."),

    titulo2("2.3 Objetivos por rol"),
    tabla(
      ["Rol", "Objetivo principal", "Resultado esperado"],
      [
        [
          "Estudiante",
          "Reservar, ejecutar y documentar una práctica remota",
          "Lecturas propias, Excel y, si aplica, entrega del cuestionario",
        ],
        [
          "Docente",
          "Organizar el trabajo académico alrededor del péndulo",
          "Grupos, asignaciones calificadas y reportes Excel",
        ],
        [
          "Admin",
          "Operar la plataforma y el catálogo de estaciones",
          "Péndulos, usuarios, configuración y diagnóstico",
        ],
      ],
      [1800, 3600, 3960]
    ),
    espacioDespuesTabla(),

    titulo1("3. Requisitos de acceso"),
    titulo2("3.1 Requisitos técnicos del usuario"),
    vineta("Navegador web actualizado (Chrome, Edge, Firefox o Safari)."),
    vineta("Conexión a internet estable. La práctica en vivo y la cámara dependen de una sesión continua."),
    vineta("Permiso del navegador para ventanas emergentes si se usa «Google Institucional»."),
    vineta("No se requiere instalar software de escritorio ni drivers del péndulo."),

    titulo2("3.2 Requisitos institucionales"),
    parrafo(
      "El correo electrónico debe terminar en .edu.co. Esta validación se aplica tanto al registro con contraseña como al inicio de sesión con Google. Cuentas genéricas (Gmail personal, Outlook, etc.) son rechazadas."
    ),
    parrafo("Instituciones predefinidas en el formulario de registro:"),
    vineta("Corporación Universitaria Autónoma del Cauca"),
    vineta("Universidad de los Andes"),
    vineta("Universidad Nacional de Colombia"),
    vineta("Universitat Politècnica de Catalunya"),
    vineta("Massachusetts Institute of Technology"),
    vineta("Otra institución de la red WPA"),

    titulo2("3.3 Condiciones de la cuenta"),
    vineta("Toda cuenta nueva se crea con rol Estudiante y estado active."),
    vineta("Solo un administrador puede cambiar el rol a Docente o Admin, o deshabilitar la cuenta (estado disabled)."),
    vineta("Una cuenta deshabilitada no debe usarse para operar el laboratorio."),
    vineta("La contraseña, cuando el registro es por correo, exige un mínimo de 8 caracteres."),
    vineta("Cada sesión experimental tiene una duración máxima de 30 minutos."),

    titulo1("4. Roles y responsabilidades"),
    titulo2("4.1 Jerarquía del sistema"),
    parrafo(
      "Los roles están definidos en el código de la aplicación y en las reglas de Firestore. La prioridad jerárquica es Estudiante (1), Docente (2) y Admin (3). Tras iniciar sesión, el sistema redirige automáticamente: el estudiante a /dashboard, el docente a /docente y el administrador a /admin."
    ),

    titulo2("4.2 Rol Estudiante"),
    parrafo("Responsabilidades:"),
    vineta("Registrarse con datos veraces e institución de la red."),
    vineta("Reservar únicamente los turnos que va a utilizar y cancelar a tiempo si no podrá asistir."),
    vineta("Iniciar la práctica solo dentro de su franja reservada."),
    vineta("Configurar con criterio académico el número de oscilaciones (1 a 20) y la distancia del muro (1 a 20 cm)."),
    vineta("Exportar y conservar sus propias muestras para informes de laboratorio."),
    vineta("Completar los cuestionarios de trabajos asignados cuando el módulo de evaluación esté activo."),
    parrafo("Puede: reservar y cancelar sus sesiones; iniciar y observar la práctica en Tiempo Real; consultar su historial; descargar Excel de una práctica o de todas las suyas; ver el mapa y la ficha pública de péndulos; usar PhysicsAI; entregar cuestionarios de los grupos a los que pertenece."),
    parrafo("No puede: crear péndulos; cambiar roles; ver reservas ajenas más allá de los huecos ocupados del calendario; enviar comandos al hardware si no es el usuario activo del péndulo; gestionar grupos ni calificar."),

    titulo2("4.3 Rol Docente"),
    parrafo(
      "El rol Docente no se autoasigna. Un administrador debe promover a la cuenta desde «Gestión de usuarios». El docente conserva acceso de lectura amplio a reservas e historial, y es el dueño académico de grupos y asignaciones."
    ),
    parrafo("Responsabilidades:"),
    vineta("Crear grupos coherentes con un curso (por ejemplo, Física II) y agregar solo estudiantes existentes."),
    vineta("Publicar asignaciones con fecha límite y cuestionario claro."),
    vineta("Calificar entregas en la escala 0 a 5 y retroalimentar el proceso experimental."),
    vineta("Supervisar el uso del péndulo mediante la vista de todas las reservaciones."),
    vineta("Exportar Excel de muestras y, si el módulo plus está activo, Excel de entregas."),
    parrafo("Puede: ver todas las reservaciones; crear, editar y eliminar sus grupos; agregar o quitar miembros; crear asignaciones; calificar; exportar reportes; consultar historial y mapa."),
    parrafo("No puede: crear o editar el catálogo de péndulos; cambiar roles globales de usuarios; activar o desactivar el módulo de evaluación (eso es exclusivo de Admin)."),

    titulo2("4.4 Rol Admin"),
    parrafo("Responsabilidades:"),
    vineta("Mantener actualizado el catálogo de estaciones (identificador, institución, país, coordenadas y estado)."),
    vineta("Asignar roles Docente o Admin y habilitar o deshabilitar cuentas."),
    vineta("Vigilar el uso global de reservas y el estado de los péndulos (Activo, Inactivo, En_uso, En_mantenimiento)."),
    vineta("Decidir si la institución opera el módulo de evaluación."),
    vineta("Usar el diagnóstico cuando un nodo no responde de forma esperada."),
    vineta("Exportar el Excel general de prácticas de un péndulo cuando se requiera auditoría académica."),
    parrafo("Puede: crear, editar y cambiar el estado de péndulos; gestionar usuarios; ver todas las reservaciones; conmutar el módulo de evaluación; ejecutar diagnóstico; descargar Excel administrativo."),
    parrafo("No puede: registrarse a sí mismo como Admin desde el formulario público. Las reglas de Firestore exigen que el documento inicial de usuario se cree con rol Estudiante."),

    titulo2("4.5 Matriz de funciones frente a roles"),
    tabla(
      ["Función", "Estudiante", "Docente", "Admin", "Público"],
      [
        ["Registro / login / recuperar clave", "Sí", "Sí", "Sí", "Formularios"],
        ["Mapa y ficha de péndulo", "Sí", "Sí", "Sí", "Sí"],
        ["Reservar turno de 30 min", "Sí (propias)", "Ve todas", "Ve todas", "No"],
        ["Iniciar práctica en vivo", "Sí, en su turno", "No como operador", "No como operador", "Ve telemetría"],
        ["Historial y Excel de muestras", "Solo propias", "Sí / Excel docente", "Excel del péndulo", "No"],
        ["Grupos y cuestionarios", "Entregar", "CRUD y calificar", "Leer", "No"],
        ["Catálogo de péndulos", "No", "No", "CRUD", "Lectura"],
        ["Cambiar roles de usuario", "No", "No", "Sí", "No"],
        ["Activar módulo de evaluación", "No", "No", "Sí", "No"],
        ["Agente PhysicsAI", "Sí", "Acceso vía ruta", "Acceso vía ruta", "No previsto"],
      ],
      [2400, 1740, 1740, 1740, 1740]
    ),
    espacioDespuesTabla(),
    pieFigura("Tabla 1. Matriz de funciones de la plataforma WPA según rol."),

    titulo1("5. Acceso a la plataforma"),
    titulo2("5.1 Registro de una cuenta nueva"),
    parrafo("Ruta: /registro. El proceso tiene dos pasos cuando se usa correo y contraseña."),
    paso("Ingrese a «Registrarse» desde la cabecera del sitio o abra /registro."),
    paso("Paso 1: escriba nombre completo, correo institucional (.edu.co) y seleccione institución."),
    paso("Pulse continuar. Si el correo no termina en .edu.co, el sistema rechaza el registro."),
    paso("Paso 2: defina una contraseña de al menos 8 caracteres y confírmela."),
    paso("Envíe el formulario. Se crea la cuenta en Firebase Authentication y el perfil en Firestore con rol Estudiante."),
    paso("El sistema muestra «¡Registro Exitoso!» y permite ir al inicio de sesión o al panel según el caso."),
    nota(
      "La interfaz informa explícitamente: «Tu cuenta se crea con rol Estudiante. Solo un Admin puede cambiar roles.»"
    ),
    parrafo("Registro con Google Institucional:"),
    paso("En /login o /registro elija «Google Institucional»."),
    paso("Autorice la cuenta de Google cuyo correo termine en .edu.co."),
    paso("Si el perfil aún no tiene institución, la plataforma redirige a /registro?uid=... para completarla (completarRegistroGoogle)."),
    paso("Si el perfil ya existe y está completo, ingresa directamente a su dashboard según el rol."),

    titulo2("5.2 Inicio de sesión"),
    parrafo("Ruta: /login. Métodos admitidos: correo + contraseña, o Google Institucional."),
    paso("Abra /login e ingrese sus credenciales, o pulse «Google Institucional»."),
    paso("El sistema carga el perfil Firestore (nombre, rol, estado, institución)."),
    paso("Según el rol, redirige a /dashboard, /docente o /admin."),
    advertencia(
      "Si su cuenta fue creada únicamente con Google, no intente recuperar una contraseña de correo: vuelva a entrar con «Google Institucional»."
    ),

    titulo2("5.3 Recuperación de contraseña"),
    parrafo("Ruta: /recuperar."),
    paso("Solicite el enlace con su correo institucional (enviarCorreoRecuperacion)."),
    paso("Abra el mensaje de Firebase y siga el vínculo que contiene el código de un solo uso (oobCode)."),
    paso("En la pantalla «Nueva contraseña» escriba una clave de mínimo 8 caracteres y confírmela."),
    paso("Al guardar (confirmarNuevaContrasena) verá «Contraseña actualizada» y podrá iniciar sesión."),

    titulo2("5.4 Cierre de sesión"),
    parrafo(
      "En el panel de estudiante use el control de salida de la barra lateral. En el panel docente use el botón «Salir». En la cabecera pública, «Cerrar sesión». El cierre invalida la sesión de Firebase en el navegador."
    ),

    titulo2("5.5 Páginas públicas (sin sesión obligatoria)"),
    tabla(
      ["Ruta", "Nombre en la interfaz", "Para qué sirve"],
      [
        ["/", "Inicio / Experimenta la física sin fronteras", "Presentación, estadísticas y acceso al dashboard"],
        ["/login", "Iniciar Sesión", "Ingreso con correo o Google"],
        ["/registro", "Registrarse", "Alta de cuenta Estudiante"],
        ["/recuperar", "Recuperar contraseña", "Restablecer clave por correo"],
        ["/mapa", "Red World Pendulum Alliance", "Mapa global de nodos en tiempo real"],
        ["/pendulo/[id]", "Ficha del péndulo", "Detalle público y gráficas en vivo"],
        ["/pendulo-publico", "Vista pública / QR", "Consulta alternativa pensada para códigos QR"],
      ],
      [2200, 3200, 3960]
    ),
    espacioDespuesTabla(),
    parrafo(
      "La cabecera pública ofrece: Inicio, Dashboard, Reservas, Red WPA (/mapa), Acerca de, Iniciar Sesión y Registrarse. El pie de página incluye la guía rápida de cuatro pasos y las preguntas frecuentes institucionales."
    ),

    titulo1("6. Guía del estudiante"),
    titulo2("6.1 Panel principal"),
    parrafo(
      "Tras el login, el estudiante llega a /dashboard con el saludo «Bienvenido, {nombre}» y el texto «Explora el péndulo remoto y agenda tus sesiones». El subtítulo de rol es Estudiante."
    ),
    parrafo("Tarjetas del panel:"),
    vineta("Péndulo en Vivo — acceso a la práctica en tiempo real."),
    vineta("Agendar Sesión — calendario de reservas."),
    vineta("Trabajos asignados — visible solo si el módulo de evaluación está activo."),
    vineta("Mis Reservas — listado de turnos propios."),
    vineta("Historial — prácticas y descargas."),
    vineta("Mapa de Péndulos WPA — red global."),
    parrafo(
      "El bloque «Información del Sistema» resume prácticas realizadas, próxima sesión y tiempo total. La barra lateral izquierda (Dashboard) contiene: Dashboard, Tiempo Real, Reservas, Mis Reservas, Historial, Trabajos asignados (condicional), Agente IA y volver al inicio."
    ),

    titulo2("6.2 Reservar una sesión"),
    parrafo(
      "Rutas: /dashboard/reservas o /reservas. Título para el estudiante: «Reservar Sesión». El péndulo por defecto del calendario es UAC-01. Los bloques (slots) son de 30 minutos, desde las 08:00 hasta las 24:00."
    ),
    paso("Abra Reservas y seleccione la fecha en el calendario."),
    paso("Observe los horarios. Un bloque ocupado (pending o active) no se puede tomar."),
    paso("Elija un horario libre. El sistema crea la reservación y un candado atómico en slots_ocupados para que nadie más tome el mismo turno."),
    paso("Verifique que la reserva aparece en «Mis Reservas» con estado pending."),
    parrafo("Estados de una reservación:"),
    vineta("pending — agendada, aún no en curso."),
    vineta("active — turno en ejecución."),
    vineta("completed — finalizada (por término natural o por vencimiento de los 30 minutos)."),
    vineta("cancelled — cancelada por el estudiante."),
    advertencia(
      "La duración máxima es de 30 minutos. El servicio y las reglas de Firestore rechazan reservas más largas. Si un horario ya está tomado, seleccione otro; no existe lista de espera."
    ),

    titulo2("6.3 Consultar y cancelar reservas"),
    parrafo("Rutas: /dashboard/mis-reservas o /mis-reservas. Título: «Mis Reservas»."),
    paso("Revise fecha, hora, péndulo e institución de cada turno."),
    paso("Si no podrá asistir, cancele la reserva pendiente para liberar el slot a otro estudiante."),
    paso("No intente iniciar la práctica fuera de la franja: el botón permanecerá bloqueado."),

    titulo2("6.4 Práctica en tiempo real"),
    parrafo(
      "Ruta: /dashboard/realtime. Título: «Visualización en Tiempo Real». Subtítulo típico: «Monitorea la medición de gravedad del péndulo {id}»."
    ),
    paso("Ingrese a Tiempo Real durante su turno reservado."),
    paso("Configure Oscilaciones (entero de 1 a 20)."),
    paso("Configure Distancia del muro (1 a 20 cm)."),
    paso("Pulse «Iniciar práctica». El sistema verifica que usted es el usuario con derecho al turno, toma el control exclusivo del péndulo (usuarioActivo) y envía el comando al hardware a través de Firestore."),
    paso("Observe las gráficas de periodo, gravedad, frecuencia y temperatura, y la cámara en vivo cuando esté disponible."),
    paso("Al terminar, la práctica se libera. Si se cumplen los 30 minutos, la reservación pasa a completed de forma automática."),
    parrafo("Badges de estado en pantalla:"),
    vineta("En vivo — hay telemetría de una práctica en curso."),
    vineta("Práctica finalizada — el hardware o el sistema cerraron la corrida."),
    vineta("Sin Uso — el péndulo no tiene práctica activa."),
    vineta("Error de hardware — el puente reportó una falla (por ejemplo, códigos de error del firmware)."),
    nota(
      "Mientras otra persona sea el usuarioActivo, usted no puede enviar comandos. El control es exclusivo por estación. La cámara viaja por una URL HTTPS independiente (no pasa por Firestore); si el túnel de cámara está caído, las gráficas pueden seguir funcionando."
    ),
    parrafo("Exportación inmediata desde Tiempo Real:"),
    vineta("«Excel de esta práctica» — muestras de la corrida actual."),
    vineta("«Excel general» — todas las prácticas del estudiante en ese péndulo."),

    titulo2("6.5 Historial de experimentos"),
    parrafo("Rutas: /dashboard/historial o /historial."),
    paso("Abra Historial para ver las prácticas agrupadas por identificador de práctica."),
    paso("Descargue el Excel de una fila o el Excel general del usuario (todas sus prácticas en los péndulos usados)."),
    parrafo(
      "Columnas típicas de una muestra: número de muestra, fecha, periodo (s), gravedad (m/s²), frecuencia y temperatura (°C). Si no hay lecturas, la descarga se detiene y se muestra un error; no se genera un archivo vacío."
    ),

    titulo2("6.6 Trabajos asignados (módulo de evaluación)"),
    parrafo(
      "Rutas: /dashboard/trabajos y /dashboard/trabajos/[asignacionId]. Solo visibles con el módulo activo."
    ),
    paso("Confirme que aparece «Trabajos asignados» en la barra lateral."),
    paso("Abra la lista y elija la asignación de su grupo (incluye fecha límite)."),
    paso("Realice primero la práctica en el péndulo, de modo que existan muestras asociadas a su usuario."),
    paso("Responda el cuestionario y envíe la entrega (enviarEntrega)."),
    parrafo("Estados que el docente verá sobre su trabajo:"),
    vineta("Sin práctica — aún no hay muestras."),
    vineta("Práctica sin cuestionario — hay datos del péndulo pero no se envió el formulario."),
    vineta("Entregado — cuestionario enviado, pendiente de nota."),
    vineta("Calificado — el docente asignó una nota de 0 a 5."),

    titulo2("6.7 Agente IA (PhysicsAI)"),
    parrafo(
      "Ruta: /dashboard/agente-ia. PhysicsAI es un tutor de física integrado. Responde únicamente preguntas de física (mecánica, péndulo, ondas, termodinámica, etc.). Si la consulta es ajena a la disciplina, indica que solo puede ayudar con física."
    ),
    paso("Abra Agente IA desde la barra lateral."),
    paso("Escriba una duda de laboratorio o de teoría y envíe el mensaje."),
    paso("Use las sugerencias de la interfaz cuando desee un punto de partida (por ejemplo, interpretación del periodo)."),
    nota(
      "PhysicsAI no mueve el péndulo ni reserva turnos. Es un apoyo pedagógico; la fuente de las mediciones sigue siendo el hardware y el historial de Firestore."
    ),

    titulo2("6.8 Mapa de la red WPA"),
    parrafo(
      "Ruta: /mapa. Título: «Red World Pendulum Alliance». Subtítulo: «Mapa global en tiempo real». Indicadores: Total Nodos, Disponibles y listado «Péndulos de la Red»."
    ),
    parrafo("Estados visibles de un nodo: Disponible, En uso, Mantenimiento e Inactivo. Al seleccionar un marcador se puede abrir la ficha pública /pendulo/[id] con gráficas en vivo de esa estación."),

    titulo1("7. Guía del docente"),
    titulo2("7.1 Panel docente"),
    parrafo(
      "Ruta: /docente. Saludo: «Bienvenido, Prof. {nombre}». La barra superior muestra la marca WPA / Docente, el nombre, la institución y el botón «Salir»."
    ),
    parrafo("Tarjetas y accesos:"),
    vineta("Grupos de trabajo — administración de cursos y miembros."),
    vineta("Péndulo en Vivo — observación de la estación."),
    vineta("Gestionar Reservas — calendario con todas las reservas (título «Gestión de Reservas»)."),
    vineta("Excel de muestras — libro de dos hojas (propias y globales del péndulo, con nombre)."),
    vineta("Historial y Mapa de Péndulos WPA."),
    parrafo(
      "El bloque «Estadísticas de Clase» resume estudiantes, asignaciones, entregas y grupos. Si el módulo de evaluación está apagado, las funciones plus (grupos, trabajos y Excel de entregas) no se ofrecen."
    ),

    titulo2("7.2 Crear y administrar grupos"),
    parrafo("Rutas: /docente/grupos y /docente/grupos/[grupoId]."),
    paso("Entre a Grupos de trabajo y cree un grupo (nombre, por ejemplo «Física II»)."),
    paso("Abra el grupo y busque estudiantes registrados (buscarEstudiantes)."),
    paso("Agregue miembros. Solo pueden pertenecer cuentas existentes en la plataforma."),
    paso("Edite o elimine el grupo si el periodo académico termina. Los docentes administran sus propios grupos."),

    titulo2("7.3 Crear una asignación con cuestionario"),
    paso("Dentro del grupo, cree una asignación con enunciado, preguntas y fecha límite."),
    paso("Comunique a los estudiantes que deben completar la práctica y luego el cuestionario."),
    paso("Abra /docente/asignaciones/[asignacionId] para seguir el tablero de entregas."),

    titulo2("7.4 Calificar y exportar"),
    paso("En la asignación, identifique el estado de cada estudiante (Sin práctica, Práctica sin cuestionario, Entregado, Calificado)."),
    paso("Asigne una calificación numérica de 0 a 5 a las entregas recibidas."),
    paso("Exporte el Excel del trabajo o el reporte general de entregas de sus grupos, según el botón disponible en el panel."),
    parrafo("Descargas Excel del docente:"),
    vineta("Excel de muestras (siempre): archivo excel_muestras_UAC-01_{fecha}.xlsx, dos hojas."),
    vineta("Excel de entregas (solo plus): reporte_docente_{fecha}.xlsx."),
    vineta("Excel de un trabajo (solo plus): reporte_trabajo_{id}.xlsx."),

    titulo2("7.5 Supervisión de reservas"),
    parrafo(
      "En /reservas el docente no agenda en nombre de un estudiante desde un flujo especial de impersonación: consulta «Todas las Reservas», verifica ocupación y puede gestionar el calendario institucional. El estudiante sigue siendo quien toma su propio slot."
    ),

    titulo1("8. Guía del administrador"),
    titulo2("8.1 Panel Admin WPA"),
    parrafo(
      "Ruta: /admin. Título: «Panel Admin WPA». Subtítulo: «Gestión completa de la plataforma». El subtítulo de rol es Administrador."
    ),
    parrafo("Elementos permanentes:"),
    vineta("Tarjeta Módulo de evaluación (interruptor global)."),
    vineta("Diagnóstico del péndulo."),
    vineta("Resumen de uso (totales de péndulos y otras métricas)."),
    vineta("Pestañas: Péndulos, Gestión de usuarios y Todas reservaciones."),

    titulo2("8.2 Catálogo de péndulos"),
    parrafo("Pestaña «Péndulos» — «Alta y edición de péndulos»."),
    paso("Registre un nuevo nodo con identificador (por ejemplo UAC-01), institución, país, latitud, longitud y estado."),
    paso("Actualice el estado operativo: Activo, Inactivo, En_uso o En_mantenimiento. Estos valores se reflejan en el mapa público."),
    paso("Edite coordenadas si la estación se relocaliza, para que Leaflet muestre el marcador correcto."),
    advertencia(
      "El identificador del péndulo debe coincidir con el que usa el bridge en la Raspberry Pi (DEFAULT_PENDULO_ID). Un desajuste deja la web y el hardware desconectados lógicamente."
    ),

    titulo2("8.3 Gestión de usuarios"),
    parrafo("Pestaña «Gestión de usuarios» — «Roles y estado de cuentas»."),
    paso("Localice la cuenta por nombre o correo."),
    paso("Cambie el rol a Estudiante, Docente o Admin según la responsabilidad institucional."),
    paso("Si una cuenta debe suspenderse, pase el estado a disabled."),
    paso("Confirme que el usuario, al volver a entrar, llega al dashboard correspondiente a su nuevo rol."),

    titulo2("8.4 Todas las reservaciones"),
    parrafo(
      "La pestaña «Todas reservaciones» ofrece la vista global de sesiones (pending, active, completed, cancelled). Sirve para auditoría de uso del laboratorio y para detectar turnos abandonados o conflictos."
    ),

    titulo2("8.5 Módulo de evaluación"),
    parrafo(
      "El interruptor escribe en Firestore configuracion/app.modulo_evaluacion. Activado: docentes ven grupos y Excel de entregas; estudiantes ven Trabajos asignados. Desactivado: esas entradas se ocultan, pero el Excel de muestras y el laboratorio remoto siguen disponibles."
    ),

    titulo2("8.6 Diagnóstico y Excel administrativo"),
    parrafo(
      "La herramienta de diagnóstico ayuda a verificar si un péndulo reporta telemetría, errores de hardware o ausencia de usuario activo. Desde Tiempo Real, el administrador puede descargar el Excel general de todas las prácticas de un péndulo (incluye identificador de usuario), útil para reportes institucionales."
    ),

    titulo1("9. Mapa de menús y rutas"),
    titulo2("9.1 Navegación del estudiante"),
    tabla(
      ["Menú", "Ruta", "Función"],
      [
        ["Dashboard", "/dashboard", "Inicio del rol"],
        ["Tiempo Real", "/dashboard/realtime", "Práctica, cámara y Excel inmediato"],
        ["Reservas", "/dashboard/reservas", "Calendario de 30 minutos"],
        ["Mis Reservas", "/dashboard/mis-reservas", "Turnos propios"],
        ["Historial", "/dashboard/historial", "Prácticas y descargas"],
        ["Trabajos asignados", "/dashboard/trabajos", "Cuestionarios (plus)"],
        ["Agente IA", "/dashboard/agente-ia", "Tutor PhysicsAI"],
      ],
      [2400, 3200, 3760]
    ),
    espacioDespuesTabla(),

    titulo2("9.2 Navegación del docente"),
    tabla(
      ["Pantalla", "Ruta", "Función"],
      [
        ["Panel docente", "/docente", "Estadísticas y accesos"],
        ["Grupos", "/docente/grupos", "CRUD de grupos"],
        ["Detalle de grupo", "/docente/grupos/[grupoId]", "Miembros y asignaciones"],
        ["Asignación", "/docente/asignaciones/[asignacionId]", "Entregas y notas"],
        ["Gestión de Reservas", "/reservas", "Todas las reservas"],
        ["Historial", "/historial", "Consulta de prácticas"],
        ["Mapa", "/mapa", "Red de nodos"],
      ],
      [2600, 3400, 3360]
    ),
    espacioDespuesTabla(),

    titulo2("9.3 Navegación del administrador"),
    tabla(
      ["Elemento", "Ruta / ubicación", "Función"],
      [
        ["Panel Admin WPA", "/admin", "Gestión completa"],
        ["Péndulos", "Pestaña en /admin", "Alta y edición de estaciones"],
        ["Gestión de usuarios", "Pestaña en /admin", "Rol y estado"],
        ["Todas reservaciones", "Pestaña en /admin", "Auditoría de turnos"],
        ["Módulo de evaluación", "Tarjeta en /admin", "Feature flag institucional"],
        ["Diagnóstico", "Tarjeta en /admin", "Salud del nodo"],
      ],
      [2800, 3000, 3560]
    ),
    espacioDespuesTabla(),

    titulo1("10. Preguntas frecuentes"),
    titulo3("¿Por qué no puedo registrarme con mi Gmail personal?"),
    parrafo(
      "La plataforma exige correo con dominio .edu.co para restringir el laboratorio a la comunidad de educación superior colombiana vinculada a la red."
    ),
    titulo3("¿Por qué no puedo reservar un horario?"),
    parrafo(
      "Ese bloque ya está ocupado (pending o active). Seleccione otro horario disponible. No hay superposición: el candado de slot es atómico."
    ),
    titulo3("¿Cuánto dura cada sesión?"),
    parrafo("Cada sesión tiene una duración máxima de 30 minutos."),
    titulo3("¿Cuándo puedo iniciar la práctica en tiempo real?"),
    parrafo(
      "Solo durante su turno reservado. Fuera de ese tiempo, el inicio permanece bloqueado."
    ),
    titulo3("Me registré y no veo herramientas de docente o admin."),
    parrafo(
      "Es el comportamiento diseñado. Solicite a un administrador el cambio de rol. Hasta entonces operará como Estudiante."
    ),
    titulo3("No aparece «Trabajos asignados»."),
    parrafo(
      "El administrador no ha activado el módulo de evaluación, o usted no pertenece a ningún grupo con asignaciones."
    ),
    titulo3("La cámara no se ve, pero las gráficas sí."),
    parrafo(
      "La cámara usa un túnel independiente. Informe al administrador de la estación; usted igual puede completar la práctica con las lecturas numéricas."
    ),
    titulo3("Olvidé la contraseña y siempre usé Google."),
    parrafo("No use /recuperar. Vuelva a «Google Institucional» en /login."),

    titulo1("11. Resolución de problemas"),
    tabla(
      ["Síntoma", "Causa probable", "Qué hacer"],
      [
        [
          "Mensaje de dominio no autorizado",
          "El correo no termina en .edu.co",
          "Use una cuenta institucional válida",
        ],
        [
          "No inicia la práctica",
          "Fuera de turno, slot ajeno o péndulo ocupado",
          "Verifique Mis Reservas y el badge de estado",
        ],
        [
          "Error de hardware",
          "Firmware o puente reportan falla",
          "No reintente en bucle; avise a soporte de laboratorio",
        ],
        [
          "Cuenta no entra al panel",
          "Estado disabled",
          "Solicite rehabilitación al Admin",
        ],
        [
          "Excel no descarga",
          "No hay lecturas para ese practicaId",
          "Ejecute la práctica y confirme muestras en vivo",
        ],
        [
          "Docente no ve grupos",
          "Módulo de evaluación apagado",
          "Pedir al Admin que lo active",
        ],
        [
          "Mapa sin su estación",
          "Péndulo no creado o sin coordenadas",
          "El Admin debe darlo de alta en el catálogo",
        ],
      ],
      [2400, 3200, 3760]
    ),
    espacioDespuesTabla(),
    pieFigura("Tabla 2. Guía rápida de resolución de problemas para usuarios finales."),

    titulo1("12. Flujo resumido de una práctica exitosa"),
    paso("Regístrese con correo .edu.co y rol Estudiante."),
    paso("Reserve un bloque libre de 30 minutos para UAC-01 (u otro péndulo habilitado)."),
    paso("En la hora exacta entre a Tiempo Real, configure oscilaciones y distancia del muro e inicie la práctica."),
    paso("Observe gráficas y cámara; espere a que terminen las muestras."),
    paso("Descargue el Excel de la práctica y consúltela luego en Historial."),
    paso("Si hay trabajo asignado, responda el cuestionario antes de la fecha límite."),
    pieFigura("Figura 1. Secuencia de usuario recomendada (guía del pie de página institucional)."),

    titulo1("13. Glosario"),
    tabla(
      ["Término", "Definición en WPA"],
      [
        ["Péndulo / nodo WPA", "Estación física remota con identificador (ejemplo UAC-01), institución y coordenadas."],
        ["Práctica", "Corrida experimental identificada por practicaId (uid y marca de tiempo)."],
        ["Reservación", "Franja de 30 minutos con estados pending, active, completed o cancelled."],
        ["Slot", "Bloque horario atómico (péndulo + fecha + hora) almacenado en slots_ocupados."],
        ["Turno", "Ventana en la que el estudiante puede pulsar Iniciar práctica."],
        ["Oscilaciones", "Parámetro de 1 a 20 enviado al firmware (número de ciclos a medir)."],
        ["Distancia del muro", "Parámetro de 1 a 20 cm de configuración física del ensayo."],
        ["Lectura / muestra", "Punto de telemetría: muestra, periodo, gravedad, frecuencia, temperatura."],
        ["usuarioActivo", "Identificador de quien tiene el control exclusivo del péndulo en ese instante."],
        ["Comando", "Orden configurar, iniciar o detener registrada en pendulo_comandos."],
        ["Grupo", "Conjunto de estudiantes creado por un docente."],
        ["Asignación / trabajo", "Tarea con cuestionario y fecha límite asociada a un grupo."],
        ["Entrega", "Respuestas del estudiante a una asignación."],
        ["Módulo de evaluación", "Interruptor global que habilita grupos, cuestionarios y Excel de entregas."],
        ["PhysicsAI", "Tutor de física de la plataforma, accesible en Agente IA."],
        ["Bridge", "Proceso técnico en la Raspberry Pi; el usuario no lo opera, pero es quien hace real la práctica."],
      ],
      [2800, 6560]
    ),
    espacioDespuesTabla(),

    titulo1("14. Referencias de la interfaz y cierre"),
    parrafo(
      "Los textos citados en este manual (títulos de tarjetas, badges, FAQ del pie de página y nombres de menú) corresponden a la interfaz en español de la aplicación WPA. La guía rápida institucional resume el ciclo en cuatro acciones: registrarse, agendar 30 minutos, iniciar en Tiempo Real y exportar desde Historial."
    ),
    parrafo(
      "Para arquitectura, tecnologías, colecciones de datos, MQTT, cámara y despliegue, consulte el Manual Técnico de la misma carpeta de documentación. Ambos documentos comparten versión 1.0 y fecha de septiembre de 2026."
    ),
    parrafo("Fin del Manual de Usuario de la plataforma World Pendulum Alliance.", {
      run: { italics: true, bold: true, color: "0F2C59" },
    }),
  ];
}

async function generarManualUsuario() {
  const documento = construirDocumento({
    titulo: "Plataforma de laboratorio remoto — procedimientos, roles y funciones",
    tituloCorto: "Manual de Usuario WPA",
    tipoDocumento: "MANUAL DE USUARIO",
    descripcionCorta:
      "Guía operativa para estudiantes, docentes y administradores de la red World Pendulum Alliance.",
    cuerpo: cuerpoManualUsuario(),
  });
  return guardarDocumento(documento, "Manual_de_Usuario_WPA.docx");
}

module.exports = { generarManualUsuario };
