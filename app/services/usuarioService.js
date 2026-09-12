import { collection, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export function escucharUsuarios(callback) {
  return onSnapshot(
    collection(db, 'usuarios'),
    (querySnapshot) => {
      const usuarios = [];
      querySnapshot.forEach((d) => {
        usuarios.push({ id: d.id, ...d.data() });
      });
      callback(usuarios);
    },
    (error) => {
      console.error('Error al escuchar usuarios:', error);
    }
  );
}

/**
 * Filtra usuarios con rol Estudiante por nombre o correo.
 */
export function buscarEstudiantes(usuarios, texto) {
  const consulta = String(texto || '').trim().toLowerCase();
  return (usuarios || [])
    .filter((u) => u.rol === 'Estudiante')
    .filter((u) => {
      if (!consulta) return true;
      const nombre = String(u.nombre || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      return nombre.includes(consulta) || email.includes(consulta);
    });
}

/**
 * Mapa uid → { nombre, email } para exportes del docente.
 */
export async function obtenerMapaNombresUsuarios() {
  const snapshot = await getDocs(collection(db, 'usuarios'));
  const mapa = {};
  snapshot.forEach((d) => {
    const datos = d.data() || {};
    mapa[d.id] = {
      nombre: String(datos.nombre || '').trim(),
      email: String(datos.email || '').trim(),
    };
  });
  return mapa;
}

export async function actualizarRolUsuario(uid, rol) {
  await updateDoc(doc(db, 'usuarios', uid), { rol });
}

export async function actualizarEstadoUsuario(uid, estado) {
  await updateDoc(doc(db, 'usuarios', uid), { estado });
}
