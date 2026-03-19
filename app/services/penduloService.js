import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Crear un nuevo péndulo
 * @param {Object} penduloData - Datos del péndulo
 * @param {string} penduloData.pendulo_id - Identificador único del péndulo
 * @param {string} penduloData.institucion - Nombre de la institución
 * @param {string} penduloData.pais - País donde está instalado
 * @param {string} penduloData.latitud - Coordenada de latitud
 * @param {string} penduloData.longitud - Coordenada de longitud
 * @param {string} penduloData.estado - Estado: Activo | Inactivo | En_uso | En_mantenimiento
 * @returns {Promise<void>}
 */
export async function crearPendulo(penduloData) {
  try {
    const { pendulo_id, institucion, pais, latitud, longitud, estado } = penduloData;

    if (!pendulo_id) {
      throw new Error('El pendulo_id es requerido');
    }

    const validStates = ['Activo', 'Inactivo', 'En_uso', 'En_mantenimiento'];
    if (!validStates.includes(estado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${validStates.join(', ')}`);
    }

    await setDoc(doc(db, 'pendulos', pendulo_id), {
      pendulo_id,
      institucion,
      pais,
      latitud: String(latitud),
      longitud: String(longitud),
      estado: estado || 'Activo',
      fecha_actualizacion: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error al crear péndulo:', error);
    throw error;
  }
}

/**
 * Obtener un péndulo por su ID
 * @param {string} pendulo_id - ID del péndulo
 * @returns {Promise<Object>} Datos del péndulo
 */
export async function obtenerPendulo(pendulo_id) {
  try {
    const docSnap = await getDocs(query(collection(db, 'pendulos'), where('pendulo_id', '==', pendulo_id)));
    
    if (docSnap.empty) {
      throw new Error('Péndulo no encontrado');
    }

    return {
      id: docSnap.docs[0].id,
      ...docSnap.docs[0].data(),
    };
  } catch (error) {
    console.error('Error al obtener péndulo:', error);
    throw error;
  }
}

/**
 * Obtener todos los péndulos
 * @returns {Promise<Array>} Lista de todos los péndulos
 */
export async function obtenerTodosPendulos() {
  try {
    const querySnapshot = await getDocs(collection(db, 'pendulos'));
    const pendulos = [];

    querySnapshot.forEach((doc) => {
      pendulos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return pendulos;
  } catch (error) {
    console.error('Error al obtener péndulos:', error);
    throw error;
  }
}

/**
 * Obtener péndulos por institución
 * @param {string} institucion - Nombre de la institución
 * @returns {Promise<Array>} Lista de péndulos de la institución
 */
export async function obtenerPendulosPorInstitucion(institucion) {
  try {
    const q = query(collection(db, 'pendulos'), where('institucion', '==', institucion));
    const querySnapshot = await getDocs(q);
    const pendulos = [];

    querySnapshot.forEach((doc) => {
      pendulos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return pendulos;
  } catch (error) {
    console.error('Error al obtener péndulos de la institución:', error);
    throw error;
  }
}

/**
 * Obtener péndulos por país
 * @param {string} pais - Nombre del país
 * @returns {Promise<Array>} Lista de péndulos del país
 */
export async function obtenerPendulosPorPais(pais) {
  try {
    const q = query(collection(db, 'pendulos'), where('pais', '==', pais));
    const querySnapshot = await getDocs(q);
    const pendulos = [];

    querySnapshot.forEach((doc) => {
      pendulos.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return pendulos;
  } catch (error) {
    console.error('Error al obtener péndulos del país:', error);
    throw error;
  }
}

/**
 * Actualizar el estado de un péndulo
 * @param {string} pendulo_id - ID del péndulo
 * @param {string} nuevoEstado - Nuevo estado: Activo | Inactivo | En_uso | En_mantenimiento
 * @returns {Promise<void>}
 */
export async function actualizarEstadoPendulo(pendulo_id, nuevoEstado) {
  try {
    const validStates = ['Activo', 'Inactivo', 'En_uso', 'En_mantenimiento'];
    if (!validStates.includes(nuevoEstado)) {
      throw new Error(`Estado inválido. Debe ser uno de: ${validStates.join(', ')}`);
    }

    await updateDoc(doc(db, 'pendulos', pendulo_id), {
      estado: nuevoEstado,
      fecha_actualizacion: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error al actualizar estado del péndulo:', error);
    throw error;
  }
}

/**
 * Actualizar datos completos de un péndulo
 * @param {string} pendulo_id - ID del péndulo
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<void>}
 */
export async function actualizarPendulo(pendulo_id, datosActualizados) {
  try {
    const actualizacion = {
      ...datosActualizados,
      fecha_actualizacion: Timestamp.now(),
    };

    await updateDoc(doc(db, 'pendulos', pendulo_id), actualizacion);
  } catch (error) {
    console.error('Error al actualizar péndulo:', error);
    throw error;
  }
}

/**
 * Escuchar cambios en tiempo real de todos los péndulos
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export function escucharTodosPendulos(callback) {
  return onSnapshot(collection(db, 'pendulos'), (querySnapshot) => {
    const pendulos = [];
    querySnapshot.forEach((doc) => {
      pendulos.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(pendulos);
  }, (error) => {
    console.error('Error al escuchar péndulos:', error);
  });
}

/**
 * Escuchar cambios en tiempo real de un péndulo específico
 * @param {string} pendulo_id - ID del péndulo
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export function escucharPendulo(pendulo_id, callback) {
  return onSnapshot(doc(db, 'pendulos', pendulo_id), (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data(),
      });
    } else {
      console.error('Péndulo no encontrado');
    }
  }, (error) => {
    console.error('Error al escuchar péndulo:', error);
  });
}

/**
 * Obtener el estado actual de disponibilidad de un péndulo
 * @param {string} pendulo_id - ID del péndulo
 * @returns {Promise<boolean>} true si el péndulo está disponible
 */
export async function esPenduloDisponible(pendulo_id) {
  try {
    const pendulo = await obtenerPendulo(pendulo_id);
    return pendulo.estado === 'Activo';
  } catch (error) {
    console.error('Error al verificar disponibilidad del péndulo:', error);
    return false;
  }
}
