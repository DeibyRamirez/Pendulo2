'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  crearReservacion,
  actualizarEstadoReservacion,
  cancelarReservacion,
  escucharReservacionesUsuario,
  validarConflictosHorario,
} from '@/app/services/reservacionService';

export type EstadoReservacion = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Reservacion {
  id: string;
  usuario_id: string;
  inicio_sesion_reserva: Timestamp;
  final_sesion_reserva: Timestamp;
  estado: EstadoReservacion;
  institucion: string;
  pendulo_id: string;
}

export interface CrearReservacionInput {
  usuario_id: string;
  inicio_sesion_reserva: Date;
  final_sesion_reserva: Date;
  estado: EstadoReservacion;
  institucion: string;
  pendulo_id: string;
}

interface UseReservationsResult {
  reservaciones: Reservacion[];
  loading: boolean;
  error: string | null;
  crearNuevaReservacion: (reservationData: CrearReservacionInput) => Promise<void>;
  actualizarEstado: (reservacion_id: string, nuevoEstado: EstadoReservacion) => Promise<void>;
  cancelar: (reservacion_id: string) => Promise<void>;
  validarHorario: (pendulo_id: string, inicio: Date, final: Date) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Hook para gestionar reservaciones del usuario
 * @param {string} usuario_id - UID del usuario
 * @returns {Object} Estado y funciones para manejar reservaciones
 */
export function useReservations(usuario_id: string): UseReservationsResult {
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios en tiempo real de las reservaciones
  useEffect(() => {
    if (!usuario_id) return;

    setLoading(true);
    const unsubscribe = escucharReservacionesUsuario(usuario_id, (data: Reservacion[]) => {
      setReservaciones(data || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario_id]);

  // Crear una nueva reservación
  const crearNuevaReservacion = useCallback(
    async (reservationData: CrearReservacionInput) => {
      try {
        setError(null);
        setLoading(true);
        await crearReservacion(reservationData);
        // La suscripción en tiempo real actualizará automáticamente el estado
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al crear reservacion');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar estado de una reservación
  const actualizarEstado = useCallback(
    async (reservacion_id: string, nuevoEstado: EstadoReservacion) => {
      try {
        setError(null);
        await actualizarEstadoReservacion(reservacion_id, nuevoEstado);
        // La suscripción en tiempo real actualizará automáticamente el estado
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al actualizar estado');
        throw err;
      }
    },
    []
  );

  // Cancelar una reservación
  const cancelar = useCallback(
    async (reservacion_id: string) => {
      try {
        setError(null);
        await cancelarReservacion(reservacion_id);
        // La suscripción en tiempo real actualizará automáticamente el estado
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cancelar reservacion');
        throw err;
      }
    },
    []
  );

  // Validar conflictos de horario
  const validarHorario = useCallback(
    async (pendulo_id: string, inicio: Date, final: Date) => {
      try {
        setError(null);
        const inicioTimestamp = Timestamp.fromDate(new Date(inicio));
        const finalTimestamp = Timestamp.fromDate(new Date(final));
        await validarConflictosHorario(pendulo_id, inicioTimestamp, finalTimestamp);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al validar horario');
        return false;
      }
    },
    []
  );

  return {
    reservaciones,
    loading,
    error,
    crearNuevaReservacion,
    actualizarEstado,
    cancelar,
    validarHorario,
    clearError: () => setError(null),
  };
}
