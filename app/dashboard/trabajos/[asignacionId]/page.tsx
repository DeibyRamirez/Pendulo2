"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuardiaModuloEvaluacion } from "@/components/guardia-modulo-evaluacion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { enviarEntrega, obtenerAsignacion, obtenerEntrega } from "@/app/services/grupoService";
import { listarPracticasDeUsuario } from "@/app/services/penduloDataService";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

interface AsignacionDetalle {
  id: string;
  titulo?: string;
  descripcion?: string;
  fecha_limite?: Timestamp;
  preguntas?: string[];
  pendulo_id?: string;
}

interface EntregaDetalle {
  respuestas?: { pregunta?: string; respuesta?: string }[];
  calificacion?: number | null;
  tarde?: boolean;
  practica_id?: string;
}

function formatFecha(valor?: Timestamp) {
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

export default function PaginaCuestionarioTrabajo() {
  const params = useParams();
  const asignacionId = String(params?.asignacionId || "");
  const { user } = useAuth();

  const [asignacion, setAsignacion] = useState<AsignacionDetalle | null>(null);
  const [entrega, setEntrega] = useState<EntregaDetalle | null>(null);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [tieneMuestras, setTieneMuestras] = useState(false);
  const [practicaId, setPracticaId] = useState("");
  const [penduloId, setPenduloId] = useState("UAC-01");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!asignacionId || !user?.uid) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const asig = await obtenerAsignacion(asignacionId);
        if (cancelado) return;
        setAsignacion(asig);

        const preguntas: string[] = asig.preguntas || [];
        const existente = await obtenerEntrega(asignacionId, user!.uid);
        if (cancelado) return;
        setEntrega(existente);
        if (existente?.respuestas?.length) {
          setRespuestas(preguntas.map((p: string, i: number) => existente.respuestas?.[i]?.respuesta || ""));
        } else {
          setRespuestas(preguntas.map(() => ""));
        }

        const idsPendulo = [asig.pendulo_id || "UAC-01"];
        const practicas = await listarPracticasDeUsuario(user!.uid, idsPendulo);
        const conMuestras = practicas.filter((p: { muestras?: number }) => (p.muestras || 0) > 0);
        if (cancelado) return;
        setTieneMuestras(conMuestras.length > 0);
        if (conMuestras[0]) {
          setPracticaId(conMuestras[0].practicaId);
          setPenduloId(conMuestras[0].penduloId || idsPendulo[0]);
        }
      } catch (err) {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el trabajo");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [asignacionId, user?.uid]);

  const yaCalificado = typeof entrega?.calificacion === "number";
  const vencido = asignacion?.fecha_limite?.toDate?.()
    ? asignacion.fecha_limite.toDate() < new Date()
    : false;
  const bloqueado = yaCalificado || vencido;

  async function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!user?.uid || !asignacion) return;
    setError("");
    setOk("");

    if (vencido) {
      setError("La fecha límite ya pasó. No puedes enviar ni editar el cuestionario.");
      return;
    }

    if (!tieneMuestras || !practicaId) {
      setError("Debes completar una práctica con muestras en el péndulo antes de enviar el cuestionario.");
      return;
    }

    const vacias = respuestas.some((r) => !String(r).trim());
    if (vacias) {
      setError("Responde todas las preguntas antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      await enviarEntrega(asignacionId, user.uid, {
        email: user.email || "",
        nombre: user.nombre || "",
        practicaId,
        penduloId,
        respuestas: (asignacion.preguntas || []).map((pregunta: string, i: number) => ({
          pregunta,
          respuesta: String(respuestas[i] || "").trim(),
        })),
      });
      setOk("Cuestionario enviado. Tu docente verá la práctica y tus respuestas.");
      const actualizada = await obtenerEntrega(asignacionId, user.uid);
      setEntrega(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el cuestionario");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="Estudiante" exactRole>
      <GuardiaModuloEvaluacion destino="/dashboard">
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard/trabajos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Todos los trabajos
          </Link>

          {cargando ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando cuestionario…
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-2">{asignacion?.titulo || "Trabajo"}</h2>
                <p className="text-muted-foreground">{asignacion?.descripcion || ""}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Fecha límite: {formatFecha(asignacion?.fecha_limite)}
                  {vencido ? " (vencido: ya no puedes editar ni enviar)" : ""}
                </p>
                {yaCalificado ? (
                  <Badge className="mt-3">Calificación: {entrega?.calificacion}</Badge>
                ) : null}
              </div>

              {!tieneMuestras ? (
                <Card className="border-border/50 mb-6">
                  <CardHeader>
                    <CardTitle>Práctica requerida</CardTitle>
                    <CardDescription>
                      El docente verifica que usaste el péndulo. Completa una práctica con muestras y vuelve aquí.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard/realtime">
                      <Button>Ir a tiempo real</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  Se asociará tu práctica más reciente con muestras.
                </p>
              )}

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Cuestionario</CardTitle>
                  <CardDescription>
                    {yaCalificado
                      ? "Este trabajo ya fue calificado. No puedes modificar las respuestas."
                      : vencido
                        ? "La fecha límite ya pasó. Puedes leer tus respuestas, pero no editarlas."
                        : "Responde con tus palabras. El envío queda ligado a tu última práctica."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={alEnviar} className="space-y-5">
                    {(asignacion?.preguntas || []).map((pregunta, indice) => (
                      <div key={indice} className="space-y-2">
                        <Label htmlFor={`pregunta-${indice}`}>
                          Pregunta {indice + 1}. {pregunta}
                        </Label>
                        <Textarea
                          id={`pregunta-${indice}`}
                          value={respuestas[indice] || ""}
                          onChange={(e) => {
                            const copia = [...respuestas];
                            copia[indice] = e.target.value;
                            setRespuestas(copia);
                          }}
                          disabled={bloqueado}
                          rows={4}
                          required
                        />
                      </div>
                    ))}

                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    {ok ? <p className="text-sm text-primary">{ok}</p> : null}

                    <Button type="submit" className="w-full" disabled={enviando || bloqueado || !tieneMuestras}>
                      {enviando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {entrega ? "Actualizar envío" : "Enviar cuestionario"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      </GuardiaModuloEvaluacion>
    </ProtectedRoute>
  );
}
