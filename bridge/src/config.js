require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}. Revisa bridge/.env (copia .env.example).`);
  }
  return value;
}

const config = {
  mqtt: {
    host: required('MQTT_HOST', 'localhost'),
    port: Number(process.env.MQTT_PORT || 1883),
    username: required('MQTT_USERNAME'),
    password: required('MQTT_PASSWORD'),
    subscribeTopic: process.env.MQTT_SUB_TOPIC || 'pendulo/#',
    // Topico fijo (sin id de pendulo): confirmado que este broker atiende
    // un solo pendulo fisico y publica en topicos planos ("pendulo/mediciones").
    commandTopic: process.env.MQTT_CMD_TOPIC || 'pendulo/comando',
  },
  firebase: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: process.env.FIREBASE_PROJECT_ID,
  },
  defaultPenduloId: process.env.DEFAULT_PENDULO_ID || 'UAC-01',
  lecturasThrottleMs: Number(process.env.LECTURAS_THROTTLE_MS || 300),
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
