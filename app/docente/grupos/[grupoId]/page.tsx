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
import { escucharUsuarios, buscarEstudiantes } from "@/app/services/usuarioService";
import {
  agregarMiembro,
  crearAsignacion,
  escucharAsignacionesGrupo,
  escucharMiembros,
  obtenerGrupo,
  quitarMiembro,
} from "@/app/services/grupoService";
import { ArrowLeft, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface UsuarioFila {
  id: string;
  uid?: string;
  nombre?: string;
  email?: string;
  rol?: string;
}

interface MiembroFila {
  id: string;
  uid?: string;
  nombre?: string;
  email?: string;
}

interface AsignacionFila {
  id: string;
  titulo?: string;
  fecha_limite?: Timestamp;
}

function formatFechaLimite(valor?: Timestamp) {
  const fecha = valor?.toDate?.();
  if (!fecha) return "Sin fecha";
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaginaDetalleGrupo() {
  const params = useParams();
  const grupoId = String(params?.grupoId || "");
  const { user } = useAuth();

  const [nombreGrupo, setNombreGrupo] = useState("");
  const [errorGrupo, setErrorGrupo] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioFila[]>([]);
  const [miembros, setMiembros] = useState<MiembroFila[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionFila[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [agregandoUid, setAgregandoUid] = useState("");
  const [errorMiembro, setErrorMiembro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [preguntas, setPreguntas] = useState<string[]>(["¿Qué interpretas del ejercicio?"]);
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false);
  const [errorTrabajo, setErrorTrabajo] = useState("");
  const [okTrabajo, setOkTrabajo] = useState("");

  useEffect(() => {
    if (!grupoId) return;
    obtenerGrupo(grupoId)
      .then((g) => setNombreGrupo(g.nombre || "Grupo"))
      .catch((err: Error) => setErrorGrupo(err.message));
  }, [grupoId]);

  useEffect(() => {
    return escucharUsuarios((lista: UsuarioFila[]) => setUsuarios(lista));
  }, []);

  useEffect(() => {
    if (!grupoId) return;
    const offMiembros = escucharMiembros(grupoId, (lista: MiembroFila[]) => setMiembros(lista));
    const offAsig = escucharAsignacionesGrupo(grupoId, (lista: AsignacionFila[]) => setAsignaciones(lista));
    return () => {
      offMiembros();
      offAsig();
    };
  }, [grupoId]);

  const idsEnGrupo = useMemo(() => new Set(miembros.map((m) => m.id)), [miembros]);

  const candidatos = useMemo(() => {
    return buscarEstudiantes(usuarios, busqueda).filter((u: UsuarioFila) => !idsEnGrupo.has(u.id));
  }, [usuarios, busqueda, idsEnGrupo]);

  async function alAgregar(estudiante: UsuarioFila) {
    if (!user?.uid) return;
    setErrorMiembro("");
    setAgregandoUid(estudiante.id);
    try {
      await agregarMiembro(grupoId, {
        uid: estudiante.id,
        nombre: estudiante.nombre || "",
        email: estudiante.email || "",
        docenteId: user.uid,
      });
    } catch (err) {
      setErrorMiembro(err instanceof Error ? err.message : "No se pudo agregar");
    } finally {
      setAgregandoUid("");
    }
  }

  async function alQuitar(uid: string) {
    setErrorMiembro("");
    try {
      await quitarMiembro(grupoId, uid);
    } catch (err) {
      setErrorMiembro(err instanceof Error ? err.message : "No se pudo quitar");
    }
  }

  async function alCrearTrabajo(evento: FormEvent) {
    evento.preventDefault();
    if (!user?.uid) return;
    setErrorTrabajo("");
    setOkTrabajo("");
    setGuardandoTrabajo(true);
    try {
      await crearAsignacion({
        grupoId,
        docenteId: user.uid,
        titulo,
        descripcion,
        fechaLimite,
        preguntas,
        penduloId: "UAC-01",
      });
      setTitulo("");
      setDescripcion("");
      setFechaLimite("");
      setPreguntas(["¿Qué interpretas del ejercicio?"]);
      setOkTrabajo("Trabajo creado. Los estudiantes lo verán en Trabajos asignados.");
    } catch (err) {
      setErrorTrabajo(err instanceof Error ? err.message : "No se pudo crear el trabajo");
    } finally {
      setGuardandoTrabajo(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="Docente" exactRole>
      <GuardiaModuloEvaluacion destino="/docente">
      <div className="min-h-screen bg-background">
        <BarraDocente />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href="/docente/grupos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Todos los grupos
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">{nombreGrupo || "Grupo"}</h2>
            <p className="text-muted-foreground">Agrega estudiantes y crea trabajos con cuestionario.</p>
            {errorGrupo ? <p className="text-sm text-destructive mt-2">{errorGrupo}</p> : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Estudiantes del grupo</CardTitle>
                <CardDescription>Busca por nombre o correo y agrégalos a este grupo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buscar-estudiante">Buscar estudiante</Label>
                  <Input
                    id="buscar-estudiante"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Nombre o correo"
                  />
                </div>

                {errorMiembro ? <p className="text-sm text-destructive">{errorMiembro}</p> : null}

                <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border border-border p-2">
                  {candidatos.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-3">
                      {busqueda.trim()
                        ? "No hay coincidencias fuera del grupo."
                        : "Escribe para filtrar o revisa que haya estudiantes registrados."}
                    </p>
                  ) : (
                    candidatos.slice(0, 12).map((estudiante: UsuarioFila) => (
                      <div key={estudiante.id} className="flex items-center justify-between gap-2 px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{estudiante.nombre || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground truncate">{estudiante.email}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={agregandoUid === estudiante.id}
                          onClick={() => alAgregar(estudiante)}
                        >
                          {agregandoUid === estudiante.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                          <span className="sr-only">Agregar</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">En el grupo ({miembros.length})</p>
                  {miembros.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Todavía no hay integrantes.</p>
                  ) : (
                    miembros.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{miembro.nombre || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground truncate">{miembro.email}</p>
                        </div>
                        <Button type="button" size="sm" variant="ghost" onClick={() => alQuitar(miembro.id)}>
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Quitar</span>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Nuevo trabajo</CardTitle>
                <CardDescription>Fecha límite y preguntas de texto abierto.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={alCrearTrabajo} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titulo-trabajo">Título</Label>
                    <Input
                      id="titulo-trabajo"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Práctica 1: período y gravedad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion-trabajo">Descripción</Label>
                    <Textarea
                      id="descripcion-trabajo"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Usa el péndulo y responde el cuestionario."
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreguntas([...preguntas, ""])}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar pregunta
                    </Button>
                  </div>
                  {errorTrabajo ? <p className="text-sm text-destructive">{errorTrabajo}</p> : null}
                  {okTrabajo ? <p className="text-sm text-primary">{okTrabajo}</p> : null}
                  <Button type="submit" className="w-full" disabled={guardandoTrabajo}>
                    {guardandoTrabajo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Crear asignación
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Trabajos de este grupo</CardTitle>
              <CardDescription>Abre cada uno para editar fechas, calificar y descargar el Excel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {asignaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay trabajos asignados.</p>
              ) : (
                asignaciones.map((asig) => (
                  <div
                    key={asig.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{asig.titulo}</p>
                      <p className="text-xs text-muted-foreground">Límite: {formatFechaLimite(asig.fecha_limite)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/docente/asignaciones/${asig.id}#editar-trabajo`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/docente/asignaciones/${asig.id}`}>
                        <Button size="sm">Calificar</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      </GuardiaModuloEvaluacion>
    </ProtectedRoute>
  );
}
