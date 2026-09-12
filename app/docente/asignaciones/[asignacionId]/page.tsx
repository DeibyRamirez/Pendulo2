"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuardiaModuloEvaluacion } from "@/components/guardia-modulo-evaluacion";
import { BarraDocente } from "@/components/BarraDocente";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  actualizarAsignacion,
  asignarCalificacion,
  escucharEntregas,
  escucharMiembros,
  estadoEntrega,
  ETIQUETAS_ESTADO_ENTREGA,
  estudianteTieneMuestras,
  obtenerAsignacion,
  obtenerGrupo,
} from "@/app/services/grupoService";
import { exportarExcelAsignacion } from "@/app/services/lecturasExportService";
import { ArrowLeft, Download, Loader2, Plus, Trash2 } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface AsignacionDetalle {
  id: string;
  grupo_id: string;
  docente_id: string;
  titulo?: string;
  descripcion?: string;
  fecha_limite?: Timestamp;
  preguntas?: string[];
  pendulo_id?: string;
}

interface MiembroFila {
  id: string;
  uid?: string;
  nombre?: string;
  email?: string;
}

interface EntregaFila {
  id: string;
  email?: string;
  nombre?: string;
  practica_id?: string;
  respuestas?: { pregunta?: string; respuesta?: string }[];
  calificacion?: number | null;
  tarde?: boolean;
  enviado_en?: Timestamp;
}

function formatFecha(valor?: Timestamp) {
  const fecha = valor?.toDate?.();
  if (!fecha) return "—";
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function aValorDatetimeLocal(valor?: Timestamp) {
  const fecha = valor?.toDate?.();
  if (!fecha) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

function varianteEstado(estado: string) {
  if (estado === "calificado") return "default" as const;
  if (estado === "entregado") return "secondary" as const;
  return "outline" as const;
}

export default function PaginaCalificacionAsignacion() {
  const params = useParams();
  const asignacionId = String(params?.asignacionId || "");
  const { user } = useAuth();

  const [asignacion, setAsignacion] = useState<AsignacionDetalle | null>(null);
  const [grupoNombre, setGrupoNombre] = useState("");
  const [miembros, setMiembros] = useState<MiembroFila[]>([]);
  const [entregas, setEntregas] = useState<EntregaFila[]>([]);
  const [tienePractica, setTienePractica] = useState<Record<string, boolean>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [guardandoUid, setGuardandoUid] = useState("");
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [preguntas, setPreguntas] = useState<string[]>([""]);
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false);

  useEffect(() => {
    if (!asignacionId) return;
    let cancelado = false;
    obtenerAsignacion(asignacionId)
      .then(async (asig: AsignacionDetalle) => {
        if (cancelado) return;
        setAsignacion(asig);
        setTitulo(asig.titulo || "");
        setDescripcion(asig.descripcion || "");
        setFechaLimite(aValorDatetimeLocal(asig.fecha_limite));
        setPreguntas(asig.preguntas?.length ? [...asig.preguntas] : [""]);
        try {
          const grupo = await obtenerGrupo(asig.grupo_id);
          if (!cancelado) setGrupoNombre(grupo.nombre || "");
        } catch {
          if (!cancelado) setGrupoNombre("");
        }
      })
      .catch((err: Error) => setError(err.message));
    return () => {
      cancelado = true;
    };
  }, [asignacionId]);

  useEffect(() => {
    if (!asignacion?.grupo_id) return;
    return escucharMiembros(asignacion.grupo_id, (lista: MiembroFila[]) => setMiembros(lista));
  }, [asignacion?.grupo_id]);

  useEffect(() => {
    if (!asignacionId) return;
    return escucharEntregas(asignacionId, (lista: EntregaFila[]) => {
      setEntregas(lista);
      setNotas((prev) => {
        const siguiente = { ...prev };
        lista.forEach((e) => {
          if (siguiente[e.id] === undefined && typeof e.calificacion === "number") {
            siguiente[e.id] = String(e.calificacion);
          }
        });
        return siguiente;
      });
    });
  }, [asignacionId]);

  useEffect(() => {
    if (!asignacion || miembros.length === 0) return;
    let cancelado = false;
    const penduloId = asignacion.pendulo_id || "UAC-01";
    Promise.all(
      miembros.map(async (m) => {
        const ok = await estudianteTieneMuestras(m.id, penduloId);
        return [m.id, ok] as const;
      }),
    ).then((pares) => {
      if (cancelado) return;
      setTienePractica(Object.fromEntries(pares));
    });
    return () => {
      cancelado = true;
    };
  }, [asignacion, miembros]);

  const porUid = useMemo(() => {
    const mapa = new Map<string, EntregaFila>();
    entregas.forEach((e) => mapa.set(e.id, e));
    return mapa;
  }, [entregas]);

  const filas = useMemo(() => {
    return miembros.map((miembro) => {
      const entrega = porUid.get(miembro.id);
      const estado = estadoEntrega(entrega, tienePractica[miembro.id]);
      return { miembro, entrega, estado };
    });
  }, [miembros, porUid, tienePractica]);

  async function alGuardarTrabajo(evento: FormEvent) {
    evento.preventDefault();
    if (!asignacion) return;
    setError("");
    setMensaje("");
    setGuardandoTrabajo(true);
    try {
      await actualizarAsignacion(asignacionId, {
        titulo,
        descripcion,
        fechaLimite,
        preguntas,
        penduloId: asignacion.pendulo_id || "UAC-01",
      });
      const actualizada = await obtenerAsignacion(asignacionId);
      setAsignacion(actualizada);
      setMensaje("Trabajo actualizado. Los estudiantes verán los cambios.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el trabajo");
    } finally {
      setGuardandoTrabajo(false);
    }
  }

  async function alGuardarNota(uid: string) {
    const valor = notas[uid];
    setError("");
    setMensaje("");
    setGuardandoUid(uid);
    try {
      await asignarCalificacion(asignacionId, uid, valor);
      setMensaje("Calificación guardada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la nota");
    } finally {
      setGuardandoUid("");
    }
  }

  async function alDescargarExcel() {
    if (!asignacion) return;
    setError("");
    setExportando(true);
    try {
      await exportarExcelAsignacion(asignacion, grupoNombre, entregas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }

  const limitePasado =
    asignacion?.fecha_limite?.toDate?.() != null && asignacion.fecha_limite.toDate() < new Date();

  return (
    <ProtectedRoute requiredRole="Docente" exactRole>
      <GuardiaModuloEvaluacion destino="/docente">
      <div className="min-h-screen bg-background">
        <BarraDocente />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href={asignacion ? `/docente/grupos/${asignacion.grupo_id}` : "/docente/grupos"}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al grupo
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{asignacion?.titulo || "Trabajo"}</h2>
              <p className="text-muted-foreground">{asignacion?.descripcion || "Califica las entregas de tu grupo."}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Grupo: {grupoNombre || "—"} · Límite: {formatFecha(asignacion?.fecha_limite)}
                {limitePasado ? " (vencido)" : ""}
              </p>
            </div>
            <Button variant="outline" onClick={alDescargarExcel} disabled={exportando || !user}>
              {exportando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Descargar Excel
            </Button>
          </div>

          {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}
          {mensaje ? <p className="text-sm text-primary mb-4">{mensaje}</p> : null}

          <Card id="editar-trabajo" className="border-border/50 mb-6">
            <CardHeader>
              <CardTitle>Editar trabajo</CardTitle>
              <CardDescription>
                Cambia título, fecha límite y preguntas. Si ya hay entregas, las respuestas enviadas no se modifican.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={alGuardarTrabajo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo-trabajo">Título</Label>
                  <Input
                    id="titulo-trabajo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion-trabajo">Descripción</Label>
                  <Textarea
                    id="descripcion-trabajo"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-limite">Fecha límite</Label>
                  <Input
                    id="fecha-limite"
                    type="datetime-local"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preguntas del cuestionario</Label>
                  {preguntas.map((pregunta, indice) => (
                    <div key={indice} className="flex gap-2">
                      <Input
                        value={pregunta}
                        onChange={(e) => {
                          const copia = [...preguntas];
                          copia[indice] = e.target.value;
                          setPreguntas(copia);
                        }}
                        placeholder={`Pregunta ${indice + 1}`}
                        required
                      />
                      {preguntas.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreguntas(preguntas.filter((_, i) => i !== indice))}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Quitar pregunta</span>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setPreguntas([...preguntas, ""])}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar pregunta
                  </Button>
                </div>
                <Button type="submit" disabled={guardandoTrabajo}>
                  {guardandoTrabajo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Guardar cambios
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Entregas</CardTitle>
              <CardDescription>
                Una entrega válida exige práctica con muestras y cuestionario. Calificación de 0 a 5.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este grupo aún no tiene estudiantes.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Enviado</TableHead>
                      <TableHead>Calificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filas.map(({ miembro, entrega, estado }) => (
                      <TableRow key={miembro.id}>
                        <TableCell>
                          <p className="font-medium">{miembro.nombre || miembro.email}</p>
                          <p className="text-xs text-muted-foreground">{miembro.email}</p>
                          {entrega?.tarde ? (
                            <p className="text-xs text-destructive">Fuera de plazo</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={varianteEstado(estado)}>
                            {ETIQUETAS_ESTADO_ENTREGA[estado as keyof typeof ETIQUETAS_ESTADO_ENTREGA]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFecha(entrega?.enviado_en)}</TableCell>
                        <TableCell>
                          {entrega ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={5}
                                step={0.1}
                                className="w-20"
                                value={notas[miembro.id] ?? ""}
                                onChange={(e) => setNotas((prev) => ({ ...prev, [miembro.id]: e.target.value }))}
                                aria-label={`Calificación de ${miembro.nombre || miembro.email}`}
                              />
                              <Button
                                size="sm"
                                disabled={guardandoUid === miembro.id || notas[miembro.id] === ""}
                                onClick={() => alGuardarNota(miembro.id)}
                              >
                                {guardandoUid === miembro.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Guardar"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      </GuardiaModuloEvaluacion>
    </ProtectedRoute>
  );
}
