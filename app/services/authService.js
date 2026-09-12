/**
 * Servicio de Autenticación — authService.js
 * ─────────────────────────────────────────────────────────────
 * Centraliza todas las operaciones de autenticación con Firebase.
 * Los componentes NO deben llamar a Firebase directamente;
 * deben usar estas funciones para mantener la lógica desacoplada.
 *
 * Funciones disponibles:
 *   - iniciarSesion(email, password)
 *   - enviarCorreoRecuperacion(email)
 *   - confirmarNuevaContrasena(codigo, nuevaContrasena)
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
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

export async function obtenerPerfilUsuario(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function perfilTieneInstitucion(perfil) {
  return Boolean(perfil && String(perfil.institucion || '').trim());
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
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error('Tu sesión de Google expiró. Vuelve a iniciar sesión.');
  }

  const uidFinal = usuario.uid;
  const emailFinal = usuario.email || email;
  if (!uidFinal || !emailFinal) {
    throw new Error('No se encontró una sesión válida de Google');
  }
  if (uid && uid !== uidFinal) {
    throw new Error('La sesión de Google no coincide. Vuelve a iniciar sesión.');
  }
  if (!validarDominioInstitucional(emailFinal)) {
    throw new Error('El correo debe terminar en .edu.co');
  }

  const ref = doc(db, 'usuarios', uidFinal);
  const existente = await getDoc(ref);

  if (existente.exists()) {
    const datos = existente.data() || {};
    if (String(datos.institucion || '').trim()) {
      return { ...datos, id: existente.id };
    }
    await updateDoc(ref, {
      institucion,
      fotoURL: fotoURL || usuario.photoURL || datos.fotoURL || null,
      proveedor: datos.proveedor || 'google',
    });
    return { ...datos, id: existente.id, institucion };
  }

  await setDoc(ref, {
    uid: uidFinal,
    email: emailFinal,
    nombre: nombre || usuario.displayName || emailFinal.split('@')[0],
    rol: 'Estudiante',
    estado: 'active',
    creadoEn: new Date().toISOString(),
    institucion,
    fotoURL: fotoURL || usuario.photoURL || null,
    proveedor: 'google',
  });
  return { uid: uidFinal, email: emailFinal, rol: 'Estudiante', institucion };
}

export function obtenerRutaDashboardPorRol(rol) {
  const normalizedRole = normalizeRole(rol);
  if (normalizedRole === 'Admin') return 'admin';
  if (normalizedRole === 'Docente') return 'docente';
  return 'dashboard';
}

/**
 * Envía el correo de Firebase para restablecer la contraseña.
 * No revela si el correo existe (evita enumerar cuentas).
 */
export async function enviarCorreoRecuperacion(email) {
  const correo = String(email || '').trim().toLowerCase();
  if (!correo) {
    throw new Error('El correo es obligatorio');
  }
  if (!correo.includes('@')) {
    const error = new Error('El formato del correo no es válido.');
    error.code = 'auth/invalid-email';
    throw error;
  }

  const origen = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    await sendPasswordResetEmail(auth, correo, {
      url: `${origen}/login`,
      handleCodeInApp: false,
    });
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return;
    }
    throw error;
  }
}

/**
 * Comprueba que el código del enlace de recuperación siga vigente.
 */
export async function verificarCodigoRecuperacion(codigo) {
  if (!codigo) {
    throw new Error('El enlace de recuperación no es válido.');
  }
  return verifyPasswordResetCode(auth, codigo);
}

/**
 * Guarda la nueva contraseña a partir del código del correo.
 */
export async function confirmarNuevaContrasena(codigo, nuevaContrasena) {
  const clave = String(nuevaContrasena || '');
  if (!codigo) {
    throw new Error('El enlace de recuperación no es válido.');
  }
  if (clave.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  await confirmPasswordReset(auth, codigo, clave);
}

/**
 * Cierra la sesión del usuario activo.
 * @returns {Promise}
 */
export async function cerrarSesion() {
  return await signOut(auth);
}
