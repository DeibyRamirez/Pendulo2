/**
 * Servicio de Autenticación — authService.js
 * ─────────────────────────────────────────────────────────────
 * Centraliza todas las operaciones de autenticación con Firebase.
 * Los componentes NO deben llamar a Firebase directamente;
 * deben usar estas funciones para mantener la lógica desacoplada.
 *
 * Funciones disponibles:
 *   - iniciarSesion(email, password)
 *   - registrarUsuario(email, password, nombre, rol)
 *   - cerrarSesion()
 * ─────────────────────────────────────────────────────────────
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email    - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise} Credencial de Firebase con el usuario autenticado
 */
export async function iniciarSesion(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Registra un nuevo usuario en Firebase Auth y guarda su perfil
 * (nombre y rol) en la colección "usuarios" de Firestore.
 *
 * @param {string} email    - Correo electrónico
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {string} nombre   - Nombre completo para mostrar
 * @param {string} rol      - Rol asignado: 'estudiante' | 'docente' | 'admin'
 * @returns {Promise} Credencial de Firebase con el usuario creado
 */
export async function registrarUsuario(email, password, nombre, rol = 'estudiante') {
  // Crear la cuenta en Firebase Auth
  const credencial = await createUserWithEmailAndPassword(auth, email, password);

  // Actualizar el nombre visible en el perfil de Auth
  await updateProfile(credencial.user, { displayName: nombre });

  // Guardar el perfil completo (incluyendo el rol) en Firestore
  // El documento usa el UID como identificador para facilitar las consultas
  await setDoc(doc(db, 'usuarios', credencial.user.uid), {
    uid:        credencial.user.uid,
    email:      email,
    nombre:     nombre,
    rol:        rol,
    creadoEn:   new Date().toISOString(),
  });

  return credencial;
}

/**
 * Cierra la sesión del usuario activo.
 * @returns {Promise}
 */
export async function cerrarSesion() {
  return await signOut(auth);
}
