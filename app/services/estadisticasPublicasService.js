import {
  collectionGroup,
  doc,
  getCountFromServer,
  onSnapshot,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export const REF_ESTADISTICAS_PUBLICAS = doc(db, 'configuracion', 'estadisticas_publicas');

/**
 * Contadores agregados para la landing (lectura pública).
 * experimentosRealizados = total global de muestras (docs en subcolecciones lecturas).
 * estudiantesRegistrados = total de documentos en usuarios (todos los roles).
 * Sin backfill admin, arrancan en 0 hasta recálculo o nuevos eventos.
 */

/**
 * @typedef {{ estudiantesRegistrados: number, experimentosRealizados: number }} EstadisticasPublicas
 * @param {(data: EstadisticasPublicas) => void} callback
 * @param {(error: import('firebase/firestore').FirestoreError) => void} [onError]
 * @returns {import('firebase/firestore').Unsubscribe}
 */
export function escucharEstadisticasPublicas(callback, onError) {
  return onSnapshot(
    REF_ESTADISTICAS_PUBLICAS,
    (snap) => {
      if (!snap.exists()) {
        callback({ estudiantesRegistrados: 0, experimentosRealizados: 0 });
        return;
      }
      const data = snap.data() || {};
      callback({
        estudiantesRegistrados:
          typeof data.estudiantesRegistrados === 'number' ? data.estudiantesRegistrados : 0,
        experimentosRealizados:
          typeof data.experimentosRealizados === 'number' ? data.experimentosRealizados : 0,
      });
    },
    (error) => {
      console.error('Error al escuchar estadísticas públicas:', error, {
        path: 'configuracion/estadisticas_publicas',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '(sin NEXT_PUBLIC_FIREBASE_PROJECT_ID)',
      });
      if (onError) onError(error);
    },
  );
}

async function incrementarCampoPublico(campo) {
  try {
    await updateDoc(REF_ESTADISTICAS_PUBLICAS, {
      [campo]: increment(1),
      actualizadoEn: serverTimestamp(),
    });
  } catch (error) {
    if (error?.code !== 'not-found') {
      throw error;
    }
    await setDoc(
      REF_ESTADISTICAS_PUBLICAS,
      {
        [campo]: 1,
        actualizadoEn: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export async function incrementarEstudianteRegistrado() {
  await incrementarCampoPublico('estudiantesRegistrados');
}

export async function incrementarExperimentoRealizado() {
  await incrementarCampoPublico('experimentosRealizados');
}

/**
 * Recalcula contadores desde datos que solo el admin puede leer en cliente.
 * @param {unknown[]} usuarios
 * @param {unknown} _reservaciones Reservado por compatibilidad con admin; ya no define experimentos.
 */
export async function recalcularEstadisticasPublicasDesdeAdmin(usuarios, _reservaciones) {
  const estudiantesRegistrados = (usuarios || []).length;
  const lecturasQuery = collectionGroup(db, 'lecturas');
  const lecturasSnap = await getCountFromServer(lecturasQuery);
  const experimentosRealizados = lecturasSnap.data().count;

  await setDoc(
    REF_ESTADISTICAS_PUBLICAS,
    {
      estudiantesRegistrados,
      experimentosRealizados,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true },
  );

  return { estudiantesRegistrados, experimentosRealizados };
}
