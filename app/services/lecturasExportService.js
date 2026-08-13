import * as XLSX from 'xlsx';
import {
  obtenerLecturasPractica,
  obtenerLecturasPorSesion,
  listarUsuariosConPracticas,
} from './penduloDataService';

function formatFecha(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleString('es-ES');
}

function descargarExcel(headers, rows, filename) {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lecturas');
  XLSX.writeFile(workbook, filename);
}

/**
 * Exportar lecturas de la práctica de un usuario.
 */
export async function exportarLecturasUsuario(penduloId, uid, practicaId) {
  const lecturas = await obtenerLecturasPractica(penduloId, uid, practicaId);
  if (lecturas.length === 0) {
    throw new Error('No hay lecturas para exportar en esta práctica');
  }

  const headers = ['fecha', 'gravedad', 'frecuencia', 'periodo', 'temperatura'];
  const rows = lecturas.map((l) => [
    formatFecha(l.timestamp),
    l.gravedad ?? '',
    l.frecuencia ?? '',
    l.periodo ?? '',
    l.temperatura ?? '',
  ]);

  const fecha = new Date().toISOString().split('T')[0];
  descargarExcel(headers, rows, `lecturas_${penduloId}_${uid}_${fecha}.xlsx`);
  return lecturas.length;
}

/**
 * Exportar lecturas de una sesión reservada (franja horaria completa).
 */
export async function exportarLecturasSesion(penduloId, uid, inicio, fin) {
  const lecturas = await obtenerLecturasPorSesion(penduloId, uid, inicio, fin);
  if (lecturas.length === 0) {
    throw new Error('No hay lecturas registradas en esta sesión');
  }

  const headers = ['fecha', 'gravedad', 'frecuencia', 'periodo', 'temperatura'];
  const rows = lecturas.map((l) => [
    formatFecha(l.timestamp),
    l.gravedad ?? '',
    l.frecuencia ?? '',
    l.periodo ?? '',
    l.temperatura ?? '',
  ]);

  const fechaSesion = inicio.toDate?.()
    ? inicio.toDate().toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  descargarExcel(headers, rows, `lecturas_${penduloId}_sesion_${fechaSesion}.xlsx`);
  return lecturas.length;
}

/**
 * Exportar todas las lecturas de un péndulo (admin).
 */
export async function exportarLecturasAdmin(penduloId) {
  const uids = await listarUsuariosConPracticas(penduloId);
  if (uids.length === 0) {
    throw new Error('No hay datos de prácticas para exportar');
  }

  const headers = ['usuario_uid', 'fecha', 'gravedad', 'frecuencia', 'periodo', 'temperatura', 'practica_id'];
  const allRows = [];

  for (const uid of uids) {
    const lecturas = await obtenerLecturasPractica(penduloId, uid);
    lecturas.forEach((l) => {
      allRows.push([
        uid,
        formatFecha(l.timestamp),
        l.gravedad ?? '',
        l.frecuencia ?? '',
        l.periodo ?? '',
        l.temperatura ?? '',
        l.practicaId ?? '',
      ]);
    });
  }

  if (allRows.length === 0) {
    throw new Error('No hay lecturas para exportar');
  }

  allRows.sort((a, b) => String(a[1]).localeCompare(String(b[1])));

  const fecha = new Date().toISOString().split('T')[0];
  descargarExcel(headers, allRows, `lecturas_${penduloId}_completo_${fecha}.xlsx`);
  return allRows.length;
}
