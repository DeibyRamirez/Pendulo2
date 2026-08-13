/**
 * Migra lecturas de la ruta legacy:
 *   pendulo_data/{penduloId}/lecturas
 * a la nueva ruta:
 *   pendulo_data/{penduloId}/practicas/legacy/lecturas
 *
 * Uso (desde bridge/ con credenciales Admin SDK):
 *   node ../scripts/migrate-lecturas.js UAC-01
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../bridge/.env') });

const { initFirebaseAdmin, getDb } = require('../bridge/src/firebaseAdmin');

const LEGACY_UID = 'legacy';
const BATCH_SIZE = 400;

async function migrate(penduloId) {
  initFirebaseAdmin();
  const db = getDb();

  const legacyRef = db.collection('pendulo_data').doc(penduloId).collection('lecturas');
  const targetBase = db
    .collection('pendulo_data')
    .doc(penduloId)
    .collection('practicas')
    .doc(LEGACY_UID)
    .collection('lecturas');

  const snapshot = await legacyRef.get();
  if (snapshot.empty) {
    console.log(`No hay lecturas legacy en pendulo_data/${penduloId}/lecturas`);
    return;
  }

  console.log(`Migrando ${snapshot.size} lecturas de ${penduloId}...`);

  let batch = db.batch();
  let ops = 0;
  let migrated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const targetRef = targetBase.doc(docSnap.id);
    batch.set(targetRef, {
      ...data,
      penduloId,
      practicaId: data.practicaId || 'legacy',
      migradoDesde: 'pendulo_data/lecturas',
    });
    ops += 1;
    migrated += 1;

    if (ops >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`  ${migrated} lecturas migradas...`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Migración completada: ${migrated} lecturas → practicas/${LEGACY_UID}/lecturas`);
  console.log('Revisa los datos en Firebase Console antes de eliminar la subcolección legacy.');
}

const penduloId = process.argv[2] || process.env.DEFAULT_PENDULO_ID || 'UAC-01';

migrate(penduloId).catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});
