const config = require('./config');

/**
 * Confirmado con captura REAL de "mosquitto_sub -h localhost -p 1883 -u
 * pendulo_u -P pendulo_u -t pendulo/# -v" el 2026-07-10:
 *
 *   pendulo/texto       "HOLAAA"
 *   pendulo/mediciones  {"muestra":1,"periodo":2.8709545,"gravedad":9.7757502,
 *                        "frecuencia":9.0019779,"temperatura":22.91}
 *
 * Es decir: el tópico real de las muestras es "pendulo/mediciones" (payload
 * JSON, campo singular "muestra"), y el broker no incluye ningún id de
 * péndulo en el tópico (ver extractPenduloId más abajo). "pendulo/texto" es
 * un mensaje de prueba/diagnóstico, no telemetría.
 *
 * Los mensajes de "promedio*" y la señal "END" que se ven en los debug
 * nodes de Node-RED (ver README) AÚN NO se han visto llegar por MQTT en una
 * captura real completa: es posible que solo existan dentro del flujo de
 * Node-RED y nunca se publiquen al broker. El parser los sigue soportando
 * por si aparecen, pero hay que confirmar dejando correr una práctica
 * completa con mosquitto_sub abierto hasta el final.
 *
 * Los nombres de campo ya vienen en el formato que queremos en Firestore,
 * así que no necesitan alias (normalizeKeys los deja pasar tal cual). Esta
 * tabla solo cubre variantes/alias por si algún tópico usa otros nombres.
 */
const FIELD_ALIASES = {
  muestra: 'muestras',
  samples: 'muestras',

  period: 'periodo',
  gravity: 'gravedad',
  frequency: 'frecuencia',
  temp: 'temperatura',
  temperature: 'temperatura',

  estado: 'estado',
  status: 'estado',
  state: 'estado',

  // Alias legacy sin confirmar todavia (por si algun otro subtopico de
  // pendulo/# reporta configuracion en vez de mediciones).
  osc: 'oscilaciones',
  oscilaciones: 'oscilaciones',
  dist: 'distanciaMuro',
  distancia: 'distanciaMuro',
};

/** Campos que identifican una MUESTRA instantánea real (no un promedio ni un END) */
const SAMPLE_FIELDS = ['periodo', 'gravedad', 'frecuencia', 'temperatura'];

function hasSampleData(fields) {
  return SAMPLE_FIELDS.some((key) => typeof fields[key] === 'number');
}

/**
 * Códigos de error del firmware/microcontrolador, confirmados en la
 * capacitación de instalación de la World Pendulum Alliance:
 *   1 = problema de alineación del láser (emisor/receptor)
 *   2 = problema con el microswitch
 * AJUSTAR si el firmware usa otros códigos o mensajes.
 */
const ERROR_MESSAGES = {
  1: 'Error de alineación del láser (emisor/receptor)',
  2: 'Error de microswitch',
};

/**
 * Intenta reconocer un mensaje de error de texto plano, ej. "ERROR 1",
 * "error:2", "err1". Formato exacto sin confirmar todavía con
 * mosquitto_sub; ajustar el regex en cuanto se confirme.
 */
function tryParseErrorCode(trimmed) {
  const match = /^err(?:or)?\s*[:=]?\s*([12])$/i.exec(trimmed);
  if (!match) return null;
  const codigo = Number(match[1]);
  return {
    estado: 'error',
    errorCodigo: codigo,
    errorMensaje: ERROR_MESSAGES[codigo] || `Error ${codigo} desconocido`,
  };
}

/**
 * Señales de control confirmadas en el debug de Node-RED (protocolo serial
 * entre Node-RED y el microcontrolador) el 2026-07-10, antes/después de las
 * muestras: "CFG+5+5" (config recibida), "CFGOK" (config confirmada),
 * "STR" (orden de inicio enviada), "STROK" (inicio confirmado por el
 * péndulo), "DAT" (empieza a llegar el stream de datos), "END" (fin de
 * práctica), y un status final con "STOP/STOPPED" (ej. "IDLE+MPH+STOPPED",
 * texto exacto sin confirmar del todo).
 *
 * A diferencia de las muestras (JSON en "pendulo/mediciones"), estas señales
 * hoy solo se ven en los nodos `debug` de Node-RED: SOLO llegarán por MQTT
 * si se agrega el nodo de reenvío descrito en
 * bridge/node-red-estado-flow.json (topico sugerido: "pendulo/estado").
 * Este parser ya las reconoce para cuando eso se agregue.
 *
 * Se guardan en un campo separado `estadoDispositivo` (no en `estado`, que
 * es el estado de alto nivel de la práctica: en_progreso/finalizado/error)
 * para no pisar esa máquina de estados con texto crudo del firmware.
 */
const CONTROL_SIGNALS = [
  {
    // "CFG+5+5" -> confirma (eco) los parametros de configuracion recibidos
    regex: /^cfg\+(\d+(?:\.\d+)?)\+(\d+(?:\.\d+)?)$/i,
    build: (m) => ({
      estadoDispositivo: 'configurando',
      oscilacionesConfirmadas: Number(m[1]),
      distanciaMuroConfirmada: Number(m[2]),
    }),
  },
  { regex: /^cfgok$/i, build: () => ({ estadoDispositivo: 'configurado' }) },
  { regex: /^str$/i, build: () => ({ estadoDispositivo: 'iniciando' }) },
  {
    // El péndulo confirmó el inicio: es la señal más temprana y confiable
    // de que la práctica está en curso, incluso antes de la 1a muestra.
    regex: /^strok$/i,
    build: () => ({ estadoDispositivo: 'iniciado', estado: 'en_progreso' }),
  },
  { regex: /^dat$/i, build: () => ({ estadoDispositivo: 'recibiendo_datos' }) },
  {
    regex: /^end$/i,
    build: () => ({ estadoDispositivo: 'finalizado', estado: 'finalizado' }),
  },
  // Catch-all para el status final (texto exacto sin confirmar). No toca
  // `estado` porque podria ser un poll periodico ajeno a esta practica.
  { regex: /stop/i, build: () => ({ estadoDispositivo: 'detenido' }) },
];

function tryParseControlSignal(trimmed) {
  for (const { regex, build } of CONTROL_SIGNALS) {
    const match = regex.exec(trimmed);
    if (match) return build(match);
  }
  return null;
}

/**
 * Si el payload (JSON o key:value) ya trae un campo `error` numérico,
 * le agrega el mensaje legible correspondiente.
 */
function enrichErrorField(fields) {
  const codigo = Number(fields.error);
  if (!Number.isNaN(codigo) && ERROR_MESSAGES[codigo]) {
    return {
      ...fields,
      estado: 'error',
      errorCodigo: codigo,
      errorMensaje: ERROR_MESSAGES[codigo],
    };
  }
  return fields;
}

function coerceNumberIfPossible(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value;
  const asNumber = Number(trimmed);
  return Number.isNaN(asNumber) ? value : asNumber;
}

function normalizeKeys(obj) {
  const normalized = {};
  for (const [rawKey, rawValue] of Object.entries(obj)) {
    const key = FIELD_ALIASES[rawKey.toLowerCase()] || rawKey;
    normalized[key] = coerceNumberIfPossible(rawValue);
  }
  return normalized;
}

/**
 * Intenta interpretar el payload como JSON: { "osc": 5, "dist": 12.3 }
 */
function tryParseJson(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return normalizeKeys(parsed);
    }
    // JSON valido pero es un numero/string/bool suelto -> no es un objeto de campos
    return null;
  } catch {
    return null;
  }
}

/**
 * Intenta interpretar pares "clave:valor" o "clave=valor" separados por
 * espacios, comas, tabs o punto y coma. Ej: "ang:12.3 vel:0.4"
 */
function tryParseKeyValuePairs(raw) {
  const pairRegex = /([a-zA-Z_][\w]*)\s*[:=]\s*([-\w.]+)/g;
  const matches = [...raw.matchAll(pairRegex)];
  if (matches.length === 0) return null;

  const obj = {};
  for (const [, key, value] of matches) {
    obj[key] = value;
  }
  return normalizeKeys(obj);
}

/**
 * Ultimo segmento del tópico (ej. "pendulo/texto" -> "texto") se usa como
 * nombre de campo cuando el payload es un valor simple sin estructura, por
 * ejemplo el mensaje de prueba confirmado en "pendulo/texto" ("HOLAAA").
 */
function fallbackFieldFromTopic(topicSegments, raw) {
  const lastSegment = topicSegments[topicSegments.length - 1];
  if (!lastSegment || lastSegment === config.defaultPenduloId) return { raw };

  const key = FIELD_ALIASES[lastSegment.toLowerCase()] || lastSegment;
  return { [key]: coerceNumberIfPossible(raw.trim()) };
}

/**
 * Confirmado con captura real de "mosquitto_sub -t pendulo/#": el tópico es
 * PLANO, "pendulo/<tipo-de-mensaje>" (ej. "pendulo/mediciones",
 * "pendulo/texto"), SIN segmento de id de péndulo. Esta Raspberry/broker
 * atiende un solo péndulo físico, así que siempre usamos el id configurado
 * en DEFAULT_PENDULO_ID (.env). Si en el futuro un mismo broker maneja
 * varios péndulos, este es el lugar para volver a derivar el id del tópico.
 */
function extractPenduloId() {
  return config.defaultPenduloId;
}

/**
 * Punto de entrada: normaliza un mensaje MQTT crudo a un objeto plano con
 * los campos que nos interesan, listo para mergear en Firestore.
 *
 * @param {string} topic - topico MQTT completo, ej. "pendulo/mediciones"
 * @param {Buffer|string} message - payload crudo
 * @returns {{ penduloId: string, fields: Record<string, unknown>, raw: string, topic: string }}
 */
function parsePayload(topic, message) {
  const raw = message.toString('utf8');
  const trimmed = raw.trim();
  const topicSegments = topic.split('/');
  const penduloId = extractPenduloId(topicSegments);

  // Señales de control del handshake serial (CFG.../CFGOK/STR/STROK/DAT/END/
  // STOP). Incluye la señal de fin de práctica "END" (confirmada por
  // captura real). Ninguna de estas es una muestra ni debe graficarse.
  const controlFields = tryParseControlSignal(trimmed);
  if (controlFields) {
    return {
      penduloId,
      fields: controlFields,
      raw,
      topic,
      isEndSignal: controlFields.estado === 'finalizado',
      isSample: false,
      isControlSignal: true,
    };
  }

  // Código de error del firmware (láser=1, microswitch=2). Confirmado que
  // existen en la capacitación de instalación; formato exacto del mensaje
  // sin confirmar todavía con datos reales del broker.
  const errorFields = tryParseErrorCode(trimmed);
  if (errorFields) {
    return {
      penduloId,
      fields: errorFields,
      raw,
      topic,
      isEndSignal: false,
      isSample: false,
      isError: true,
    };
  }

  const parsedRaw =
    tryParseJson(raw) || tryParseKeyValuePairs(raw) || fallbackFieldFromTopic(topicSegments, raw);
  const parsed = enrichErrorField(parsedRaw);

  return {
    penduloId,
    fields: parsed,
    raw,
    topic,
    isEndSignal: false,
    isSample: hasSampleData(parsed),
    isError: parsed.estado === 'error',
  };
}

module.exports = {
  parsePayload,
  FIELD_ALIASES,
  hasSampleData,
  ERROR_MESSAGES,
  tryParseControlSignal,
};
