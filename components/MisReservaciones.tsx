'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import type { EstadoReservacion, Reservacion } from '@/hooks/useReservations';
import type { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

  const getEstadoColor = (estado: EstadoReservacion) => {
    switch (estado) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    return <div className="text-center py-8">Cargando tus reservaciones...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Reservaciones</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {cancelError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {cancelError}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{estadisticas.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4 text-center bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{estadisticas.pending}</div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </Card>
        <Card className="p-4 text-center bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">{estadisticas.active}</div>
          <div className="text-sm text-gray-600">En Progreso</div>
        </Card>
        <Card className="p-4 text-center bg-green-50">
          <div className="text-2xl font-bold text-green-700">{estadisticas.completed}</div>
          <div className="text-sm text-gray-600">Completadas</div>
        </Card>
        <Card className="p-4 text-center bg-red-50">
          <div className="text-2xl font-bold text-red-700">{estadisticas.cancelled}</div>
          <div className="text-sm text-gray-600">Canceladas</div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <Button
          onClick={() => setFiltroEstado('all')}
          variant={filtroEstado === 'all' ? 'default' : 'outline'}
        >
          Todas ({estadisticas.total})
        </Button>
        <Button
          onClick={() => setFiltroEstado('pending')}
          variant={filtroEstado === 'pending' ? 'default' : 'outline'}
          className={filtroEstado === 'pending' ? 'bg-yellow-600' : ''}
        >
          Pendientes ({estadisticas.pending})
        </Button>
        <Button
          onClick={() => setFiltroEstado('active')}
          variant={filtroEstado === 'active' ? 'default' : 'outline'}
          className={filtroEstado === 'active' ? 'bg-blue-600' : ''}
        >
          En Progreso ({estadisticas.active})
        </Button>
        <Button
          onClick={() => setFiltroEstado('completed')}
          variant={filtroEstado === 'completed' ? 'default' : 'outline'}
          className={filtroEstado === 'completed' ? 'bg-green-600' : ''}
        >
          Completadas ({estadisticas.completed})
        </Button>
        <Button
          onClick={() => setFiltroEstado('cancelled')}
          variant={filtroEstado === 'cancelled' ? 'default' : 'outline'}
          className={filtroEstado === 'cancelled' ? 'bg-red-600' : ''}
        >
          Canceladas ({estadisticas.cancelled})
        </Button>
      </div>

      {/* Tabla de Reservaciones */}
      {reservacionesFiltradas.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          No hay reservaciones para mostrar
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold">Péndulo</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Institución</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Inicio</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Fin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservacionesFiltradas.map((reservacion: Reservacion) => (
                <tr key={reservacion.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{reservacion.pendulo_id}</td>
                  <td className="px-4 py-3 text-sm">{reservacion.institucion}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatearFecha(reservacion.inicio_sesion_reserva)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatearFecha(reservacion.final_sesion_reserva)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(reservacion.estado)}`}>
                      {getEstadoLabel(reservacion.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reservacion.estado === 'pending' && (
                      <Button
                        onClick={() => handleCancelar(reservacion.id, reservacion.estado)}
                        disabled={cancelando === reservacion.id}
                        variant="destructive"
                        size="sm"
                      >
                        {cancelando === reservacion.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    )}
                    {reservacion.estado !== 'pending' && (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
