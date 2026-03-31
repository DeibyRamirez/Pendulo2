import {
  doc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Crear una nueva reservación de péndulo
 * @param {Object} reservationData - Datos de la reservación
 * @param {string} reservationData.usuario_id - UID del usuario
 * @param {Date} reservationData.inicio_sesion_reserva - Fecha/hora de inicio
 * @param {Date} reservationData.final_sesion_reserva - Fecha/hora de fin
 * @param {string} reservationData.estado - Estado: pending | active | completed | cancelled
 * @param {string} reservationData.institucion - Institución del usuario
 * @param {string} reservationData.pendulo_id - ID del péndulo
 * @returns {Promise<string>} ID del documento creado
 */
export async function crearReservacion(reservationData) {
  try {
    const { usuario_id, inicio_sesion_reserva, final_sesion_reserva, estado, institucion, pendulo_id } = reservationData;

    // Convertir fechas a Timestamp de Firestore
    const inicioTimestamp = Timestamp.fromDate(new Date(inicio_sesion_reserva));
    const finalTimestamp = Timestamp.fromDate(new Date(final_sesion_reserva));

    // Validar que la sesión no exceda 30 minutos
    const duracionMinutos = (finalTimestamp.toDate() - inicioTimestamp.toDate()) / (1000 * 60);
    if (duracionMinutos > 30) {
      throw new Error('Las sesiones no pueden exceder 30 minutos');
    }

    // Validar que no haya conflictos de horarios
    await validarConflictosHorario(pendulo_id, inicioTimestamp, finalTimestamp);

    // Crear documento en la colección 'reservaciones'
    const docRef = await addDoc(collection(db, 'reservaciones'), {
      usuario_id,
      inicio_sesion_reserva: inicioTimestamp,
      final_sesion_reserva: finalTimestamp,
      estado: estado || 'pending',
      institucion,
      pendulo_id,
      fecha_creacion: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error al crear reservación:', error);
    throw error;
  }
}

/**
 * Obtener todas las reservaciones de un usuario
 * @param {string} usuario_id - UID del usuario
 * @returns {Promise<Array>} Lista de reservaciones del usuario
 */
export async function obtenerReservacionesPorUsuario(usuario_id) {
  try {
    const q = query(collection(db, 'reservaciones'), where('usuario_id', '==', usuario_id));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];

    querySnapshot.forEach((doc) => {
      reservaciones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones del usuario:', error);
    throw error;
  }
}

/**
 * Obtener todas las reservaciones de un péndulo
 * @param {string} pendulo_id - ID del péndulo
 * @returns {Promise<Array>} Lista de reservaciones del péndulo
 */
export async function obtenerReservacionesPorPendulo(pendulo_id) {
  try {
    const q = query(collection(db, 'reservaciones'), where('pendulo_id', '==', pendulo_id));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];

    querySnapshot.forEach((doc) => {
      reservaciones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones del péndulo:', error);
    throw error;
  }
}

/**
 * Obtener todas las reservaciones de una institución
 * @param {string} institucion - Nombre de la institución
 * @returns {Promise<Array>} Lista de reservaciones de la institución
 */
export async function obtenerReservacionesPorInstitucion(institucion) {
  try {
    const q = query(collection(db, 'reservaciones'), where('institucion', '==', institucion));
    const querySnapshot = await getDocs(q);
    const reservaciones = [];

    querySnapshot.forEach((doc) => {
      reservaciones.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return reservaciones;
  } catch (error) {
    console.error('Error al obtener reservaciones de la institución:', error);
    throw error;
  }
}

/**
 * Actualizar el estado de una reservación
 * @param {string} reservacion_id - ID del documento de reservación
 * @param {string} nuevoEstado - Nuevo estado (pending | active | completed | cancelled)
 * @returns {Promise<void>}
 */
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

/**
 * Cancelar una reservación
 * @param {string} reservacion_id - ID del documento de reservación
 * @returns {Promise<void>}
 */
export async function cancelarReservacion(reservacion_id) {
  try {
    await actualizarEstadoReservacion(reservacion_id, 'cancelled');
  } catch (error) {
    console.error('Error al cancelar reservación:', error);
    throw error;
  }
}

/**
 * Eliminar una reservación (solo si está en estado pending)
 * @param {string} reservacion_id - ID del documento de reservación
 * @returns {Promise<void>}
 */
export async function eliminarReservacion(reservacion_id) {
  try {
    // Verificar que la reservación esté en estado pending antes de eliminar
    const docSnap = await getDocs(query(collection(db, 'reservaciones'), where('__name__', '==', reservacion_id)));
    
    if (docSnap.empty) {
      throw new Error('Reservación no encontrada');
    }

    const reservacion = docSnap.docs[0].data();
    if (reservacion.estado !== 'pending') {
      throw new Error('Solo se pueden eliminar reservaciones en estado pending');
    }

    await deleteDoc(doc(db, 'reservaciones', reservacion_id));
  } catch (error) {
    console.error('Error al eliminar reservación:', error);
    throw error;
  }
}

/**
 * Validar que no haya conflictos de horarios para un péndulo
 * @param {string} pendulo_id - ID del péndulo
 * @param {Timestamp} inicio - Timestamp de inicio
 * @param {Timestamp} final - Timestamp de fin
 * @returns {Promise<boolean>} true si no hay conflictos
 */
export async function validarConflictosHorario(pendulo_id, inicio, final) {
  try {
    const q = query(
      collection(db, 'reservaciones'),
      where('pendulo_id', '==', pendulo_id),
      where('estado', 'in', ['pending', 'active'])
    );

    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      const reservacion = doc.data();
      const existingStart = reservacion.inicio_sesion_reserva.toDate();
      const existingEnd = reservacion.final_sesion_reserva.toDate();
      const newStart = inicio.toDate();
      const newEnd = final.toDate();

      // Verificar si hay solapamiento
      if (newStart < existingEnd && newEnd > existingStart) {
        throw new Error(`Hay un conflicto de horario. El péndulo está reservado desde ${existingStart.toLocaleString()} hasta ${existingEnd.toLocaleString()}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error al validar conflictos de horario:', error);
    throw error;
  }
}

/**
 * Escuchar cambios en tiempo real de las reservaciones de un usuario
 * @param {string} usuario_id - UID del usuario
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export function escucharReservacionesUsuario(usuario_id, callback) {
  const q = query(collection(db, 'reservaciones'), where('usuario_id', '==', usuario_id));
  
  return onSnapshot(q, (querySnapshot) => {
    const reservaciones = [];
    querySnapshot.forEach((doc) => {
      reservaciones.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(reservaciones);
  }, (error) => {
    console.error('Error al escuchar reservaciones:', error);
  });
}

/**
 * Escuchar cambios en tiempo real de todas las reservaciones
 * @param {Function} callback - Funcion a ejecutar cuando hay cambios
 * @returns {Function} Funcion para desuscribirse
 */
export function escucharTodasReservaciones(callback) {
  return onSnapshot(
    collection(db, 'reservaciones'),
    (querySnapshot) => {
      const reservaciones = [];
      querySnapshot.forEach((doc) => {
        reservaciones.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(reservaciones);
    },
    (error) => {
      console.error('Error al escuchar todas las reservaciones:', error);
    }
  );
}
