import type { PenduloEnVivo } from '@/hooks/usePenduloData';
import type { Pendulo } from '@/hooks/usePendulos';

export const OSCILACIONES_MAX = 20;
export const SEGUNDOS_SIN_SENAL = 10;

/** El bridge escribe telemetría en pendulo_data/UAC-01, no en el id numérico del catálogo. */
export const PENDULO_ID_TELEMETRIA = 'UAC-01';

export function formatNumber(value: unknown, decimals = 2): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return value.toFixed(decimals);
}

export function limitarOscilaciones(valor: unknown): number | null {
  if (typeof valor !== 'number' || Number.isNaN(valor)) return null;
  const entero = Math.round(valor);
  if (entero < 1 || entero > OSCILACIONES_MAX) return null;
  return entero;
}

export function resolverIdTelemetria(urlId: string, catalogo: Pendulo | null): string {
  const delCatalogo = catalogo?.pendulo_id?.trim();
  if (delCatalogo && /[A-Za-z]/.test(delCatalogo)) return delCatalogo;
  if (urlId && /[A-Za-z]/.test(urlId)) return urlId;
  return PENDULO_ID_TELEMETRIA;
}

/** Resuelve un ítem del catálogo a partir del id de ruta (numérico, firestore id o pendulo_id). */
export function buscarPenduloEnCatalogo(
  pendulos: Pendulo[],
  urlId: string,
): Pendulo | null {
  const byId = pendulos.find((p) => p.id === urlId);
  if (byId) return byId;
  const byPenduloId = pendulos.find((p) => p.pendulo_id === urlId);
  if (byPenduloId) return byPenduloId;
  const numericId = Number(urlId);
  if (!Number.isNaN(numericId) && numericId >= 1 && numericId <= pendulos.length) {
    return pendulos[numericId - 1] ?? null;
  }
  return null;
}

export function esPracticaEnVivo(
  enVivo: PenduloEnVivo | null,
  segundosDesdeUltimoDato: number | null,
): boolean {
  const practicaEnCurso = enVivo?.estado === 'en_progreso';
  const haySenalReciente =
    segundosDesdeUltimoDato !== null && segundosDesdeUltimoDato < SEGUNDOS_SIN_SENAL;
  return practicaEnCurso && haySenalReciente;
}

export function maxMuestrasDesdeEnVivo(enVivo: PenduloEnVivo | null): number {
  return (
    limitarOscilaciones(enVivo?.oscilacionesConfirmadas) ??
    limitarOscilaciones(enVivo?.oscilaciones) ??
    OSCILACIONES_MAX
  );
}
