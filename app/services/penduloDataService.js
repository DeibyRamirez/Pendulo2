import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Escuchar el estado "en vivo" de un péndulo (doc pendulo_data/{penduloId}).
 * Este documento lo escribe el bridge MQTT->Firestore (Admin SDK) cada vez
 * que llega un mensaje del broker.
 * @param {string} penduloId
 * @param {Function} callback - recibe el estado en vivo (o null si no existe aún)
 * @param {Function} [onError]
 * @returns {Function} función para desuscribirse
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
    }
  );
}

/**
 * Escuchar las últimas N lecturas históricas de un péndulo, para poblar
 * gráficas (pendulo_data/{penduloId}/lecturas).
 * @param {string} penduloId
 * @param {number} cantidad
 * @param {Function} callback - recibe un array ordenado de más antigua a más reciente
 * @param {Function} [onError]
 * @returns {Function} función para desuscribirse
 */
export function escucharLecturasRecientes(penduloId, cantidad, callback, onError) {
  const q = query(
    collection(db, 'pendulo_data', penduloId, 'lecturas'),
    orderBy('timestamp', 'desc'),
    limit(cantidad)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const lecturas = [];
      querySnapshot.forEach((docSnap) => {
        lecturas.push({ id: docSnap.id, ...docSnap.data() });
      });
      // La query viene descendente (más reciente primero); para graficar
      // en orden cronológico la invertimos.
      callback(lecturas.reverse());
    },
    (error) => {
      console.error('Error al escuchar lecturas del péndulo:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Enviar un comando desde la web hacia el péndulo (el bridge en la
 * Raspberry Pi lo recoge y lo publica por MQTT hacia Node-RED).
 * @param {Object} comando
 * @param {string} comando.penduloId
 * @param {string} comando.usuarioId
 * @param {'configurar'|'iniciar'|'detener'} comando.accion
 * @param {number} [comando.oscilaciones]
 * @param {number} [comando.distanciaMuro]
 * @returns {Promise<string>} ID del documento de comando creado
 */
export async function enviarComandoPendulo(comando) {
  try {
    const { penduloId, usuarioId, accion, oscilaciones, distanciaMuro } = comando;

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
      estado: 'pendiente',
      fechaCreacion: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error al enviar comando al péndulo:', error);
    throw error;
  }
}
