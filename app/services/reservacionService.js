import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * ID determinístico del slot: pendulo + fecha/hora de inicio (30 min fijos).
 */
export function buildSlotId(penduloId, inicioDate) {
  const d = new Date(inicioDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${penduloId}_${y}-${m}-${day}_${h}:${min}`;
}

/**
 * Crear una nueva reservación con lock atómico de slot.
 */
export async function crearReservacion(reservationData) {
  const { usuario_id, inicio_sesion_reserva, final_sesion_reserva, estado, institucion, pendulo_id } =
    reservationData;

  const inicioTimestamp = Timestamp.fromDate(new Date(inicio_sesion_reserva));
  const finalTimestamp = Timestamp.fromDate(new Date(final_sesion_reserva));

  const duracionMinutos = (finalTimestamp.toDate() - inicioTimestamp.toDate()) / (1000 * 60);
  if (duracionMinutos > 30) {
    throw new Error('Las sesiones no pueden exceder 30 minutos');
  }

  const slotId = buildSlotId(pendulo_id, inicioTimestamp.toDate());
  const slotRef = doc(db, 'slots_ocupados', slotId);
  const reservacionRef = doc(collection(db, 'reservaciones'));

  await runTransaction(db, async (transaction) => {
    const slotSnap = await transaction.get(slotRef);
    if (slotSnap.exists()) {
      const slotData = slotSnap.data();
      if (slotData.estado === 'pending' || slotData.estado === 'active') {
        throw new Error(
          'Este horario ya está ocupado. Por favor selecciona otro slot disponible.',
        );
      }
    }

    transaction.set(slotRef, {
      pendulo_id,
      inicio: inicioTimestamp,
      fin: finalTimestamp,
      estado: 'pending',
      reservacion_id: reservacionRef.id,
    });

    transaction.set(reservacionRef, {
      usuario_id,
      inicio_sesion_reserva: inicioTimestamp,
      final_sesion_reserva: finalTimestamp,
      estado: estado || 'pending',
      institucion,
      pendulo_id,
      slot_id: slotId,
      fecha_creacion: Timestamp.now(),
    });
  });

  return reservacionRef.id;
}

export async function obtenerReservacionesPorUsuario(usuario_id) {
  try {
    const q = query(collection(db, 'reservaciones'), where('usuario_id', '==', usuario_id));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];
    querySnapshot.forEach((docSnap) => {
      reservaciones.push({ id: docSnap.id, ...docSnap.data() });
    });
    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones del usuario:', error);
    throw error;
  }
}

export async function obtenerReservacionesPorPendulo(pendulo_id) {
  try {
    const q = query(collection(db, 'reservaciones'), where('pendulo_id', '==', pendulo_id));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];
    querySnapshot.forEach((docSnap) => {
      reservaciones.push({ id: docSnap.id, ...docSnap.data() });
    });
    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones del péndulo:', error);
    throw error;
  }
}

export async function obtenerReservacionesPorInstitucion(institucion) {
  try {
    const q = query(collection(db, 'reservaciones'), where('institucion', '==', institucion));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];
    querySnapshot.forEach((docSnap) => {
      reservaciones.push({ id: docSnap.id, ...docSnap.data() });
    });
    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones de la institución:', error);
    throw error;
  }
}

export async function actualizarEstadoReservacion(reservacion_id, nuevoEstado) {
  try {
    const validStates = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStates.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${validStates.join(', ')}`);
    }

    await updateDoc(doc(db, 'reservaciones', reservacion_id), {
      estado: nuevoEstado,
      fecha_actualizacion: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error al actualizar estado de reservación:', error);
    throw error;
  }
}

export async function cancelarReservacion(reservacion_id) {
  try {
    const reservacionRef = doc(db, 'reservaciones', reservacion_id);
    const reservacionSnap = await getDoc(reservacionRef);
    if (!reservacionSnap.exists()) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = reservacionSnap.data();
    await updateDoc(reservacionRef, {
      estado: 'cancelled',
      fecha_actualizacion: Timestamp.now(),
    });

    if (reservacion.slot_id) {
      const slotRef = doc(db, 'slots_ocupados', reservacion.slot_id);
      const slotSnap = await getDoc(slotRef);
      if (slotSnap.exists()) {
        await updateDoc(slotRef, { estado: 'cancelled' });
      }
    }
  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    throw error;
  }
}

export async function eliminarReservacion(reservacion_id) {
  try {
    const docRef = doc(db, 'reservaciones', reservacion_id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = docSnap.data();
    if (reservacion.estado !== 'pending') {
      throw new Error('Solo se pueden eliminar reservaciones en estado pending');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error al eliminar reservación:', error);
    throw error;
  }
}

export async function validarConflictosHorario(pendulo_id, inicio, final) {
  try {
    const q = query(
      collection(db, 'reservaciones'),
      where('pendulo_id', '==', pendulo_id),
      where('estado', 'in', ['pending', 'active']),
    );

    const querySnapshot = await getDocs(q);

    for (const docSnap of querySnapshot.docs) {
      const reservacion = docSnap.data();
      const existingStart = reservacion.inicio_sesion_reserva.toDate();
      const existingEnd = reservacion.final_sesion_reserva.toDate();
      const newStart = inicio.toDate();
      const newEnd = final.toDate();

      if (newStart < existingEnd && newEnd > existingStart) {
        throw new Error(
          `Hay un conflicto de horario. El péndulo está reservado desde ${existingStart.toLocaleString()} hasta ${existingEnd.toLocaleString()}`,
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error al validar conflictos de horario:', error);
    throw error;
  }
}

export const DURACION_RESERVA_MS = 30 * 60 * 1000;

/**
 * El control del péndulo lo define la reserva vigente, no los grupos de trabajo.
 * No lee reservaciones ajenas: usa practicaInicio del documento público.
 */
export function hayControlAjenoVigente(penduloData, usuarioId, ahoraMs = Date.now()) {
  if (!penduloData?.usuarioActivo || penduloData.usuarioActivo === usuarioId) {
    return false;
  }
  const inicioPractica = penduloData.practicaInicio?.toMillis?.() ?? 0;
  if (!inicioPractica) return false;
  return ahoraMs - inicioPractica < DURACION_RESERVA_MS;
}

function lockDeOtroUsuarioVigente(_transaction, penduloData, usuarioId, ahora) {
  return hayControlAjenoVigente(penduloData, usuarioId, ahora.toMillis());
}

/**
 * Inicia práctica: lock exclusivo del péndulo + sesión activa en Firestore.
 */
export async function iniciarPractica({ reservacionId, penduloId, usuarioId }) {
  const practicaId = `${usuarioId}_${Date.now()}`;
  const practicaInicio = Timestamp.now();
  const penduloRef = doc(db, 'pendulo_data', penduloId);
  const reservacionRef = doc(db, 'reservaciones', reservacionId);

  await runTransaction(db, async (transaction) => {
    const reservacionSnap = await transaction.get(reservacionRef);
    if (!reservacionSnap.exists()) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = reservacionSnap.data();
    if (reservacion.usuario_id !== usuarioId) {
      throw new Error('No tienes permiso para iniciar esta reservación');
    }

    const ahora = Timestamp.now();
    if (ahora.toMillis() < reservacion.inicio_sesion_reserva.toMillis()) {
      throw new Error('Aún no es tu horario de reserva');
    }
    if (ahora.toMillis() > reservacion.final_sesion_reserva.toMillis()) {
      throw new Error('Tu franja de reserva ya expiró');
    }

    const penduloSnap = await transaction.get(penduloRef);
    const penduloData = penduloSnap.exists() ? penduloSnap.data() : {};
    const lockAjenoVigente = await lockDeOtroUsuarioVigente(
      transaction,
      penduloData,
      usuarioId,
      ahora,
    );
    if (lockAjenoVigente) {
      throw new Error(
        'Ocupado: otro usuario tiene el control del péndulo en su franja de 30 minutos.',
      );
    }

    transaction.update(reservacionRef, {
      estado: 'active',
      practica_id: practicaId,
      practicas_realizadas: (reservacion.practicas_realizadas ?? 0) + 1,
      fecha_actualizacion: Timestamp.now(),
    });

    transaction.set(
      penduloRef,
      {
        usuarioActivo: usuarioId,
        practicaId,
        practicaInicio,
        penduloId,
        reservacionId,
      },
      { merge: true },
    );

    if (reservacion.slot_id) {
      const slotRef = doc(db, 'slots_ocupados', reservacion.slot_id);
      transaction.update(slotRef, { estado: 'active' });
    }
  });

  return { practicaId, practicaInicio };
}

/**
 * Indica si un practicaId corresponde a una sesión de prueba manual / calibración.
 */
export function esPracticaManual(practicaId) {
  return typeof practicaId === 'string' && practicaId.startsWith('manual_');
}

/**
 * Inicia captura manual (docente/admin): lock en Firestore sin reserva ni comando web.
 * El bridge persiste lecturas mientras usuarioActivo esté activo.
 */
export async function iniciarPruebaManual({ penduloId, usuarioId }) {
  const practicaId = `manual_${usuarioId}_${Date.now()}`;
  const practicaInicio = Timestamp.now();
  const penduloRef = doc(db, 'pendulo_data', penduloId);

  await runTransaction(db, async (transaction) => {
    const penduloSnap = await transaction.get(penduloRef);
    const penduloData = penduloSnap.exists ? penduloSnap.data() : {};
    const ahora = Timestamp.now();
    const lockAjenoVigente = lockDeOtroUsuarioVigente(
      transaction,
      penduloData,
      usuarioId,
      ahora,
    );
    if (lockAjenoVigente) {
      throw new Error(
        'Ocupado: otro usuario tiene el control del péndulo en su franja de 30 minutos.',
      );
    }

    transaction.set(
      penduloRef,
      {
        usuarioActivo: usuarioId,
        practicaId,
        practicaInicio,
        penduloId,
        reservacionId: null,
        modoManual: true,
        loopManual: {
          activo: true,
          intervaloMinutos: 15,
          oscilaciones: 15,
          distanciaMuro: 15,
          estado: 'iniciando',
          cicloActual: 0,
          ultimoCicloInicio: null,
          ultimoCicloFin: null,
          proximoCicloEn: null,
          ultimoError: null,
          muestrasUltimoCiclo: 0,
        },
      },
      { merge: true },
    );
  });

  return { practicaId, practicaInicio };
}

/**
 * Finaliza la captura manual y libera el lock del péndulo.
 */
export async function finalizarPruebaManual({ penduloId, usuarioId }) {
  const penduloRef = doc(db, 'pendulo_data', penduloId);

  const penduloSnap = await getDoc(penduloRef);
  if (!penduloSnap.exists()) {
    throw new Error('Péndulo no encontrado');
  }

  const penduloData = penduloSnap.data();
  if (penduloData.usuarioActivo !== usuarioId) {
    throw new Error('No tienes permiso para finalizar esta prueba manual');
  }

  try {
    await addDoc(collection(db, 'pendulo_comandos'), {
      penduloId,
      usuarioId,
      accion: 'detener',
      oscilaciones: null,
      distanciaMuro: null,
      reservacionId: null,
      practicaId: penduloData.practicaId ?? null,
      estado: 'pendiente',
      fechaCreacion: Timestamp.now(),
    });
  } catch (err) {
    console.warn('No se pudo encolar comando detener al finalizar prueba manual:', err);
  }

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(penduloRef);
    if (!snap.exists()) {
      throw new Error('Péndulo no encontrado');
    }

    const data = snap.data();
    if (data.usuarioActivo !== usuarioId) {
      throw new Error('No tienes permiso para finalizar esta prueba manual');
    }

    transaction.set(
      penduloRef,
      {
        usuarioActivo: null,
        practicaId: null,
        practicaInicio: null,
        reservacionId: null,
        modoManual: null,
        loopManual: {
          activo: false,
          estado: 'detenido',
          proximoCicloEn: null,
        },
      },
      { merge: true },
    );
  });
}

/**
 * Libera el péndulo tras una práctica individual sin cerrar la reserva.
 * El estudiante puede iniciar otra práctica mientras siga en su franja de 30 min.
 */
export async function liberarPractica({ reservacionId, penduloId, usuarioId }) {
  const penduloRef = doc(db, 'pendulo_data', penduloId);
  const reservacionRef = doc(db, 'reservaciones', reservacionId);

  await runTransaction(db, async (transaction) => {
    const reservacionSnap = await transaction.get(reservacionRef);
    if (!reservacionSnap.exists()) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = reservacionSnap.data();
    if (reservacion.usuario_id !== usuarioId) {
      throw new Error('No tienes permiso para liberar esta práctica');
    }

    const practicasRealizadas = reservacion.practicas_realizadas ?? 0;

    transaction.update(reservacionRef, {
      estado: 'active',
      practicas_realizadas: practicasRealizadas,
      fecha_actualizacion: Timestamp.now(),
    });

    transaction.set(
      penduloRef,
      {
        usuarioActivo: null,
        practicaId: null,
        practicaInicio: null,
        reservacionId: null,
      },
      { merge: true },
    );
  });
}

/**
 * Cierra la reserva completa (fin de la franja de 30 min o cierre manual).
 */
export async function completarReservacion({ reservacionId, penduloId, usuarioId }) {
  const penduloRef = doc(db, 'pendulo_data', penduloId);
  const reservacionRef = doc(db, 'reservaciones', reservacionId);

  await runTransaction(db, async (transaction) => {
    const reservacionSnap = await transaction.get(reservacionRef);
    if (!reservacionSnap.exists()) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = reservacionSnap.data();
    if (reservacion.usuario_id !== usuarioId) {
      throw new Error('No tienes permiso para completar esta reservación');
    }

    transaction.update(reservacionRef, {
      estado: 'completed',
      fecha_actualizacion: Timestamp.now(),
    });

    const penduloSnap = await transaction.get(penduloRef);
    const penduloData = penduloSnap.exists() ? penduloSnap.data() : {};
    if (!penduloData.usuarioActivo || penduloData.usuarioActivo === usuarioId) {
      transaction.set(
        penduloRef,
        {
          usuarioActivo: null,
          practicaId: null,
          practicaInicio: null,
          reservacionId: null,
        },
        { merge: true },
      );
    }

    if (reservacion.slot_id) {
      const slotRef = doc(db, 'slots_ocupados', reservacion.slot_id);
      transaction.update(slotRef, { estado: 'cancelled' });
    }
  });
}

/** @deprecated Usar liberarPractica o completarReservacion según el caso. */
export async function finalizarPractica(params) {
  return liberarPractica(params);
}

export function escucharReservacionesUsuario(usuario_id, callback, onError) {
  const q = query(collection(db, 'reservaciones'), where('usuario_id', '==', usuario_id));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const reservaciones = [];
      querySnapshot.forEach((docSnap) => {
        reservaciones.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(reservaciones);
    },
    (error) => {
      console.error('Error al escuchar reservaciones:', error);
      if (onError) onError(error);
    },
  );
}

export function escucharTodasReservaciones(callback, onError) {
  return onSnapshot(
    collection(db, 'reservaciones'),
    (querySnapshot) => {
      const reservaciones = [];
      querySnapshot.forEach((docSnap) => {
        reservaciones.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(reservaciones);
    },
    (error) => {
      console.error('Error al escuchar todas las reservaciones:', error);
      if (onError) onError(error);
    },
  );
}

/**
 * Escuchar slots ocupados de un péndulo (disponibilidad pública sin PII).
 */
export function escucharSlotsOcupados(pendulo_id, callback, onError) {
  const q = query(
    collection(db, 'slots_ocupados'),
    where('pendulo_id', '==', pendulo_id),
    where('estado', 'in', ['pending', 'active']),
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const slots = [];
      querySnapshot.forEach((docSnap) => {
        slots.push({ id: docSnap.id, ...docSnap.data() });
      });
      callback(slots);
    },
    (error) => {
      console.error('Error al escuchar slots ocupados:', error);
      if (onError) onError(error);
    },
  );
}
