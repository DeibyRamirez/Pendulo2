import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/services/firebase';
import type { EstadisticasPublicasLanding } from '@/lib/estadisticasLandingServer';

/**
 * Lectura del doc agregado con reglas públicas (sin Admin SDK).
 */
export async function leerEstadisticasPublicasFirestoreCliente(): Promise<EstadisticasPublicasLanding | null> {
  const snap = await getDoc(doc(db, 'configuracion', 'estadisticas_publicas'));
  if (!snap.exists()) return null;

  const data = snap.data() || {};
  return {
    estudiantesRegistrados:
      typeof data.estudiantesRegistrados === 'number' ? data.estudiantesRegistrados : 0,
    experimentosRealizados:
      typeof data.experimentosRealizados === 'number' ? data.experimentosRealizados : 0,
  };
}
