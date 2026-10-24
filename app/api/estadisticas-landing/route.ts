import { NextResponse } from 'next/server';
import {
  adminFirestoreDisponible,
  isAdminCredentialError,
  isFirestorePermissionDenied,
} from '@/lib/firebaseAdmin';
import type { EstadisticasPublicasLanding } from '@/lib/estadisticasLandingServer';
import {
  obtenerConteosLanding,
  sincronizarEstadisticasPublicasAdmin,
} from '@/lib/estadisticasLandingServer';
import { leerEstadisticasPublicasFirestoreCliente } from '@/lib/estadisticasLandingPublic';

export const runtime = 'nodejs';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

const MENSAJE_IAM =
  'La cuenta de servicio no tiene permiso de Firestore. En Google Cloud IAM, asigna a esa cuenta ' +
  'los roles «Cloud Datastore User» (o «Firebase Admin») en el proyecto, o genera una nueva clave en ' +
  'Firebase Console → Configuración del proyecto → Cuentas de servicio → SDK de administración de Firebase. ' +
  'Mientras tanto, entra como Admin y usa «Recalcular estadísticas públicas».';

const MENSAJE_CREDENCIAL =
  'Credencial de Firebase Admin mal configurada. En local (Windows), guarda el JSON descargado en ' +
  'secrets/firebase-adminsdk.json y define GOOGLE_APPLICATION_CREDENTIALS con la ruta absoluta. ' +
  'Comenta GOOGLE_SERVICE_ACCOUNT_JSON si está roto. También puedes usar Admin → «Recalcular estadísticas públicas».';

function tieneConteos(conteos: EstadisticasPublicasLanding): boolean {
  return conteos.estudiantesRegistrados > 0 || conteos.experimentosRealizados > 0;
}

async function responderDesdeDocPublico() {
  const desdeDoc = await leerEstadisticasPublicasFirestoreCliente();
  if (!desdeDoc || !tieneConteos(desdeDoc)) return null;
  return NextResponse.json(desdeDoc, {
    headers: {
      ...CACHE_HEADERS,
      'X-Estadisticas-Origen': 'configuracion-estadisticas_publicas',
    },
  });
}

export async function GET() {
  if (!adminFirestoreDisponible()) {
    const fallback = await responderDesdeDocPublico();
    if (fallback) return fallback;

    console.error(
      'estadisticas-landing: falta GOOGLE_APPLICATION_CREDENTIALS o GOOGLE_SERVICE_ACCOUNT_JSON',
    );
    return NextResponse.json(
      { error: 'Conteos no disponibles: credencial de Firebase Admin no configurada.' },
      { status: 503 },
    );
  }

  try {
    const conteos = await obtenerConteosLanding();
    await sincronizarEstadisticasPublicasAdmin(conteos);

    return NextResponse.json(conteos, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error('estadisticas-landing:', err);

    const credentialError = isAdminCredentialError(err) || isAdminCredentialError((err as Error)?.cause);

    if (credentialError || isFirestorePermissionDenied(err) || isFirestorePermissionDenied((err as Error)?.cause)) {
      try {
        const fallback = await responderDesdeDocPublico();
        if (fallback) return fallback;
      } catch (fallbackErr) {
        console.error('estadisticas-landing fallback doc público:', fallbackErr);
      }

      return NextResponse.json(
        { error: credentialError ? MENSAJE_CREDENCIAL : MENSAJE_IAM },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'No se pudieron calcular las estadísticas de la landing.' },
      { status: 500 },
    );
  }
}
