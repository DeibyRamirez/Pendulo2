/**
 * Servicio de Autenticación — authService.js
 * ─────────────────────────────────────────────────────────────
 * Centraliza todas las operaciones de autenticación con Firebase.
 * Los componentes NO deben llamar a Firebase directamente;
 * deben usar estas funciones para mantener la lógica desacoplada.
 *
 * Funciones disponibles:
 *   - iniciarSesion(email, password)
 *   - registrarUsuario(email, password, nombre, institucion)
 *   - cerrarSesion()
 * ─────────────────────────────────────────────────────────────
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { normalizeRole } from '@/lib/roles';

export function validarDominioInstitucional(email) {
  return (email || '').toLowerCase().endsWith('.edu.co');
}

async function validarSesionInstitucional(user) {
  if (!user?.email || !validarDominioInstitucional(user.email)) {
    await signOut(auth);
    const error = new Error('El correo de Google debe terminar en .edu.co');
    error.code = 'auth/unauthorized-domain';
    throw error;
  }

  return user;
}

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email    - Correo electrónico del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise} Credencial de Firebase con el usuario autenticado
 */
export async function iniciarSesion(email, password) {
  const credencial = await signInWithEmailAndPassword(auth, email, password);
  return credencial;
}

/**
 * Inicia sesión con Google y valida que el correo sea institucional.
 */
export async function iniciarSesionConGoogle() {
  const provider = new GoogleAuthProvider();
  const credencial = await signInWithPopup(auth, provider);
  await validarSesionInstitucional(credencial.user);
  return credencial;
}

/**
 * Registra un nuevo usuario en Firebase Auth y guarda su perfil
 * (nombre y rol) en la colección "usuarios" de Firestore.
 *
 * @param {string} email    - Correo electrónico
 * @param {string} password - Contraseña (mínimo 6 caracteres)
 * @param {string} nombre   - Nombre completo para mostrar
 * @param {string} institucion - Institución educativa a la que pertenece el usuario
 * @returns {Promise} Credencial de Firebase con el usuario creado
 */
export async function registrarUsuario(email, password, nombre, institucion) {
  if (!validarDominioInstitucional(email)) {
    throw new Error('El correo debe terminar en .edu.co');
  }

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
    rol:        'Estudiante',
    estado:     'active',
    creadoEn:   new Date().toISOString(),
    institucion: institucion,
  });

  return credencial;
}

/**
 * Completa el registro de un usuario autenticado con Google.
 * Guarda los datos institucionales en Firestore sin duplicar la cuenta.
 */
export async function completarRegistroGoogle({ uid, email, nombre, institucion, fotoURL }) {
  if (!uid || !email) {
    throw new Error('No se encontró una sesión válida de Google');
  }

  await setDoc(
    doc(db, 'usuarios', uid),
    {
      uid,
      email,
      nombre: nombre || email.split('@')[0],
      rol: 'Estudiante',
      estado: 'active',
      creadoEn: new Date().toISOString(),
      institucion,
      fotoURL: fotoURL || null,
      proveedor: 'google',
    },
    { merge: true }
  );
}

export function obtenerRutaDashboardPorRol(rol) {
  const normalizedRole = normalizeRole(rol);
  if (normalizedRole === 'Admin') return '/admin';
  if (normalizedRole === 'Docente') return '/docente';
  return '/dashboard';
}

/**
 * Cierra la sesión del usuario activo.
 * @returns {Promise}
 */
export async function cerrarSesion() {
  return await signOut(auth);
}
