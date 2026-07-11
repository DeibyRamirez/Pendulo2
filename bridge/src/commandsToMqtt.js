const config = require('./config');
const logger = require('./logger');
const { getDb, admin } = require('./firebaseAdmin');

/**
 * Escucha la coleccion `pendulo_comandos` (donde la web crea documentos con
 * estado "pendiente") y publica cada comando en el topico MQTT
 * correspondiente para que Node-RED lo reciba y lo traduzca a las
 * instrucciones seriales (cfg / str) hacia el controlador del pendulo.
 *
 * IMPORTANTE: esto solo funciona si en Node-RED se agrega un nodo
 * "mqtt in" suscrito al topico fijo `config.mqtt.commandTopic`
 * (por defecto "pendulo/comando") que alimente el function node que hoy
 * dispara `cfg\t..\t..\r` y `str\r`.
 * Ver bridge/node-red-command-flow.json y bridge/README.md.
 *
 * @param {import('mqtt').MqttClient} mqttClient
 */
function startCommandsListener(mqttClient) {
  const db = getDb();

  const query = db.collection('pendulo_comandos').where('estado', '==', 'pendiente');

  const unsubscribe = query.onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        processComando(mqttClient, change.doc);
      });
    },
    (err) => {
      logger.error('Error escuchando pendulo_comandos:', err.message);
    }
  );

  logger.info('Escuchando comandos pendientes en Firestore (pendulo_comandos)...');
  return unsubscribe;
}

async function processComando(mqttClient, docSnap) {
  const comando = docSnap.data();
  const penduloId = comando.penduloId || config.defaultPenduloId;
  const topic = config.mqtt.commandTopic;

  const payload = JSON.stringify({
    accion: comando.accion,
    oscilaciones: comando.oscilaciones,
    distanciaMuro: comando.distanciaMuro,
    comandoId: docSnap.id,
  });

  logger.info(`Comando ${docSnap.id} -> ${topic}:`, payload);

  try {
    await new Promise((resolve, reject) => {
      mqttClient.publish(topic, payload, { qos: 1 }, (err) => (err ? reject(err) : resolve()));
    });

    await docSnap.ref.update({
      estado: 'enviado',
      atendidoEn: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    logger.error(`Error publicando comando ${docSnap.id}:`, err.message);
    await docSnap.ref
      .update({
        estado: 'error',
        errorMsg: err.message,
        atendidoEn: admin.firestore.Timestamp.now(),
      })
      .catch(() => {});
  }
}

module.exports = { startCommandsListener };
