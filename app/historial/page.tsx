'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { listarPracticasDeUsuario } from '@/app/services/penduloDataService';
import {
  exportarLecturasUsuario,
  exportarExcelGeneralUsuario,
} from '@/app/services/lecturasExportService';
import { esPracticaManual } from '@/app/services/reservacionService';
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
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Timestamp } from 'firebase/firestore';

const PENDULO_PREDETERMINADO = 'UAC-01';

interface PracticaHistorial {
  practicaId: string;
  penduloId: string;
  inicio?: Timestamp | null;
  fin?: Timestamp | null;
  muestras: number;
}

function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value?.toDate?.() ?? null;
}

function duracionPractica(inicio: Timestamp | null | undefined, fin: Timestamp | null | undefined): string {
  const start = toDate(inicio ?? null);
  const end = toDate(fin ?? null);
  if (!start || !end) return '—';
  const segundos = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  if (segundos < 60) return `${segundos} s`;
  return `${Math.round(segundos / 60)} min`;
}

export default function HistorialPage() {
  const { user } = useAuth();
  const result = useReservations(user?.uid || '');
  const reservaciones = result?.reservaciones || [];
  const loadingReservas = result?.loading || false;

  const [practicas, setPracticas] = useState<PracticaHistorial[]>([]);
  const [cargandoPracticas, setCargandoPracticas] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPendulo, setSelectedPendulo] = useState('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const [exportandoGeneral, setExportandoGeneral] = useState(false);

  const penduloIds = useMemo(() => {
    return [...new Set([PENDULO_PREDETERMINADO, ...reservaciones.map((r) => r.pendulo_id).filter(Boolean)])];
  }, [reservaciones]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelado = false;
    setCargandoPracticas(true);
    listarPracticasDeUsuario(user.uid, penduloIds)
      .then((data: PracticaHistorial[]) => {
        if (!cancelado) setPracticas(data);
      })
      .catch(() => {
        if (!cancelado) setPracticas([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoPracticas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [user?.uid, penduloIds]);

  const filtrosPendulo = ['Todos', ...penduloIds];

  const filtradas = practicas.filter((p) => {
    const texto = searchQuery.toLowerCase();
    const matchesSearch =
      p.penduloId.toLowerCase().includes(texto) ||
      p.practicaId.toLowerCase().includes(texto);
    const matchesPendulo = selectedPendulo === 'Todos' || p.penduloId === selectedPendulo;
    return matchesSearch && matchesPendulo;
  });

  const totalMuestras = practicas.reduce((acc, p) => acc + (p.muestras || 0), 0);
  const pendolosUnicos = new Set(practicas.map((p) => p.penduloId)).size;
  const loading = loadingReservas || cargandoPracticas;

  const handleDescargarPractica = async (p: PracticaHistorial) => {
    if (!user?.uid) return;
    setDescargandoId(p.practicaId);
    try {
      await exportarLecturasUsuario(p.penduloId, user.uid, p.practicaId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar el Excel de esta práctica');
    } finally {
      setDescargandoId(null);
    }
  };

  const handleExcelGeneral = async () => {
    if (!user?.uid) return;
    setExportandoGeneral(true);
    try {
      await exportarExcelGeneralUsuario(user.uid, penduloIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar el Excel general');
    } finally {
      setExportandoGeneral(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="Estudiante">
      <main className="min-h-screen bg-background">
        <div className="pt-24 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Historial de prácticas</h1>
              <p className="text-muted-foreground mt-2">
                Cada vez que inicias una práctica se genera un Excel propio. El Excel general
                reúne todas las muestras de todas tus prácticas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Prácticas realizadas</p>
                      <p className="text-2xl font-bold text-foreground">{practicas.length}</p>
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
                      <p className="text-sm text-muted-foreground">Muestras registradas</p>
                      <p className="text-2xl font-bold text-foreground">{totalMuestras}</p>
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
                      <p className="text-sm text-muted-foreground">Péndulos utilizados</p>
                      <p className="text-2xl font-bold text-foreground">{pendolosUnicos}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
                      <Activity className="h-6 w-6 text-chart-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por péndulo o práctica..."
                      value={searchQuery}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                      {filtrosPendulo.map((p) => (
                        <DropdownMenuItem key={p} onClick={() => setSelectedPendulo(p)}>
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    onClick={() => void handleExcelGeneral()}
                    disabled={exportandoGeneral || practicas.length === 0}
                  >
                    {exportandoGeneral ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Excel general
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prácticas</CardTitle>
                <CardDescription>
                  {filtradas.length} práctica{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
                  {' — '}cada descarga genera el Excel de esa práctica; el botón Excel general
                  incluye todas las muestras
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Cargando historial...</p>
                ) : filtradas.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-1">No tienes prácticas realizadas aún</p>
                    <p className="text-sm">Las prácticas aparecerán aquí cada vez que inicies una medición</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtradas.map((p) => {
                      const inicio = toDate(p.inicio ?? null);
                      const fin = toDate(p.fin ?? null);
                      const isExpanded = expandedId === p.practicaId;
                      const descargando = descargandoId === p.practicaId;
                      const clave = `${p.penduloId}-${p.practicaId}`;

                      return (
                        <div key={clave} className="border border-border rounded-lg overflow-hidden">
                          <div
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : p.practicaId)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Activity className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{p.penduloId}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {inicio ? inicio.toLocaleDateString('es-ES') : '—'}
                                  </span>
                                  {inicio && (
                                    <span>
                                      {inicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  <span>{p.muestras} muestras</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-4 sm:mt-0">
                              {esPracticaManual(p.practicaId) ? (
                                <Badge variant="secondary">Manual</Badge>
                              ) : (
                                <Badge variant="default">Práctica</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Descargar Excel de esta práctica"
                                disabled={descargando}
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  void handleDescargarPractica(p);
                                }}
                              >
                                {descargando ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Inicio</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {inicio ? inicio.toLocaleString('es-ES') : '—'}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Fin</p>
                                  <p className="text-sm font-bold text-foreground">
                                    {fin ? fin.toLocaleString('es-ES') : '—'}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Duración</p>
                                  <p className="text-lg font-bold text-foreground">
                                    {duracionPractica(p.inicio, p.fin)}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-background border border-border">
                                  <p className="text-xs text-muted-foreground">Péndulo</p>
                                  <p className="text-lg font-bold text-foreground">{p.penduloId}</p>
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
