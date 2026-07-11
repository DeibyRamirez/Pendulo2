const admin = require('firebase-admin');
const config = require('./config');
const logger = require('./logger');

let app;

function initFirebaseAdmin() {
  if (app) return app;

  if (!config.firebase.credentialsPath) {
    throw new Error(
      'GOOGLE_APPLICATION_CREDENTIALS no esta configurado. ' +
        'Apunta a la ruta del JSON de la cuenta de servicio de Firebase (no lo subas a git).'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(require(config.firebase.credentialsPath)),
    projectId: config.firebase.projectId,
  });

  logger.info('Firebase Admin inicializado', { projectId: config.firebase.projectId });
  return app;
}

function getDb() {
  if (!app) initFirebaseAdmin();
  return admin.firestore();
}

module.exports = { initFirebaseAdmin, getDb, admin };
