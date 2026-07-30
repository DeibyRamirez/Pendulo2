const config = require('./config');
const logger = require('./logger');
const { getDb, admin } = require('./firebaseAdmin');

/** Evita procesar el mismo documento dos veces en paralelo. */
const processing = new Set();

/** Comandos con más de esta antigüedad se marcan expirados (no se publican). */
const COMANDO_EXPIRACION_MS = 5 * 60 * 1000;

/** Reintenta comandos que siguen "pendiente" tras este tiempo (listener colgado). */
const COMANDO_REPROCESO_MS = 15 * 1000;

/** Intervalo del barrido de comandos atascados. */
const BARRIDO_INTERVAL_MS = 30 * 1000;

/**
 * Escucha la coleccion `pendulo_comandos` (donde la web crea documentos con
 * estado "pendiente") y publica cada comando en el topico MQTT
 * correspondiente para que Node-RED lo reciba y lo traduzca a las
 * instrucciones seriales (cfg / str) hacia el controlador del pendulo.
 *
 * @param {import('mqtt').MqttClient} mqttClient
 */
function startCommandsListener(mqttClient) {
  const db = getDb();

  const query = db.collection('pendulo_comandos').where('estado', '==', 'pendiente');

  const unsubscribe = query.onSnapshot(
    (snapshot) => {
      if (snapshot.metadata.fromCache) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        void processComando(mqttClient, change.doc);
      });
    },
    (err) => {
      logger.error('Error escuchando pendulo_comandos:', err.message);
    }
  );

  const sweepInterval = setInterval(() => {
    void sweepPendingComandos(mqttClient);
  }, BARRIDO_INTERVAL_MS);

  logger.info('Escuchando comandos pendientes en Firestore (pendulo_comandos)...');
  logger.info(
    `Barrido de comandos atascados cada ${BARRIDO_INTERVAL_MS / 1000}s (reproceso >${COMANDO_REPROCESO_MS / 1000}s, expira >${COMANDO_EXPIRACION_MS / 60000}min).`
  );

  return () => {
    clearInterval(sweepInterval);
    unsubscribe();
  };
}

function comandoAgeMs(data) {
  const created = data.fechaCreacion?.toMillis?.();
  return created ? Date.now() - created : 0;
}

async function expireComando(docSnap) {
  const ageSec = Math.round(comandoAgeMs(docSnap.data()) / 1000);
  logger.warn(`Comando ${docSnap.id} expirado (${ageSec}s en pendiente), marcando como error.`);
  await docSnap.ref
    .update({
      estado: 'error',
      errorMsg: `Comando expirado: estuvo pendiente ${ageSec}s sin ser atendido por el bridge.`,
      atendidoEn: admin.firestore.Timestamp.now(),
    })
    .catch((err) => logger.error(`No se pudo marcar expirado ${docSnap.id}:`, err.message));
}

async function sweepPendingComandos(mqttClient) {
  const db = getDb();
  try {
    const snapshot = await db.collection('pendulo_comandos').where('estado', '==', 'pendiente').get();
    if (snapshot.empty) return;

    for (const docSnap of snapshot.docs) {
      const age = comandoAgeMs(docSnap.data());
      if (age > COMANDO_EXPIRACION_MS) {
        await expireComando(docSnap);
      } else if (age > COMANDO_REPROCESO_MS) {
        logger.warn(`Reprocesando comando pendiente atascado: ${docSnap.id} (${Math.round(age / 1000)}s).`);
        await processComando(mqttClient, docSnap);
      }
    }
  } catch (err) {
    logger.error('Error en barrido de comandos pendientes:', err.message);
  }
}

async function processComando(mqttClient, docSnap) {
  const comandoId = docSnap.id;
  if (processing.has(comandoId)) return;
  processing.add(comandoId);

  try {
    const fresh = await docSnap.ref.get();
    if (!fresh.exists) return;

    const comando = fresh.data();
    if (comando.estado !== 'pendiente') return;

    const age = comandoAgeMs(comando);
    if (age > COMANDO_EXPIRACION_MS) {
      await expireComando(fresh);
      return;
    }

    const penduloId = comando.penduloId || config.defaultPenduloId;
    const topic = config.mqtt.commandTopic;

    const payload = JSON.stringify({
      accion: comando.accion,
      oscilaciones: comando.oscilaciones,
      distanciaMuro: comando.distanciaMuro,
      comandoId,
    });

    logger.info(`Comando ${comandoId} -> ${topic}:`, payload);

    if (!mqttClient.connected) {
      throw new Error('Cliente MQTT desconectado; esperando reconexion.');
    }

    await new Promise((resolve, reject) => {
      mqttClient.publish(topic, payload, { qos: 1 }, (err) => (err ? reject(err) : resolve()));
    });

    await fresh.ref.update({
      estado: 'enviado',
      atendidoEn: admin.firestore.Timestamp.now(),
    });
    logger.info(`Comando ${comandoId} marcado como enviado en Firestore.`);
  } catch (err) {
    logger.error(`Error procesando comando ${comandoId}:`, err.message);
    await docSnap.ref
      .get()
      .then((snap) => {
        if (!snap.exists || snap.data().estado !== 'pendiente') return;
        return snap.ref.update({
          estado: 'error',
          errorMsg: err.message,
          atendidoEn: admin.firestore.Timestamp.now(),
        });
      })
      .catch(() => {});
  } finally {
    processing.delete(comandoId);
  }
}

module.exports = { startCommandsListener };
