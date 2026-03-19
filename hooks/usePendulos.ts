'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  obtenerPendulo,
  obtenerPendulosPorInstitucion,
  escucharTodosPendulos,
  escucharPendulo,
  esPenduloDisponible,
} from '@/app/services/penduloService';

export type EstadoPendulo = 'Activo' | 'Inactivo' | 'En_uso' | 'En_mantenimiento';

export interface Pendulo {
  id: string;
  pendulo_id: string;
  institucion: string;
  pais: string;
  latitud: string;
  longitud: string;
  estado: EstadoPendulo;
  fecha_actualizacion?: unknown;
}

interface UsePendulosResult {
  pendulos: Pendulo[];
  pendulosDisponibles: Pendulo[];
  loading: boolean;
  error: string | null;
  obtenerPenduloById: (pendulo_id: string) => Promise<Pendulo>;
  obtenerPorInstitucion: (institucion: string) => Promise<Pendulo[]>;
  verificarDisponibilidad: (pendulo_id: string) => Promise<boolean>;
  escucharPenduloEspecifico: (pendulo_id: string, callback: (p: Pendulo) => void) => () => void;
  clearError: () => void;
}

/**
 * Hook para gestionar péndulos
 * @returns {Object} Estado y funciones para manejar péndulos
 */
export function usePendulos(): UsePendulosResult {
  const [pendulos, setPendulos] = useState<Pendulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todos los péndulos en tiempo real
  useEffect(() => {
    setLoading(true);
    const unsubscribe = escucharTodosPendulos((data: Pendulo[]) => {
      setPendulos(data || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Obtener un péndulo específico
  const obtenerPenduloById = useCallback(
    async (pendulo_id: string) => {
      try {
        setError(null);
        const pendulo = await obtenerPendulo(pendulo_id) as Pendulo;
        return pendulo;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al obtener pendulo');
        throw err;
      }
    },
    []
  );

  // Obtener péndulos de una institución
  const obtenerPorInstitucion = useCallback(
    async (institucion: string) => {
      try {
        setError(null);
        const resultado = await obtenerPendulosPorInstitucion(institucion) as Pendulo[];
        return resultado;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al obtener pendulos por institucion');
        throw err;
      }
    },
    []
  );

  // Verificar disponibilidad de un péndulo
  const verificarDisponibilidad = useCallback(
    async (pendulo_id: string) => {
      try {
        setError(null);
        const disponible = await esPenduloDisponible(pendulo_id);
        return disponible;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al verificar disponibilidad');
        return false;
      }
    },
    []
  );

  // Escuchar un péndulo específico
  const escucharPenduloEspecifico = useCallback(
    (pendulo_id: string, callback: (p: Pendulo) => void) => {
      return escucharPendulo(pendulo_id, callback) as () => void;
    },
    []
  );

  // Filtrar péndulos disponibles
  const pendulosDisponibles = pendulos.filter((p: Pendulo) => p.estado === 'Activo');

  return {
    pendulos,
    pendulosDisponibles,
    loading,
    error,
    obtenerPenduloById,
    obtenerPorInstitucion,
    verificarDisponibilidad,
    escucharPenduloEspecifico,
    clearError: () => setError(null),
  };
}
