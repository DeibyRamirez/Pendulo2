/**
 * Servicio de inicialización de Firebase
 * ─────────────────────────────────────────────────────────────
 * Este archivo centraliza la conexión con Firebase.
 * Se inicializa una sola vez y se exportan las instancias de:
 *   - auth     → para autenticación de usuarios
 *   - db       → para Firestore (base de datos en tiempo real)
 *
 * Las credenciales se leen desde las variables de entorno (.env)
 * usando import.meta.env (sintaxis de Vite).
 * NUNCA escribir las claves directamente en este archivo.
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';

// Configuración leída desde las variables de entorno de Vite (.env)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicialización de la aplicación Firebase (se ejecuta una sola vez)
const app = initializeApp(firebaseConfig);

// Instancia de autenticación (RF-01 al RF-04)
export const auth = getAuth(app);

// Instancia de Firestore (colecciones: pendulum_data, pendulums, reservations)
export const db = getFirestore(app);

export default app;
