'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePendulos } from '@/hooks/usePendulos';
import { escucharEstadisticasPublicas } from '@/app/services/estadisticasPublicasService';

function contarUniversidades(pendulos: { institucion?: string }[]): number {
  const instituciones = new Set(
    pendulos
      .map((p) => String(p.institucion || '').trim())
      .filter((nombre) => nombre.length > 0),
  );
  return instituciones.size;
}

export function useEstadisticasLanding() {
  const { pendulos, loading: cargandoPendulos } = usePendulos();
  const [publicas, setPublicas] = useState({
    estudiantesRegistrados: 0,
    experimentosRealizados: 0,
  });
  const [cargandoPublicas, setCargandoPublicas] = useState(true);

  useEffect(() => {
    setCargandoPublicas(true);
    const unsub = escucharEstadisticasPublicas(
      (data) => {
        setPublicas(data);
        setCargandoPublicas(false);
      },
      () => setCargandoPublicas(false),
    );
    return () => unsub();
  }, []);

  const universidadesConectadas = useMemo(() => contarUniversidades(pendulos), [pendulos]);

  return {
    experimentosRealizados: publicas.experimentosRealizados,
    estudiantesRegistrados: publicas.estudiantesRegistrados,
    universidadesConectadas,
    loading: cargandoPendulos || cargandoPublicas,
  };
}

export function formatearContadorLanding(valor: number, loading: boolean): string {
  if (loading) return '—';
  return valor.toLocaleString('es-CO');
}
