'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import type { EstadoReservacion, Reservacion } from '@/hooks/useReservations';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Timer,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

function esTimestamp(value: unknown): value is Timestamp {
  return !!value && typeof value === 'object' && 'toDate' in (value as Record<string, unknown>);
}

export default function MisReservaciones() {
  const { user } = useAuth();
  const { reservaciones, loading, error, cancelar } = useReservations(user?.uid || '');
  const [filtroEstado, setFiltroEstado] = useState<'all' | EstadoReservacion>('all');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  // Filtrar reservaciones por estado
  const reservacionesFiltradas = useMemo(() => {
    if (filtroEstado === 'all') {
      return reservaciones;
    }
    return reservaciones.filter((r) => r.estado === filtroEstado);
  }, [reservaciones, filtroEstado]);

  // Agrupar reservaciones por estado
  const estadisticas = useMemo(() => {
    return {
      pending: reservaciones.filter((r) => r.estado === 'pending').length,
      active: reservaciones.filter((r) => r.estado === 'active').length,
      completed: reservaciones.filter((r) => r.estado === 'completed').length,
      cancelled: reservaciones.filter((r) => r.estado === 'cancelled').length,
      total: reservaciones.length,
    };
  }, [reservaciones]);

  const handleCancelar = async (reservacion_id: string, estado: EstadoReservacion) => {
    if (estado !== 'pending') {
      setCancelError('Solo se pueden cancelar reservaciones pendientes');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reservación?')) {
      return;
    }

    try {
      setCancelando(reservacion_id);
      setCancelError(null);
      await cancelar(reservacion_id);
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar reservacion');
    } finally {
      setCancelando(null);
    }
  };

  const formatearFecha = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return 'N/A';
    try {
      const date = esTimestamp(timestamp) ? timestamp.toDate() : timestamp;
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const obtenerDuracionMin = (inicioTs: Timestamp | Date, finTs: Timestamp | Date) => {
    const inicio = esTimestamp(inicioTs) ? inicioTs.toDate() : inicioTs;
    const fin = esTimestamp(finTs) ? finTs.toDate() : finTs;
    return Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 60000));
  };

  const getEstadoColor = (estado: EstadoReservacion) => {
    switch (estado) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
      case 'active':
        return 'bg-sky-500/15 text-sky-700 border-sky-500/30';
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-700 border-rose-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getEstadoLabel = (estado: EstadoReservacion) => {
    const labels: Record<EstadoReservacion, string> = {
      pending: 'Pendiente',
      active: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando tus reservaciones...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis Reservas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta tus sesiones programadas, activas e históricas del péndulo remoto.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          Usuario: <span className="font-medium text-foreground">{user?.nombre || user?.email || 'Sin sesión'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Error: {error}
        </div>
      )}

      {cancelError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {cancelError}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-semibold">{estadisticas.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">{estadisticas.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En progreso</p>
            <p className="mt-1 text-2xl font-semibold text-sky-600">{estadisticas.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completadas</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{estadisticas.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Canceladas</p>
            <p className="mt-1 text-2xl font-semibold text-rose-600">{estadisticas.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          onClick={() => setFiltroEstado('all')}
          variant={filtroEstado === 'all' ? 'default' : 'outline'}
          size="sm"
        >
          Todas ({estadisticas.total})
        </Button>
        <Button
          onClick={() => setFiltroEstado('pending')}
          variant={filtroEstado === 'pending' ? 'default' : 'outline'}
          size="sm"
        >
          Pendientes ({estadisticas.pending})
        </Button>
        <Button
          onClick={() => setFiltroEstado('active')}
          variant={filtroEstado === 'active' ? 'default' : 'outline'}
          size="sm"
        >
          En Progreso ({estadisticas.active})
        </Button>
        <Button
          onClick={() => setFiltroEstado('completed')}
          variant={filtroEstado === 'completed' ? 'default' : 'outline'}
          size="sm"
        >
          Completadas ({estadisticas.completed})
        </Button>
        <Button
          onClick={() => setFiltroEstado('cancelled')}
          variant={filtroEstado === 'cancelled' ? 'default' : 'outline'}
          size="sm"
        >
          Canceladas ({estadisticas.cancelled})
        </Button>
      </div>

      {reservacionesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay reservaciones para el filtro actual.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reservacionesFiltradas.map((reservacion: Reservacion) => {
            const duracion = obtenerDuracionMin(
              reservacion.inicio_sesion_reserva,
              reservacion.final_sesion_reserva
            );

            return (
              <Card key={reservacion.id} className="border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Péndulo {reservacion.pendulo_id}</CardTitle>
                      <CardDescription>{reservacion.institucion}</CardDescription>
                    </div>
                    <Badge className={`border ${getEstadoColor(reservacion.estado)}`}>
                      {getEstadoLabel(reservacion.estado)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" /> Inicio
                      </p>
                      <p className="text-sm font-medium">{formatearFecha(reservacion.inicio_sesion_reserva)}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" /> Fin
                      </p>
                      <p className="text-sm font-medium">{formatearFecha(reservacion.final_sesion_reserva)}</p>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-3">
                      <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" /> Duración
                      </p>
                      <p className="text-sm font-medium">{duracion} minutos</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end">
                    {reservacion.estado === 'pending' ? (
                      <Button
                        onClick={() => handleCancelar(reservacion.id, reservacion.estado)}
                        disabled={cancelando === reservacion.id}
                        variant="destructive"
                        size="sm"
                      >
                        {cancelando === reservacion.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar reserva
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin acciones disponibles</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
