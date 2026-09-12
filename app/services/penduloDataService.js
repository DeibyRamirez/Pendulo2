import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Escuchar el estado "en vivo" de un péndulo (doc pendulo_data/{penduloId}).
 */
export function escucharPenduloEnVivo(penduloId, callback, onError) {
  return onSnapshot(
    doc(db, 'pendulo_data', penduloId),
    (docSnap) => {
      callback(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
    },
    (error) => {
      console.error('Error al escuchar estado en vivo del péndulo:', error);
      if (onError) onError(error);
    },
  );
}

/**
 * Escuchar lecturas de la práctica activa del usuario.
 * Solo trae datos desde practicaInicio en adelante.
 */
export function escucharLecturasPractica(
  penduloId,
  uid,
  practicaInicio,
  cantidad,
  callback,
  onError,
) {
  if (!penduloId || !uid || !practicaInicio) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, 'pendulo_data', penduloId, 'practicas', uid, 'lecturas'),
    where('timestamp', '>=', practicaInicio),
    orderBy('timestamp', 'desc'),
    limit(cantidad),
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const lecturas = [];
      querySnapshot.forEach((docSnap) => {
        lecturas.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(lecturas.reverse());
    },
    (error) => {
      console.error('Error al escuchar lecturas de práctica:', error);
      if (onError) onError(error);
    },
  );
}

/**
 * Cargar lecturas anteriores a un timestamp (paginación one-shot).
 */
export async function cargarLecturasAnteriores(
  penduloId,
  uid,
  practicaInicio,
  cantidad,
  beforeTimestamp,
) {
  if (!penduloId || !uid || !practicaInicio || !beforeTimestamp) {
    return [];
  }

  const q = query(
    collection(db, 'pendulo_data', penduloId, 'practicas', uid, 'lecturas'),
    where('timestamp', '>=', practicaInicio),
    where('timestamp', '<', beforeTimestamp),
    orderBy('timestamp', 'desc'),
    limit(cantidad),
  );

  const snapshot = await getDocs(q);
  const lecturas = [];
  snapshot.forEach((docSnap) => {
    lecturas.push({ id: docSnap.id, ...docSnap.data() });
  });

  return lecturas.reverse();
}

/**
 * Obtener todas las lecturas de una práctica (para exportación).
 */
export async function obtenerLecturasPractica(penduloId, uid, practicaId) {
  let q = query(
    collection(db, 'pendulo_data', penduloId, 'practicas', uid, 'lecturas'),
    orderBy('timestamp', 'asc'),
  );

  if (practicaId) {
    q = query(
      collection(db, 'pendulo_data', penduloId, 'practicas', uid, 'lecturas'),
      where('practicaId', '==', practicaId),
      orderBy('timestamp', 'asc'),
    );
  }

  const snapshot = await getDocs(q);
  const lecturas = [];
  snapshot.forEach((docSnap) => {
    lecturas.push({ id: docSnap.id, ...docSnap.data() });
  });
  return lecturas;
}

/**
 * Obtener lecturas de un usuario dentro de la franja horaria de una reserva.
 */
export async function obtenerLecturasPorSesion(penduloId, uid, inicio, fin) {
  const q = query(
    collection(db, 'pendulo_data', penduloId, 'practicas', uid, 'lecturas'),
    where('timestamp', '>=', inicio),
    where('timestamp', '<=', fin),
    orderBy('timestamp', 'asc'),
  );

  const snapshot = await getDocs(q);
  const lecturas = [];
  snapshot.forEach((docSnap) => {
    lecturas.push({ id: docSnap.id, ...docSnap.data() });
  });
  return lecturas;
}

/**
 * Listar prácticas de un usuario (agrupa lecturas por practicaId).
 */
export async function listarPracticasUsuario(penduloId, uid) {
  const lecturas = await obtenerLecturasPractica(penduloId, uid);
  const porPractica = new Map();

  lecturas.forEach((lectura) => {
    const practicaId = lectura.practicaId || 'sin_practica';
    if (!porPractica.has(practicaId)) {
      porPractica.set(practicaId, []);
    }
    porPractica.get(practicaId).push(lectura);
  });

  return [...porPractica.entries()]
    .map(([practicaId, filas]) => {
      const ordenadas = [...filas].sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() ?? 0;
        const tb = b.timestamp?.toMillis?.() ?? 0;
        return ta - tb;
      });
      return {
        practicaId,
        penduloId,
        lecturas: ordenadas,
        inicio: ordenadas[0]?.timestamp ?? null,
        fin: ordenadas[ordenadas.length - 1]?.timestamp ?? null,
        muestras: ordenadas.length,
      };
    })
    .sort((a, b) => {
      const ta = a.inicio?.toMillis?.() ?? 0;
      const tb = b.inicio?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

/**
 * Lista las prácticas de un usuario en uno o varios péndulos.
 */
export async function listarPracticasDeUsuario(uid, penduloIds) {
  const ids = [...new Set((penduloIds || []).filter(Boolean))];
  const todas = [];

  for (const penduloId of ids) {
    const practicas = await listarPracticasUsuario(penduloId, uid);
    todas.push(...practicas);
  }

  return todas.sort((a, b) => {
    const ta = a.inicio?.toMillis?.() ?? 0;
    const tb = b.inicio?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

export async function listarUsuariosConPracticas(penduloId) {
  const snapshot = await getDocs(collection(db, 'pendulo_data', penduloId, 'practicas'));
  return snapshot.docs.map((d) => d.id);
}

/**
 * @deprecated Usar escucharLecturasPractica. Mantenido por compatibilidad.
 */
export function escucharLecturasRecientes(penduloId, cantidad, callback, onError) {
  return escucharLecturasPractica(
    penduloId,
    null,
    Timestamp.fromMillis(0),
    cantidad,
    callback,
    onError,
  );
}

/**
 * Últimos comandos (Admin). Ordenados por fecha; el índice de
 * fechaCreacion es automático.
 */
export function escucharComandosRecientes(cantidad, callback, onError) {
  const q = query(
    collection(db, 'pendulo_comandos'),
    orderBy('fechaCreacion', 'desc'),
    limit(cantidad),
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const comandos = [];
      querySnapshot.forEach((docSnap) => {
        comandos.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(comandos);
    },
    (error) => {
      console.error('Error al escuchar comandos recientes:', error);
      if (onError) onError(error);
    },
  );
}

export function escucharEstadoComando(comandoId, callback, onError) {
  return onSnapshot(
    doc(db, 'pendulo_comandos', comandoId),
    (docSnap) => {
      callback(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
    },
    (error) => {
      console.error('Error al escuchar estado del comando:', error);
      if (onError) onError(error);
    },
  );
}

export async function enviarComandoPendulo(comando) {
  try {
    const { penduloId, usuarioId, accion, oscilaciones, distanciaMuro, reservacionId, practicaId } =
      comando;

    if (!penduloId) throw new Error('penduloId es requerido');
    if (!usuarioId) throw new Error('usuarioId es requerido');

    const validAcciones = ['configurar', 'iniciar', 'detener'];
    if (!validAcciones.includes(accion)) {
      throw new Error(`Acción inválida. Debe ser una de: ${validAcciones.join(', ')}`);
    }

    const docRef = await addDoc(collection(db, 'pendulo_comandos'), {
      penduloId,
      usuarioId,
      accion,
      oscilaciones: oscilaciones ?? null,
      distanciaMuro: distanciaMuro ?? null,
      reservacionId: reservacionId ?? null,
      practicaId: practicaId ?? null,
      estado: 'pendiente',
      fechaCreacion: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error al enviar comando al péndulo:', error);
    throw error;
  }
}
