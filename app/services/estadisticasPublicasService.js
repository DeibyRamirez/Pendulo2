import {
  doc,
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
 * Sin backfill admin, arrancan en 0 hasta nuevos registros o prácticas.
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
 */
export async function recalcularEstadisticasPublicasDesdeAdmin(usuarios, reservaciones) {
  const estudiantesRegistrados = (usuarios || []).filter((u) => u.rol === 'Estudiante').length;
  const experimentosRealizados = (reservaciones || []).reduce(
    (acc, r) => acc + (r.practicas_realizadas ?? 0),
    0,
  );

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
