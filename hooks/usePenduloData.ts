'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  escucharPenduloEnVivo,
  escucharLecturasPractica,
  enviarComandoPendulo,
} from '@/app/services/penduloDataService';
import { penduloDiag } from '@/lib/penduloDiagnostics';

export type EstadoComando = 'pendiente' | 'enviado' | 'error';
export type AccionComando = 'configurar' | 'iniciar' | 'detener';

export interface PenduloEnVivo {
  id: string;
  muestras?: number;
  periodo?: number;
  gravedad?: number;
  frecuencia?: number;
  temperatura?: number;
  promedioPeriodo?: number;
  promedioGravedad?: number;
  promedioFrecuencia?: number;
  promedioTemperatura?: number;
  estado?: 'en_progreso' | 'finalizado' | 'error' | string;
  errorCodigo?: number;
  errorMensaje?: string;
  estadoDispositivo?: string;
  oscilacionesConfirmadas?: number;
  distanciaMuroConfirmada?: number;
  oscilaciones?: number;
  distanciaMuro?: number;
  usuarioActivo?: string | null;
  practicaId?: string | null;
  practicaInicio?: Timestamp;
  ultimoTopico?: string;
  ultimoRaw?: string;
  actualizadoEn?: Timestamp;
  [key: string]: unknown;
}

export interface LecturaPendulo {
  id: string;
  muestras?: number;
  periodo?: number;
  gravedad?: number;
  frecuencia?: number;
  temperatura?: number;
  timestamp?: Timestamp;
  practicaId?: string;
  [key: string]: unknown;
}

export interface EnviarComandoInput {
  usuarioId: string;
  accion: AccionComando;
  oscilaciones?: number;
  distanciaMuro?: number;
  reservacionId?: string;
  practicaId?: string;
}

export interface UsePenduloDataOptions {
  cantidadLecturas?: number;
  uid?: string | null;
  practicaInicio?: Timestamp | null;
}

interface UsePenduloDataResult {
  enVivo: PenduloEnVivo | null;
  lecturas: LecturaPendulo[];
  loading: boolean;
  error: string | null;
  segundosDesdeUltimoDato: number | null;
  enviarComando: (input: EnviarComandoInput) => Promise<string>;
  enviandoComando: boolean;
  clearError: () => void;
}

/**
 * Hook para consumir en tiempo real los datos de un péndulo (vía el bridge
 * MQTT->Firestore) y enviarle comandos (vía Firestore->MQTT).
 */
export function usePenduloData(
  penduloId: string,
  options: UsePenduloDataOptions = {},
): UsePenduloDataResult {
  const { cantidadLecturas = 10, uid = null, practicaInicio = null } = options;

  const [enVivo, setEnVivo] = useState<PenduloEnVivo | null>(null);
  const [lecturas, setLecturas] = useState<LecturaPendulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoComando, setEnviandoComando] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  const practicaActiva = Boolean(uid && practicaInicio);

  useEffect(() => {
    if (!penduloId) {
      penduloDiag.warn('Firestore', 'penduloId vacío: no se pueden suscribir listeners.', {});
      return;
    }

    setLoading(true);
    let hadLiveDoc = false;
    const unsubEnVivo = escucharPenduloEnVivo(
      penduloId,
      (data: PenduloEnVivo | null) => {
        if (data && !hadLiveDoc) {
          hadLiveDoc = true;
          penduloDiag.info('Firestore', 'Documento en vivo encontrado', {
            penduloId,
            muestras: data.muestras,
            estado: data.estado,
          });
        }
        setEnVivo(data);
        setLoading(false);
      },
      (err: Error) => {
        penduloDiag.error('Firestore', 'Error en listener de estado en vivo', {
          penduloId,
          error: err.message,
        });
        setError(err.message || 'Error al escuchar el péndulo');
        setLoading(false);
      },
    );

    return () => {
      unsubEnVivo();
    };
  }, [penduloId]);

  useEffect(() => {
    if (!penduloId || !practicaActiva || !uid || !practicaInicio) {
      setLecturas([]);
      return;
    }

    const unsubLecturas = escucharLecturasPractica(
      penduloId,
      uid,
      practicaInicio,
      cantidadLecturas,
      (data: LecturaPendulo[]) => setLecturas(data),
      (err: Error) => {
        penduloDiag.error('Firestore', 'Error en listener de lecturas de práctica', {
          penduloId,
          uid,
          error: err.message,
        });
        setError(err.message || 'Error al escuchar lecturas del péndulo');
      },
    );

    return () => unsubLecturas();
  }, [penduloId, uid, practicaInicio, cantidadLecturas, practicaActiva]);

  useEffect(() => {
    const interval = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const segundosDesdeUltimoDato = (() => {
    const fecha = enVivo?.actualizadoEn?.toDate?.();
    if (!fecha) return null;
    return Math.floor((ahora - fecha.getTime()) / 1000);
  })();

  const enviarComando = useCallback(
    async (input: EnviarComandoInput) => {
      try {
        setError(null);
        setEnviandoComando(true);
        const comandoId = await enviarComandoPendulo({
          penduloId,
          usuarioId: input.usuarioId,
          accion: input.accion,
          oscilaciones: input.oscilaciones,
          distanciaMuro: input.distanciaMuro,
          reservacionId: input.reservacionId,
          practicaId: input.practicaId,
        });
        return comandoId;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al enviar comando al péndulo';
        setError(message);
        throw err;
      } finally {
        setEnviandoComando(false);
      }
    },
    [penduloId],
  );

  return {
    enVivo,
    lecturas,
    loading,
    error,
    segundosDesdeUltimoDato,
    enviarComando,
    enviandoComando,
    clearError: () => setError(null),
  };
}
