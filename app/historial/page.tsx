'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Search,
  Clock,
  History,
  Activity,
  ChevronDown,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Timestamp } from 'firebase/firestore';

interface Reservacion {
  id: string;
  usuario_id: string;
  inicio_sesion_reserva: Timestamp | Date;
  final_sesion_reserva: Timestamp | Date;
  estado: string;
  institucion: string;
  pendulo_id: string;
}

function toDate(value: Timestamp | Date): Date {
  if (value instanceof Date) return value;
  return value?.toDate?.() ?? new Date();
}

function getDuracionMinutos(r: Reservacion): number {
  const inicio = toDate(r.inicio_sesion_reserva);
  const fin = toDate(r.final_sesion_reserva);
  return Math.round((fin.getTime() - inicio.getTime()) / 60000);
}

const PENDULOS = ['Todos', 'pendulo-1', 'pendulo-2', 'pendulo-3'];

export default function HistorialPage() {
  const { user } = useAuth();
  const result = useReservations(user?.uid || '');
  const reservaciones = (result?.reservaciones || []) as Reservacion[];
  const loading = result?.loading || false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPendulo, setSelectedPendulo] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sesionesCompletadas = reservaciones.filter((r) => r.estado === 'completed');

  const filtradas = sesionesCompletadas.filter((r) => {
    const matchesSearch =
      r.pendulo_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.institucion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPendulo = selectedPendulo === 'Todos' || r.pendulo_id === selectedPendulo;
    return matchesSearch && matchesPendulo;
  });

  const totalMinutos = Math.round(
    sesionesCompletadas.reduce((acc, r) => acc + getDuracionMinutos(r), 0)
  );
  const pendolosUnicos = new Set(sesionesCompletadas.map((r) => r.pendulo_id)).size;

  const exportarCSV = () => {
    if (sesionesCompletadas.length === 0) {
      alert('No hay sesiones completadas para exportar');
      return;
    }
    const headers = ['Fecha Inicio', 'Fecha Fin', 'Péndulo', 'Institución', 'Duración', 'Estado'];
    const rows = sesionesCompletadas.map((r) => {
      const inicio = toDate(r.inicio_sesion_reserva);
      const fin = toDate(r.final_sesion_reserva);
      return [
        inicio.toLocaleString('es-ES'),
        fin.toLocaleString('es-ES'),
        r.pendulo_id,
        r.institucion,
        `${getDuracionMinutos(r)} minutos`,
        'Completada',
      ];
    });
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_sesiones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <ProtectedRoute requiredRole="estudiante">
      <main className="min-h-screen bg-background">
        <div className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Historial de Sesiones</h1>
                <p className="text-muted-foreground mt-2">
                  Revisa el historial completo de tus sesiones completadas
                </p>
              </div>
              <Button
                variant="outline"
                onClick={exportarCSV}
                disabled={sesionesCompletadas.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sesiones Completadas</p>
                      <p className="text-2xl font-bold text-foreground">{sesionesCompletadas.length}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <History className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tiempo Total</p>
                      <p className="text-2xl font-bold text-foreground">{totalMinutos} min</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                      <Clock className="h-6 w-6 text-chart-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Péndulos Utilizados</p>
                      <p className="text-2xl font-bold text-foreground">{pendolosUnicos}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                      <Activity className="h-6 w-6 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por péndulo o institución..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        {selectedPendulo}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {PENDULOS.map((p) => (
                        <DropdownMenuItem key={p} onClick={() => setSelectedPendulo(p)}>
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            {/* Session list */}
            <Card>
              <CardHeader>
                <CardTitle>Sesiones</CardTitle>
                <CardDescription>
                  {filtradas.length} sesión{filtradas.length !== 1 ? 'es' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Cargando historial...</p>
                ) : filtradas.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-1">No tienes sesiones completadas aún</p>
                    <p className="text-sm">Las sesiones aparecerán aquí una vez que se completen</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtradas.map((r) => {
                      const inicio = toDate(r.inicio_sesion_reserva);
                      const fin = toDate(r.final_sesion_reserva);
                      const duracion = getDuracionMinutos(r);
                      const isExpanded = expandedId === r.id;

                      return (
                        <div key={r.id} className="border border-border rounded-lg overflow-hidden">
                          {/* Main row */}
                          <div
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : r.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Activity className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{r.pendulo_id}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {inicio.toLocaleDateString('es-ES')}
                                  </span>
                                  <span>{inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>{duracion} min</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                              <div className="text-right hidden md:block">
                                <p className="text-sm text-muted-foreground">Institución</p>
                                <p className="text-sm font-medium text-foreground">{r.institucion}</p>
                              </div>
                              <Badge variant="default">Completada</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // lógica de descarga individual si aplica
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Inicio</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {inicio.toLocaleString('es-ES')}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Fin</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {fin.toLocaleString('es-ES')}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Duración</p>
                                  <p className="text-lg font-bold text-foreground">{duracion} min</p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Péndulo</p>
                                  <p className="text-lg font-bold text-foreground">{r.pendulo_id}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}