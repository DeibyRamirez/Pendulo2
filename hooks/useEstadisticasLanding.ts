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
  const { pendulos, loading: cargandoPendulos, error: errorPendulos } = usePendulos();
  const [publicas, setPublicas] = useState({
    estudiantesRegistrados: 0,
    experimentosRealizados: 0,
  });
  const [cargandoPublicas, setCargandoPublicas] = useState(true);
  const [errorPublicas, setErrorPublicas] = useState<string | null>(null);

  useEffect(() => {
    setCargandoPublicas(true);
    setErrorPublicas(null);
    const unsub = escucharEstadisticasPublicas(
      (data) => {
        setPublicas(data);
        setCargandoPublicas(false);
        setErrorPublicas(null);
      },
      (err) => {
        setCargandoPublicas(false);
        const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '(no definido en .env.local)';
        setErrorPublicas(
          code === 'permission-denied'
            ? `Sin permiso para leer estadísticas públicas (proyecto Firebase: ${projectId}). Publica firestore.rules en ese mismo proyecto: lectura anónima de configuracion/estadisticas_publicas.`
            : 'No se pudieron cargar experimentos ni estudiantes registrados.',
        );
      },
    );
    return () => unsub();
  }, []);

  const universidadesConectadas = useMemo(() => contarUniversidades(pendulos), [pendulos]);

  const errorLanding =
    errorPublicas ||
    (errorPendulos
      ? 'No se pudieron cargar los péndulos (universidades conectadas).'
      : null);

  return {
    experimentosRealizados: publicas.experimentosRealizados,
    estudiantesRegistrados: publicas.estudiantesRegistrados,
    universidadesConectadas,
    loadingExperimentos: cargandoPublicas,
    loadingEstudiantes: cargandoPublicas,
    loadingUniversidades: cargandoPendulos,
    errorLanding,
    errorPublicas,
    errorPendulos,
  };
}

export function formatearContadorLanding(
  valor: number,
  loading: boolean,
  opts?: { error?: boolean },
): string {
  if (opts?.error) return '—';
  if (loading) return '—';
  return valor.toLocaleString('es-CO');
}
