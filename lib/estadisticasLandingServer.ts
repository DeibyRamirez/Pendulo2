import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export type EstadisticasPublicasLanding = {
  estudiantesRegistrados: number;
  experimentosRealizados: number;
};

/**
 * Misma lógica que el panel admin: total documentos en usuarios y lecturas globales.
 * Requiere IAM de Firestore en la cuenta de servicio (p. ej. Cloud Datastore User).
 */
export async function obtenerConteosLanding(): Promise<EstadisticasPublicasLanding> {
  const db = getAdminFirestore();

  let usuariosCount = 0;
  let lecturasCount = 0;

  try {
    const usuariosSnap = await db.collection('usuarios').count().get();
    usuariosCount = usuariosSnap.data().count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`conteo usuarios: ${msg}`, { cause: err });
  }

  try {
    const lecturasSnap = await db.collectionGroup('lecturas').count().get();
    lecturasCount = lecturasSnap.data().count;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`conteo lecturas (collectionGroup): ${msg}`, { cause: err });
  }

  return {
    estudiantesRegistrados: usuariosCount,
    experimentosRealizados: lecturasCount,
  };
}

export async function sincronizarEstadisticasPublicasAdmin(
  conteos: EstadisticasPublicasLanding,
): Promise<void> {
  const db = getAdminFirestore();
  await db.doc('configuracion/estadisticas_publicas').set(
    {
      estudiantesRegistrados: conteos.estudiantesRegistrados,
      experimentosRealizados: conteos.experimentosRealizados,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
