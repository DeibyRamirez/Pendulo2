'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePendulos } from '@/hooks/usePendulos';
import { escucharEstadisticasPublicas } from '@/app/services/estadisticasPublicasService';

export type EstadisticasPublicasLanding = {
  estudiantesRegistrados: number;
  experimentosRealizados: number;
};

function mergeConteos(
  a: EstadisticasPublicasLanding,
  b: EstadisticasPublicasLanding,
): EstadisticasPublicasLanding {
  return {
    estudiantesRegistrados: Math.max(a.estudiantesRegistrados, b.estudiantesRegistrados),
    experimentosRealizados: Math.max(a.experimentosRealizados, b.experimentosRealizados),
  };
}

function tieneConteos(p: EstadisticasPublicasLanding): boolean {
  return p.estudiantesRegistrados > 0 || p.experimentosRealizados > 0;
}

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
  const [publicas, setPublicas] = useState<EstadisticasPublicasLanding>({
    estudiantesRegistrados: 0,
    experimentosRealizados: 0,
  });
  const [cargandoPublicas, setCargandoPublicas] = useState(true);
  const [errorPublicas, setErrorPublicas] = useState<string | null>(null);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  const publicasRef = useRef(publicas);
  publicasRef.current = publicas;

  useEffect(() => {
    let snapListo = false;
    let apiListo = false;

    const marcarListo = () => {
      if (snapListo && apiListo) {
        setCargandoPublicas(false);
      }
    };

    setCargandoPublicas(true);
    setErrorPublicas(null);
    setErrorApi(null);

    const unsub = escucharEstadisticasPublicas(
      (data: EstadisticasPublicasLanding) => {
        setPublicas((prev) => mergeConteos(prev, data));
        snapListo = true;
        setErrorPublicas(null);
        marcarListo();
      },
      (err: unknown) => {
        snapListo = true;
        const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
        const projectId =
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '(no definido en .env.local)';
        setErrorPublicas(
          code === 'permission-denied'
            ? `Sin permiso para leer estadísticas públicas (proyecto Firebase: ${projectId}). Publica firestore.rules en ese mismo proyecto: lectura anónima de configuracion/estadisticas_publicas.`
            : 'No se pudieron cargar experimentos ni estudiantes registrados.',
        );
        marcarListo();
      },
    );

    void fetch('/api/estadisticas-landing')
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || `API estadísticas (${res.status})`);
        }
        return res.json() as Promise<EstadisticasPublicasLanding>;
      })
      .then((data) => {
        if (
          typeof data.estudiantesRegistrados === 'number' &&
          typeof data.experimentosRealizados === 'number'
        ) {
          setPublicas((prev) => mergeConteos(prev, data));
          setErrorApi(null);
        }
      })
      .catch((err: unknown) => {
        if (tieneConteos(publicasRef.current)) {
          setErrorApi(null);
          return;
        }
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las estadísticas desde el servidor.';
        setErrorApi(msg);
        console.warn('estadisticas-landing API:', err);
      })
      .finally(() => {
        apiListo = true;
        marcarListo();
      });

    return () => unsub();
  }, []);

  const universidadesConectadas = useMemo(() => contarUniversidades(pendulos), [pendulos]);

  const errorLanding =
    errorPublicas ||
    (errorApi && !tieneConteos(publicas) ? errorApi : null) ||
    (errorPendulos ? 'No se pudieron cargar los péndulos (universidades conectadas).' : null);

  return {
    experimentosRealizados: publicas.experimentosRealizados,
    estudiantesRegistrados: publicas.estudiantesRegistrados,
    universidadesConectadas,
    loadingExperimentos: cargandoPublicas,
    loadingEstudiantes: cargandoPublicas,
    loadingUniversidades: cargandoPendulos,
    errorLanding,
    errorPublicas,
    errorApi,
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
