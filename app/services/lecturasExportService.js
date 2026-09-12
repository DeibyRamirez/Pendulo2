import * as XLSX from 'xlsx';
import {
  obtenerLecturasPractica,
  obtenerLecturasPorSesion,
  listarUsuariosConPracticas,
  listarPracticasUsuario,
  listarPracticasDeUsuario,
} from './penduloDataService';

function formatFecha(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleString('es-ES');
}

function numeroMuestra(lectura, indice) {
  if (typeof lectura.muestras === 'number') return lectura.muestras;
  if (typeof lectura.muestra === 'number') return lectura.muestra;
  return indice + 1;
}

function filaLectura(lectura, indice, extra = []) {
  return [
    numeroMuestra(lectura, indice),
    formatFecha(lectura.timestamp),
    lectura.periodo ?? '',
    lectura.gravedad ?? '',
    lectura.frecuencia ?? '',
    lectura.temperatura ?? '',
    ...extra,
  ];
}

const ENCABEZADOS_PRACTICA = ['muestra', 'fecha', 'periodo', 'gravedad', 'frecuencia', 'temperatura'];
const ENCABEZADOS_GENERAL = [
  'muestra',
  'fecha',
  'periodo',
  'gravedad',
  'frecuencia',
  'temperatura',
  'practica_id',
  'pendulo_id',
];

function crearHojaExcel(headers, rows) {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = headers.map((h) => ({ wch: Math.max(12, String(h).length + 2) }));
  return worksheet;
}

function descargarLibroExcel(hojas, filename) {
  const workbook = XLSX.utils.book_new();
  for (const hoja of hojas) {
    const worksheet = crearHojaExcel(hoja.encabezados, hoja.filas);
    XLSX.utils.book_append_sheet(workbook, worksheet, String(hoja.nombre).slice(0, 31));
  }
  XLSX.writeFile(workbook, filename);
}

function descargarExcel(headers, rows, filename) {
  descargarLibroExcel([{ nombre: 'Lecturas', encabezados: headers, filas: rows }], filename);
}

/**
 * Excel de UNA práctica (todas sus muestras, con columna muestra).
 */
export async function exportarLecturasUsuario(penduloId, uid, practicaId) {
  const lecturas = await obtenerLecturasPractica(penduloId, uid, practicaId);
  if (lecturas.length === 0) {
    throw new Error('No hay lecturas para exportar en esta práctica');
  }

  const rows = lecturas.map((l, i) => filaLectura(l, i));
  const idCorto = String(practicaId || 'practica').slice(-12);
  descargarExcel(ENCABEZADOS_PRACTICA, rows, `practica_${penduloId}_${idCorto}.xlsx`);
  return lecturas.length;
}

/**
 * Excel general: todas las prácticas del usuario en un péndulo,
 * una fila por muestra (se regenera completo en cada descarga).
 */
export async function exportarExcelGeneral(penduloId, uid) {
  const practicas = await listarPracticasUsuario(penduloId, uid);
  const allRows = [];

  for (const practica of practicas) {
    practica.lecturas.forEach((l, i) => {
      allRows.push(filaLectura(l, i, [practica.practicaId, penduloId]));
    });
  }

  if (allRows.length === 0) {
    throw new Error('No hay lecturas para el Excel general');
  }

  descargarExcel(ENCABEZADOS_GENERAL, allRows, `practicas_general_${penduloId}.xlsx`);
  return allRows.length;
}

/**
 * Excel general del usuario: todas las prácticas en los péndulos indicados.
 * Se regenera completo en cada descarga (incluye las muestras nuevas).
 */
export async function exportarExcelGeneralUsuario(uid, penduloIds) {
  const practicas = await listarPracticasDeUsuario(uid, penduloIds);
  const allRows = [];

  for (const practica of practicas) {
    practica.lecturas.forEach((l, i) => {
      allRows.push(filaLectura(l, i, [practica.practicaId, practica.penduloId]));
    });
  }

  if (allRows.length === 0) {
    throw new Error('No hay lecturas para el Excel general');
  }

  descargarExcel(ENCABEZADOS_GENERAL, allRows, 'practicas_general.xlsx');
  return allRows.length;
}

/**
 * @deprecated Usar exportarLecturasUsuario. Mantiene el nombre por historial.
 */
export async function exportarLecturasSesion(penduloId, uid, inicio, fin, practicaId) {
  if (practicaId) {
    return exportarLecturasUsuario(penduloId, uid, practicaId);
  }
  const lecturas = await obtenerLecturasPorSesion(penduloId, uid, inicio, fin);
  if (lecturas.length === 0) {
    throw new Error('No hay lecturas registradas en esta sesión');
  }

  const rows = lecturas.map((l, i) => filaLectura(l, i));
  const fechaSesion = inicio.toDate?.()
    ? inicio.toDate().toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  descargarExcel(ENCABEZADOS_PRACTICA, rows, `practica_${penduloId}_sesion_${fechaSesion}.xlsx`);
  return lecturas.length;
}

/**
 * Excel general de un péndulo (todas las prácticas de todos los usuarios). Admin.
 */
export async function exportarLecturasAdmin(penduloId) {
  const uids = await listarUsuariosConPracticas(penduloId);
  if (uids.length === 0) {
    throw new Error('No hay datos de prácticas para exportar');
  }

  const allRows = [];

  for (const uid of uids) {
    const lecturas = await obtenerLecturasPractica(penduloId, uid);
    lecturas.forEach((l, i) => {
      allRows.push([
        ...filaLectura(l, i, [l.practicaId ?? '', penduloId]),
        uid,
      ]);
    });
  }

  if (allRows.length === 0) {
    throw new Error('No hay lecturas para exportar');
  }

  descargarExcel(
    [...ENCABEZADOS_GENERAL, 'usuario_uid'],
    allRows,
    `practicas_general_${penduloId}.xlsx`,
  );
  return allRows.length;
}

const PENDULO_PREDETERMINADO = 'UAC-01';

const ENCABEZADOS_TODAS_LAS_MUESTRAS = [
  'nombre_estudiante',
  'correo',
  'muestra',
  'fecha',
  'periodo',
  'gravedad',
  'frecuencia',
  'temperatura',
  'practica_id',
  'pendulo_id',
];

function nombreEstudiante(mapa, uid) {
  const usuario = mapa[uid];
  if (!usuario) return uid;
  return usuario.nombre || usuario.email || uid;
}

function correoEstudiante(mapa, uid) {
  return mapa[uid]?.email || '';
}

/**
 * Excel de muestras del docente: un archivo con dos hojas.
 * Hoja 1: prácticas propias. Hoja 2: todas las muestras, con nombre del estudiante.
 * No usa grupos ni entregas. Si una hoja no tiene filas, se exporta solo con encabezados.
 */
export async function exportarExcelMuestrasDocente(docenteId, penduloId = PENDULO_PREDETERMINADO) {
  const { obtenerMapaNombresUsuarios } = await import('./usuarioService');
  const [practicasPropias, uids, mapaNombres] = await Promise.all([
    listarPracticasUsuario(penduloId, docenteId),
    listarUsuariosConPracticas(penduloId),
    obtenerMapaNombresUsuarios(),
  ]);

  const filasPropias = [];
  for (const practica of practicasPropias) {
    practica.lecturas.forEach((l, i) => {
      filasPropias.push(filaLectura(l, i, [practica.practicaId, penduloId]));
    });
  }

  const lecturasPorUsuario = await Promise.all(
    uids.map(async (uid) => ({
      uid,
      lecturas: await obtenerLecturasPractica(penduloId, uid),
    })),
  );

  const filasTodas = [];
  for (const { uid, lecturas } of lecturasPorUsuario) {
    lecturas.forEach((l, i) => {
      filasTodas.push([
        nombreEstudiante(mapaNombres, uid),
        correoEstudiante(mapaNombres, uid),
        ...filaLectura(l, i, [l.practicaId ?? '', penduloId]),
      ]);
    });
  }

  if (filasPropias.length === 0 && filasTodas.length === 0) {
    throw new Error('No hay lecturas para exportar');
  }

  const fecha = new Date().toISOString().split('T')[0];
  descargarLibroExcel(
    [
      { nombre: 'Mis prácticas', encabezados: ENCABEZADOS_GENERAL, filas: filasPropias },
      { nombre: 'Todas las muestras', encabezados: ENCABEZADOS_TODAS_LAS_MUESTRAS, filas: filasTodas },
    ],
    `excel_muestras_${penduloId}_${fecha}.xlsx`,
  );

  return { propias: filasPropias.length, todas: filasTodas.length };
}

const ENCABEZADOS_DOCENTE = [
  'Fecha',
  'Grupo',
  'Estudiante',
  'Muestras',
  'Gravedad',
  'Frecuencia',
  'Periodo',
  'Temperatura',
  'Respuestas Cuestionario',
];

function textoRespuestasCuestionario(respuestas) {
  if (!Array.isArray(respuestas) || respuestas.length === 0) return '';
  return respuestas
    .map((r, i) => `Pregunta ${i + 1}: ${r.respuesta ?? ''}`)
    .join(' | ');
}

async function filasPorEntregas(asignacion, grupoNombre, entregas) {
  const filas = [];

  for (const entrega of entregas) {
    const uid = entrega.id || entrega.uid;
    if (!uid || !entrega.practica_id) continue;

    const penduloId = entrega.pendulo_id || asignacion.pendulo_id || 'UAC-01';
    const lecturas = await obtenerLecturasPractica(penduloId, uid, entrega.practica_id);
    const respuestas = textoRespuestasCuestionario(entrega.respuestas);

    lecturas.forEach((lectura, i) => {
      filas.push([
        formatFecha(lectura.timestamp),
        grupoNombre || '',
        entrega.email || '',
        numeroMuestra(lectura, i),
        lectura.gravedad ?? '',
        lectura.frecuencia ?? '',
        lectura.periodo ?? '',
        lectura.temperatura ?? '',
        respuestas,
      ]);
    });
  }

  return filas;
}

/**
 * Excel general del docente: una fila por muestra de cada entrega
 * de estudiantes de sus grupos. Se regenera completo en cada descarga.
 */
export async function exportarExcelGeneralDocente(docenteId) {
  const { listarAsignacionesYEntregasDocente } = await import('./grupoService');
  const paquetes = await listarAsignacionesYEntregasDocente(docenteId);
  const allRows = [];

  for (const { asignacion, grupoNombre, entregas } of paquetes) {
    const filas = await filasPorEntregas(asignacion, grupoNombre, entregas);
    allRows.push(...filas);
  }

  if (allRows.length === 0) {
    throw new Error('No hay muestras de tus grupos para exportar');
  }

  const fecha = new Date().toISOString().split('T')[0];
  descargarExcel(ENCABEZADOS_DOCENTE, allRows, `reporte_docente_${fecha}.xlsx`);
  return allRows.length;
}

/**
 * Excel de una asignación: mismas columnas, solo ese trabajo.
 */
export async function exportarExcelAsignacion(asignacion, grupoNombre, entregas) {
  const allRows = await filasPorEntregas(asignacion, grupoNombre, entregas);
  if (allRows.length === 0) {
    throw new Error('No hay muestras en las entregas de este trabajo');
  }
  const idCorto = String(asignacion.id || 'trabajo').slice(-12);
  descargarExcel(ENCABEZADOS_DOCENTE, allRows, `reporte_trabajo_${idCorto}.xlsx`);
  return allRows.length;
}
