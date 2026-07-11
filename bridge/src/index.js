const config = require('./config');
const logger = require('./logger');
const { initFirebaseAdmin } = require('./firebaseAdmin');
const { startMqttToFirestoreBridge } = require('./mqttToFirestore');
const { startCommandsListener } = require('./commandsToMqtt');

function main() {
  logger.info('Iniciando pendulo-bridge...', {
    pendulo: config.defaultPenduloId,
    mqttHost: `${config.mqtt.host}:${config.mqtt.port}`,
  });

  initFirebaseAdmin();

  const mqttClient = startMqttToFirestoreBridge();
  const unsubscribeComandos = startCommandsListener(mqttClient);

  const shutdown = () => {
    logger.info('Cerrando pendulo-bridge...');
    unsubscribeComandos();
    mqttClient.end(false, {}, () => process.exit(0));
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (err) => logger.error('unhandledRejection:', err));
  process.on('uncaughtException', (err) => logger.error('uncaughtException:', err));
}

main();
