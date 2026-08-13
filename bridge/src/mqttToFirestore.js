const mqtt = require('mqtt');
const config = require('./config');
const logger = require('./logger');
const { parsePayload } = require('./parsePayload');
const { getDb, admin } = require('./firebaseAdmin');

// Ultima vez (ms epoch) que se escribio un punto historico por pendulo,
// para no saturar Firestore con cada mensaje MQTT (pueden llegar varios por
// segundo). El documento "en vivo" SIEMPRE se actualiza; el historico se
// throttlea.
const lastLecturaWriteAt = new Map();

function shouldWriteLectura(penduloId) {
  const now = Date.now();
  const last = lastLecturaWriteAt.get(penduloId) || 0;
  if (now - last < config.lecturasThrottleMs) return false;
  lastLecturaWriteAt.set(penduloId, now);
  return true;
}

async function handleMessage(topic, message) {
  const { penduloId, fields, raw, isEndSignal, isSample } = parsePayload(topic, message);
  const db = getDb();
  const now = admin.firestore.Timestamp.now();

  const liveDocRef = db.collection('pendulo_data').doc(penduloId);
  const livePayload = {
    ...fields,
    penduloId,
    ultimoTopico: topic,
    ultimoRaw: raw,
    actualizadoEn: now,
  };
  // Una nueva muestra implica que la práctica está en curso; si llega otra
  // muestra después de "END" (nueva práctica), volvemos a marcarla en curso.
  if (isSample) {
    livePayload.estado = 'en_progreso';
  }

  try {
    await liveDocRef.set(livePayload, { merge: true });
  } catch (err) {
    logger.error(`Error escribiendo doc en vivo de ${penduloId}:`, err.message);
  }

  // Solo las muestras instantáneas (periodo/gravedad/frecuencia/temperatura)
  // se guardan en el histórico para graficar. Los mensajes de "promedio" ya
  // quedan reflejados en el documento en vivo (promedioPeriodo, etc.) y el
  // "END" es solo una señal de estado, no un dato de medición.
  if (!isEndSignal && isSample && shouldWriteLectura(penduloId)) {
    try {
      const liveSnap = await liveDocRef.get();
      const liveData = liveSnap.exists ? liveSnap.data() : {};
      const usuarioActivo = liveData.usuarioActivo;
      const practicaId = liveData.practicaId;

      if (!usuarioActivo) {
        logger.warn(
          `Omitiendo lectura historica de ${penduloId}: sin usuarioActivo (practica no iniciada desde la web).`,
        );
        return;
      }

      const lecturaPayload = {
        ...fields,
        penduloId,
        practicaId: practicaId || null,
        topico: topic,
        raw,
        timestamp: now,
      };

      await liveDocRef
        .collection('practicas')
        .doc(usuarioActivo)
        .collection('lecturas')
        .add(lecturaPayload);
    } catch (err) {
      logger.error(`Error escribiendo lectura historica de ${penduloId}:`, err.message);
    }
  }
}

function startMqttToFirestoreBridge() {
  const url = `mqtt://${config.mqtt.host}:${config.mqtt.port}`;
  logger.info(`Conectando a broker MQTT ${url} ...`);

  const client = mqtt.connect(url, {
    username: config.mqtt.username,
    password: config.mqtt.password,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    clientId: `pendulo-bridge-${Math.random().toString(16).slice(2, 10)}`,
  });

  client.on('connect', () => {
    logger.info('Conectado al broker MQTT.');
    client.subscribe(config.mqtt.subscribeTopic, (err, granted) => {
      if (err) {
        logger.error(`No se pudo suscribir a ${config.mqtt.subscribeTopic}:`, err.message);
        return;
      }
      const denegado = (granted || []).filter((g) => g.qos >= 128);
      if (denegado.length > 0) {
        logger.error(
          `El broker RECHAZO (ACL?) la suscripcion a ${config.mqtt.subscribeTopic}:`,
          JSON.stringify(granted),
        );
      } else {
        logger.info(`Suscrito a ${config.mqtt.subscribeTopic}`, JSON.stringify(granted));
      }
    });
  });

  client.on('message', (topic, message) => {
    logger.info(`MQTT <- ${topic}: ${message.toString()}`);
    handleMessage(topic, message).catch((err) => {
      logger.error('Error procesando mensaje MQTT:', err);
    });
  });

  client.on('reconnect', () => logger.warn('Reconectando al broker MQTT...'));
  client.on('close', () => logger.warn('Conexion MQTT cerrada.'));
  client.on('error', (err) => logger.error('Error de conexion MQTT:', err.message));

  return client;
}

module.exports = { startMqttToFirestoreBridge };
