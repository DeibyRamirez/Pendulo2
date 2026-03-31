import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
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

export async function actualizarRolUsuario(uid, rol) {
  await updateDoc(doc(db, 'usuarios', uid), { rol });
}

export async function actualizarEstadoUsuario(uid, estado) {
  await updateDoc(doc(db, 'usuarios', uid), { estado });
}
