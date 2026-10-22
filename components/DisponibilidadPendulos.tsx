'use client';

import { useEffect, useState } from 'react';
import { usePendulos } from '@/hooks/usePendulos';
import { Card } from '@/components/ui/card';
import { NOMBRE_RED } from '@/lib/marca';

export default function DisponibilidadPendulos() {
  const { pendulos, loading, error } = usePendulos();
  const [expandido, setExpandido] = useState<string | null>(null);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return 'bg-[rgb(62_224_143/0.16)] text-[var(--color-ok)] border-[rgb(62_224_143/0.35)]';
      case 'En_uso':
        return 'bg-[rgb(90_169_255/0.16)] text-[var(--color-serie-2)] border-[rgb(90_169_255/0.35)]';
      case 'En_mantenimiento':
        return 'bg-[rgb(255_201_74/0.16)] text-[var(--color-serie-3)] border-[rgb(255_201_74/0.35)]';
      case 'Inactivo':
        return 'bg-[rgb(255_107_107/0.16)] text-[var(--color-error)] border-[rgb(255_107_107/0.35)]';
      default:
        return 'bg-secondary text-muted-foreground border-border';
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
        <div className="text-center text-muted-foreground">
          Cargando información de péndulos...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[var(--color-error)] p-6">
        <div className="text-center text-[var(--color-error)]">
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
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          Estado de Péndulos en la {NOMBRE_RED}
        </h2>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="num text-2xl text-[var(--color-ok)]">{pendulosDisponibles}</div>
            <div className="text-sm text-muted-foreground">Disponibles</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="num text-2xl text-[var(--color-serie-2)]">{pendulosEnUso}</div>
            <div className="text-sm text-muted-foreground">En Uso</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="num text-2xl text-[var(--color-serie-3)]">
              {pendulos.filter(p => p.estado === 'En_mantenimiento').length}
            </div>
            <div className="text-sm text-muted-foreground">Mantenimiento</div>
          </div>
          <div className="bg-secondary border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{pendulos.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Lista de péndulos */}
        {pendulos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay péndulos registrados en el sistema
          </div>
        ) : (
          <div className="space-y-3">
            {pendulos.map((pendulo) => (
              <div
                key={pendulo.id}
                className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() =>
                    setExpandido(expandido === pendulo.id ? null : pendulo.id)
                  }
                  className="w-full p-4 flex items-center justify-between bg-secondary hover:bg-[var(--color-grafito-3)] transition-colors"
                >
                  <div className="flex items-center gap-3 text-left flex-1">
                    <span className="text-2xl">{getEstadoIcono(pendulo.estado)}</span>
                    <div>
                      <div className="font-semibold text-foreground">
                        {pendulo.pendulo_id || 'Péndulo sin ID'}
                      </div>
                      <div className="text-sm text-muted-foreground">
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
                    <span className="text-muted-foreground">
                      {expandido === pendulo.id ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {/* Detalles expandidos */}
                {expandido === pendulo.id && (
                  <div className="p-4 bg-card border-t border-border space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground font-medium">ID del Péndulo</div>
                        <div className="text-foreground">{pendulo.pendulo_id}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">Institución</div>
                        <div className="text-foreground">{pendulo.institucion}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">País</div>
                        <div className="text-foreground">{pendulo.pais}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">Estado</div>
                        <div className="text-foreground">{getEstadoLabel(pendulo.estado)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">Latitud</div>
                        <div className="text-foreground">{pendulo.latitud}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">Longitud</div>
                        <div className="text-foreground">{pendulo.longitud}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground font-medium">Última Actualización</div>
                        <div className="text-foreground">
                          {formatearFecha(pendulo.fecha_actualizacion)}
                        </div>
                      </div>
                    </div>

                    {/* Información adicional según estado */}
                    {pendulo.estado === 'Activo' && (
                      <div className="rounded border border-[rgb(62_224_143/0.35)] bg-[rgb(62_224_143/0.12)] p-3 text-sm text-[var(--color-ok)]">
                        Este péndulo está disponible para reservar
                      </div>
                    )}
                    {pendulo.estado === 'En_uso' && (
                      <div className="rounded border border-[rgb(90_169_255/0.35)] bg-[rgb(90_169_255/0.12)] p-3 text-sm text-[var(--color-serie-2)]">
                        Este péndulo está en uso en este momento
                      </div>
                    )}
                    {pendulo.estado === 'En_mantenimiento' && (
                      <div className="rounded border border-[rgb(255_201_74/0.35)] bg-[rgb(255_201_74/0.12)] p-3 text-sm text-[var(--color-serie-3)]">
                        Este péndulo está en mantenimiento y no está disponible
                      </div>
                    )}
                    {pendulo.estado === 'Inactivo' && (
                      <div className="rounded border border-[rgb(255_107_107/0.35)] bg-[rgb(255_107_107/0.16)] p-3 text-sm text-[var(--color-error)]">
                        Este péndulo está inactivo y no está disponible
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
