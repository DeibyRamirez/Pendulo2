'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  escucharPenduloEnVivo,
  escucharLecturasRecientes,
  enviarComandoPendulo,
} from '@/app/services/penduloDataService';
import { penduloDiag } from '@/lib/penduloDiagnostics';

export type EstadoComando = 'pendiente' | 'enviado' | 'error';
export type AccionComando = 'configurar' | 'iniciar' | 'detener';

export interface PenduloEnVivo {
  id: string;
  /** Número de muestras (oscilaciones medidas) capturadas hasta ahora */
  muestras?: number;
  /** Última muestra instantánea */
  periodo?: number;
  gravedad?: number;
  frecuencia?: number;
  temperatura?: number;
  /** Promedios acumulados (recalculados por el hardware tras cada muestra) */
  promedioPeriodo?: number;
  promedioGravedad?: number;
  promedioFrecuencia?: number;
  promedioTemperatura?: number;
  /**
   * 'en_progreso' mientras llegan muestras (o tras "STROK"), 'finalizado'
   * al recibir "END", 'error' si el firmware reportó un código de error
   * (láser/microswitch)
   */
  estado?: 'en_progreso' | 'finalizado' | 'error' | string;
  /** Presentes solo cuando estado === 'error' */
  errorCodigo?: number;
  errorMensaje?: string;
  /**
   * Última señal cruda del handshake serial Node-RED<->microcontrolador,
   * reenviada por MQTT (topico "pendulo/estado", ver bridge/README.md):
   * 'configurando' | 'configurado' | 'iniciando' | 'iniciado' |
   * 'recibiendo_datos' | 'finalizado' | 'detenido'. Puede no existir todavía
   * si Node-RED no está reenviando estas señales al broker.
   */
  estadoDispositivo?: string;
  /** Eco de los parámetros que el péndulo confirmó haber recibido (señal "CFG+osc+dist") */
  oscilacionesConfirmadas?: number;
  distanciaMuroConfirmada?: number;
  /** Parámetros de configuración enviados en el último comando (si el bridge los refleja) */
  oscilaciones?: number;
  distanciaMuro?: number;
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
  [key: string]: unknown;
}

export interface EnviarComandoInput {
  usuarioId: string;
  accion: AccionComando;
  oscilaciones?: number;
  distanciaMuro?: number;
}

interface UsePenduloDataResult {
  enVivo: PenduloEnVivo | null;
  lecturas: LecturaPendulo[];
  loading: boolean;
  error: string | null;
  /** Segundos desde la última actualización recibida del péndulo (null si nunca llegó dato) */
  segundosDesdeUltimoDato: number | null;
  enviarComando: (input: EnviarComandoInput) => Promise<string>;
  enviandoComando: boolean;
  clearError: () => void;
}

/**
 * Hook para consumir en tiempo real los datos de un péndulo (vía el bridge
 * MQTT->Firestore) y enviarle comandos (vía Firestore->MQTT).
 * @param penduloId - ID del péndulo, ej. "UAC-01"
 * @param cantidadLecturas - cuántos puntos históricos traer para graficar
 */
export function usePenduloData(penduloId: string, cantidadLecturas = 50): UsePenduloDataResult {
  const [enVivo, setEnVivo] = useState<PenduloEnVivo | null>(null);
  const [lecturas, setLecturas] = useState<LecturaPendulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviandoComando, setEnviandoComando] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!penduloId) {
      penduloDiag.warn('Firestore', 'penduloId vacío: no se pueden suscribir listeners.', {});
      return;
    }

    penduloDiag.info('Firestore', `Suscribiendo listeners para péndulo ${penduloId}`, {
      docEnVivo: `pendulo_data/${penduloId}`,
      subcoleccion: `pendulo_data/${penduloId}/lecturas`,
      cantidadLecturas,
    });

    setLoading(true);
    let hadLiveDoc = false;
    const unsubEnVivo = escucharPenduloEnVivo(
      penduloId,
      (data: PenduloEnVivo | null) => {
        if (data) {
          if (!hadLiveDoc) {
            hadLiveDoc = true;
            penduloDiag.info('Firestore', 'Documento en vivo encontrado', {
              penduloId,
              muestras: data.muestras,
              estado: data.estado,
            });
          }
        } else if (!hadLiveDoc) {
          penduloDiag.warn('Firestore', `Sin documento en pendulo_data/${penduloId} todavía`, {
            hint: 'Normal si el bridge nunca escribió telemetría para este péndulo.',
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
      }
    );

    const unsubLecturas = escucharLecturasRecientes(
      penduloId,
      cantidadLecturas,
      (data: LecturaPendulo[]) => setLecturas(data),
      (err: Error) => {
        penduloDiag.error('Firestore', 'Error en listener de lecturas históricas', {
          penduloId,
          error: err.message,
        });
        setError(err.message || 'Error al escuchar lecturas del péndulo');
      }
    );

    return () => {
      penduloDiag.info('Firestore', `Desuscribiendo listeners de ${penduloId}`, {});
      unsubEnVivo();
      unsubLecturas();
    };
  }, [penduloId, cantidadLecturas]);

  // Reloj para poder derivar "hace cuánto llegó el último dato" en la UI
  // (ej. para mostrar "sin uso" si el péndulo/bridge se cae).
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
        penduloDiag.info('Comando', `Enviando comando "${input.accion}" a Firestore`, {
          penduloId,
          usuarioId: input.usuarioId,
          oscilaciones: input.oscilaciones,
          distanciaMuro: input.distanciaMuro,
          coleccion: 'pendulo_comandos',
        });
        const comandoId = await enviarComandoPendulo({
          penduloId,
          usuarioId: input.usuarioId,
          accion: input.accion,
          oscilaciones: input.oscilaciones,
          distanciaMuro: input.distanciaMuro,
        });
        penduloDiag.info('Comando', 'Documento de comando creado en Firestore', {
          comandoId,
          estadoInicial: 'pendiente',
        });
        return comandoId;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al enviar comando al péndulo';
        penduloDiag.error('Comando', 'No se pudo crear el documento en Firestore', {
          penduloId,
          accion: input.accion,
          error: message,
          posiblesCausas: ['Reglas de Firestore', 'Usuario no autenticado', 'Sin conexión a internet'],
        });
        setError(message);
        throw err;
      } finally {
        setEnviandoComando(false);
      }
    },
    [penduloId]
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
