'use client';

import { useEffect, useState } from 'react';
import { usePendulos } from '@/hooks/usePendulos';
import { Card } from '@/components/ui/card';

export default function DisponibilidadPendulos() {
  const { pendulos, loading, error } = usePendulos();
  const [expandido, setExpandido] = useState<string | null>(null);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'En_uso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'En_mantenimiento':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Inactivo':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoIcono = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return '🟢';
      case 'En_uso':
        return '🔵';
      case 'En_mantenimiento':
        return '🟡';
      case 'Inactivo':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'Activo': 'Disponible',
      'En_uso': 'En Uso',
      'En_mantenimiento': 'Mantenimiento',
      'Inactivo': 'No Disponible',
    };
    return labels[estado] || estado;
  };

  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Cargando información de péndulos...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="text-center text-red-600">
          Error al cargar péndulos: {error}
        </div>
      </Card>
    );
  }

  const pendulosDisponibles = pendulos.filter(p => p.estado === 'Activo').length;
  const pendulosEnUso = pendulos.filter(p => p.estado === 'En_uso').length;

  return (
    <Card className="w-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Estado de Péndulos en la Red WPA
        </h2>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{pendulosDisponibles}</div>
            <div className="text-sm text-green-600">Disponibles</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{pendulosEnUso}</div>
            <div className="text-sm text-blue-600">En Uso</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {pendulos.filter(p => p.estado === 'En_mantenimiento').length}
            </div>
            <div className="text-sm text-yellow-600">Mantenimiento</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{pendulos.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        {/* Lista de péndulos */}
        {pendulos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No hay péndulos registrados en el sistema
          </div>
        ) : (
          <div className="space-y-3">
            {pendulos.map((pendulo) => (
              <div
                key={pendulo.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() =>
                    setExpandido(expandido === pendulo.id ? null : pendulo.id)
                  }
                  className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <span className="text-2xl">{getEstadoIcono(pendulo.estado)}</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {pendulo.pendulo_id || 'Péndulo sin ID'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {pendulo.institucion} - {pendulo.pais}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(
                        pendulo.estado
                      )}`}
                    >
                      {getEstadoLabel(pendulo.estado)}
                    </span>
                    <span className="text-gray-400">
                      {expandido === pendulo.id ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* Detalles expandidos */}
                {expandido === pendulo.id && (
                  <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 font-medium">ID del Péndulo</div>
                        <div className="text-gray-900">{pendulo.pendulo_id}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">Institución</div>
                        <div className="text-gray-900">{pendulo.institucion}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">País</div>
                        <div className="text-gray-900">{pendulo.pais}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">Estado</div>
                        <div className="text-gray-900">{getEstadoLabel(pendulo.estado)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">Latitud</div>
                        <div className="text-gray-900">{pendulo.latitud}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 font-medium">Longitud</div>
                        <div className="text-gray-900">{pendulo.longitud}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-600 font-medium">Última Actualización</div>
                        <div className="text-gray-900">
                          {formatearFecha(pendulo.fecha_actualizacion)}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional según estado */}
                    {pendulo.estado === 'Activo' && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                        ✓ Este péndulo está disponible para reservar
                      </div>
                    )}
                    {pendulo.estado === 'En_uso' && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                        ◎ Este péndulo está en uso en este momento
                      </div>
                    )}
                    {pendulo.estado === 'En_mantenimiento' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                        ⚠ Este péndulo está en mantenimiento y no está disponible
                      </div>
                    )}
                    {pendulo.estado === 'Inactivo' && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                        ✗ Este péndulo está inactivo y no está disponible
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
