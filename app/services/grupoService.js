import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

const PENDULO_PREDETERMINADO = 'UAC-01';

export async function crearGrupo({ nombre, docenteId, docenteEmail, institucion }) {
  const nombreLimpio = String(nombre || '').trim();
  if (!nombreLimpio) throw new Error('El nombre del grupo es obligatorio');
  if (!docenteId) throw new Error('El docente es obligatorio');

  const ref = await addDoc(collection(db, 'grupos'), {
    nombre: nombreLimpio,
    docente_id: docenteId,
    docente_email: docenteEmail || '',
    institucion: institucion || '',
    fecha_creacion: Timestamp.now(),
  });
  return ref.id;
}

export function escucharGruposDocente(docenteId, callback, onError) {
  if (!docenteId) {
    callback([]);
    return () => {};
  }

  const q = query(collection(db, 'grupos'), where('docente_id', '==', docenteId));
  return onSnapshot(
    q,
    (snap) => {
      const grupos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      grupos.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
      callback(grupos);
    },
    (err) => {
      console.error('Error al escuchar grupos:', err);
      if (onError) onError(err);
    },
  );
}

/**
 * @param {string} grupoId
 * @returns {Promise<{ id: string, nombre?: string, docente_id?: string, docente_email?: string, institucion?: string }>}
 */
export async function obtenerGrupo(grupoId) {
  const snap = await getDoc(doc(db, 'grupos', grupoId));
  if (!snap.exists()) throw new Error('Grupo no encontrado');
  return { id: snap.id, ...snap.data() };
}

export async function eliminarGrupo(grupoId) {
  const miembrosSnap = await getDocs(collection(db, 'grupos', grupoId, 'miembros'));
  const batch = writeBatch(db);
  miembrosSnap.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(db, 'grupos', grupoId));
  await batch.commit();
}

export function escucharMiembros(grupoId, callback, onError) {
  if (!grupoId) {
    callback([]);
    return () => {};
  }

  return onSnapshot(
    collection(db, 'grupos', grupoId, 'miembros'),
    (snap) => {
      const miembros = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      miembros.sort((a, b) => (a.nombre || a.email || '').localeCompare(b.nombre || b.email || '', 'es'));
      callback(miembros);
    },
    (err) => {
      console.error('Error al escuchar miembros:', err);
      if (onError) onError(err);
    },
  );
}

export async function listarMiembros(grupoId) {
  const snap = await getDocs(collection(db, 'grupos', grupoId, 'miembros'));
  const miembros = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  miembros.sort((a, b) => (a.nombre || a.email || '').localeCompare(b.nombre || b.email || '', 'es'));
  return miembros;
}

export async function agregarMiembro(grupoId, { uid, nombre, email, docenteId }) {
  if (!grupoId || !uid) throw new Error('Grupo y estudiante son obligatorios');

  const ref = doc(db, 'grupos', grupoId, 'miembros', uid);
  const existente = await getDoc(ref);
  if (existente.exists()) throw new Error('Ese estudiante ya está en el grupo');

  await setDoc(ref, {
    uid,
    nombre: nombre || '',
    email: email || '',
    docente_id: docenteId || '',
    fecha_alta: Timestamp.now(),
  });
}

export async function quitarMiembro(grupoId, uid) {
  await deleteDoc(doc(db, 'grupos', grupoId, 'miembros', uid));
}

export async function crearAsignacion({
  grupoId,
  docenteId,
  titulo,
  descripcion,
  fechaLimite,
  preguntas,
  penduloId,
}) {
  const tituloLimpio = String(titulo || '').trim();
  if (!tituloLimpio) throw new Error('El título del trabajo es obligatorio');
  if (!grupoId || !docenteId) throw new Error('Grupo y docente son obligatorios');
  const listaPreguntas = (preguntas || []).map((p) => String(p).trim()).filter(Boolean);
  if (listaPreguntas.length === 0) {
    throw new Error('Agrega al menos una pregunta para el cuestionario');
  }
  if (!fechaLimite) throw new Error('La fecha límite es obligatoria');

  const ref = await addDoc(collection(db, 'asignaciones'), {
    grupo_id: grupoId,
    docente_id: docenteId,
    titulo: tituloLimpio,
    descripcion: String(descripcion || '').trim(),
    fecha_limite: fechaLimite instanceof Timestamp ? fechaLimite : Timestamp.fromDate(new Date(fechaLimite)),
    preguntas: listaPreguntas,
    pendulo_id: penduloId || PENDULO_PREDETERMINADO,
    fecha_creacion: Timestamp.now(),
  });
  return ref.id;
}

export async function actualizarAsignacion(asignacionId, { titulo, descripcion, fechaLimite, preguntas, penduloId }) {
  if (!asignacionId) throw new Error('El trabajo es obligatorio');
  const tituloLimpio = String(titulo || '').trim();
  if (!tituloLimpio) throw new Error('El título del trabajo es obligatorio');
  const listaPreguntas = (preguntas || []).map((p) => String(p).trim()).filter(Boolean);
  if (listaPreguntas.length === 0) {
    throw new Error('Agrega al menos una pregunta para el cuestionario');
  }
  if (!fechaLimite) throw new Error('La fecha límite es obligatoria');

  await updateDoc(doc(db, 'asignaciones', asignacionId), {
    titulo: tituloLimpio,
    descripcion: String(descripcion || '').trim(),
    fecha_limite: fechaLimite instanceof Timestamp ? fechaLimite : Timestamp.fromDate(new Date(fechaLimite)),
    preguntas: listaPreguntas,
    pendulo_id: penduloId || PENDULO_PREDETERMINADO,
  });
}

export function escucharAsignacionesGrupo(grupoId, callback, onError) {
  if (!grupoId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'asignaciones'), where('grupo_id', '==', grupoId));
  return onSnapshot(
    q,
    (snap) => {
      const filas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      filas.sort((a, b) => (b.fecha_limite?.toMillis?.() ?? 0) - (a.fecha_limite?.toMillis?.() ?? 0));
      callback(filas);
    },
    (err) => {
      console.error('Error al escuchar asignaciones del grupo:', err);
      if (onError) onError(err);
    },
  );
}

export function escucharAsignacionesDocente(docenteId, callback, onError) {
  if (!docenteId) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'asignaciones'), where('docente_id', '==', docenteId));
  return onSnapshot(
    q,
    (snap) => {
      const filas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      filas.sort((a, b) => (b.fecha_limite?.toMillis?.() ?? 0) - (a.fecha_limite?.toMillis?.() ?? 0));
      callback(filas);
    },
    (err) => {
      console.error('Error al escuchar asignaciones del docente:', err);
      if (onError) onError(err);
    },
  );
}

/**
 * @param {string} asignacionId
 * @returns {Promise<{
 *   id: string,
 *   titulo?: string,
 *   descripcion?: string,
 *   fecha_limite?: import('firebase/firestore').Timestamp,
 *   preguntas?: string[],
 *   pendulo_id?: string,
 *   grupo_id?: string,
 *   docente_id?: string
 * }>}
 */
export async function obtenerAsignacion(asignacionId) {
  const snap = await getDoc(doc(db, 'asignaciones', asignacionId));
  if (!snap.exists()) throw new Error('Trabajo no encontrado');
  return { id: snap.id, ...snap.data() };
}

export function escucharEntregas(asignacionId, callback, onError) {
  if (!asignacionId) {
    callback([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, 'asignaciones', asignacionId, 'entregas'),
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error('Error al escuchar entregas:', err);
      if (onError) onError(err);
    },
  );
}

export async function listarEntregas(asignacionId) {
  const snap = await getDocs(collection(db, 'asignaciones', asignacionId, 'entregas'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function enviarEntrega(asignacionId, uid, data) {
  if (!data.practicaId) {
    throw new Error('Debes completar una práctica con muestras antes de enviar');
  }
  const asignacion = await obtenerAsignacion(asignacionId);
  const limite = asignacion.fecha_limite?.toDate?.() ?? null;
  const tarde = limite ? new Date() > limite : false;
  if (tarde) {
    throw new Error('La fecha límite ya pasó. No puedes enviar ni editar el cuestionario.');
  }

  const ref = doc(db, 'asignaciones', asignacionId, 'entregas', uid);
  const existente = await getDoc(ref);
  const payload = {
    uid,
    email: data.email || '',
    nombre: data.nombre || '',
    practica_id: data.practicaId,
    pendulo_id: data.penduloId || PENDULO_PREDETERMINADO,
    respuestas: data.respuestas || [],
    enviado_en: Timestamp.now(),
    tarde,
  };

  if (existente.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, { ...payload, calificacion: null });
  }
}

export async function asignarCalificacion(asignacionId, uid, calificacion) {
  const valor = Number(calificacion);
  if (Number.isNaN(valor) || valor < 0 || valor > 5) {
    throw new Error('La calificación debe estar entre 0 y 5');
  }
  await updateDoc(doc(db, 'asignaciones', asignacionId, 'entregas', uid), {
    calificacion: valor,
  });
}

export async function listarGruposDeEstudiante(uid) {
  if (!uid) return [];
  const q = query(collectionGroup(db, 'miembros'), where('uid', '==', uid));
  const snap = await getDocs(q);
  const grupos = [];
  for (const miembro of snap.docs) {
    const grupoRef = miembro.ref.parent.parent;
    if (!grupoRef) continue;
    const grupoSnap = await getDoc(grupoRef);
    if (grupoSnap.exists()) {
      grupos.push({ id: grupoSnap.id, ...grupoSnap.data() });
    }
  }
  return grupos;
}

export async function listarAsignacionesEstudiante(uid) {
  const grupos = await listarGruposDeEstudiante(uid);
  const ids = grupos.map((g) => g.id);
  if (ids.length === 0) return [];

  const asignaciones = [];
  for (let i = 0; i < ids.length; i += 10) {
    const lote = ids.slice(i, i + 10);
    const q = query(collection(db, 'asignaciones'), where('grupo_id', 'in', lote));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const grupo = grupos.find((g) => g.id === d.data().grupo_id);
      asignaciones.push({
        id: d.id,
        ...d.data(),
        grupo_nombre: grupo?.nombre || '',
      });
    });
  }
  asignaciones.sort((a, b) => (a.fecha_limite?.toMillis?.() ?? 0) - (b.fecha_limite?.toMillis?.() ?? 0));
  return asignaciones;
}

/**
 * @param {string} asignacionId
 * @param {string} uid
 * @returns {Promise<null | {
 *   id: string,
 *   respuestas?: { pregunta?: string, respuesta?: string }[],
 *   calificacion?: number | null,
 *   tarde?: boolean,
 *   practica_id?: string
 * }>}
 */
export async function obtenerEntrega(asignacionId, uid) {
  const snap = await getDoc(doc(db, 'asignaciones', asignacionId, 'entregas', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function obtenerEstadisticasDocente(docenteId) {
  const gruposSnap = await getDocs(query(collection(db, 'grupos'), where('docente_id', '==', docenteId)));
  const grupos = gruposSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let estudiantes = 0;
  const uids = new Set();
  for (const grupo of grupos) {
    const miembros = await getDocs(collection(db, 'grupos', grupo.id, 'miembros'));
    miembros.forEach((m) => uids.add(m.id));
    estudiantes = uids.size;
  }

  const asignacionesSnap = await getDocs(
    query(collection(db, 'asignaciones'), where('docente_id', '==', docenteId)),
  );
  const asignaciones = asignacionesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  let entregas = 0;
  for (const asig of asignaciones) {
    const ent = await getDocs(collection(db, 'asignaciones', asig.id, 'entregas'));
    entregas += ent.size;
  }

  return {
    grupos: grupos.length,
    estudiantes,
    asignaciones: asignaciones.length,
    entregas,
  };
}

export const ETIQUETAS_ESTADO_ENTREGA = {
  calificado: 'Calificado',
  entregado: 'Entregado',
  practica_sin_cuestionario: 'Práctica sin cuestionario',
  sin_practica: 'Sin práctica',
};

export function estadoEntrega(entrega, tienePractica) {
  if (entrega && typeof entrega.calificacion === 'number') return 'calificado';
  if (entrega) return 'entregado';
  if (tienePractica) return 'practica_sin_cuestionario';
  return 'sin_practica';
}

export async function estudianteTieneMuestras(uid, penduloId) {
  const { listarPracticasDeUsuario } = await import('./penduloDataService');
  const practicas = await listarPracticasDeUsuario(uid, [penduloId || PENDULO_PREDETERMINADO]);
  return practicas.some((p) => (p.muestras || 0) > 0);
}

export async function listarAsignacionesYEntregasDocente(docenteId) {
  const gruposSnap = await getDocs(query(collection(db, 'grupos'), where('docente_id', '==', docenteId)));
  const grupos = new Map(gruposSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

  const asignacionesSnap = await getDocs(
    query(collection(db, 'asignaciones'), where('docente_id', '==', docenteId)),
  );

  const resultado = [];
  for (const d of asignacionesSnap.docs) {
    const asignacion = { id: d.id, ...d.data() };
    const grupo = grupos.get(asignacion.grupo_id);
    const entregas = await listarEntregas(asignacion.id);
    resultado.push({
      asignacion,
      grupoNombre: grupo?.nombre || '',
      entregas,
    });
  }
  return resultado;
}
