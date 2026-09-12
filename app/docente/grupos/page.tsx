"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuardiaModuloEvaluacion } from "@/components/guardia-modulo-evaluacion";
import { BarraDocente } from "@/components/BarraDocente";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearGrupo, escucharGruposDocente } from "@/app/services/grupoService";
import { ArrowLeft, Loader2, Plus, Users } from "lucide-react";

interface GrupoLista {
  id: string;
  nombre: string;
  institucion?: string;
}

export default function PaginaGruposDocente() {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<GrupoLista[]>([]);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    return escucharGruposDocente(user.uid, (lista: GrupoLista[]) => setGrupos(lista));
  }, [user?.uid]);

  async function alCrear(evento: FormEvent) {
    evento.preventDefault();
    if (!user?.uid) return;
    setError("");
    setGuardando(true);
    try {
      await crearGrupo({
        nombre,
        docenteId: user.uid,
        docenteEmail: user.email || "",
        institucion: user.institucion || "",
      });
      setNombre("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el grupo");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ProtectedRoute requiredRole="Docente" exactRole>
      <GuardiaModuloEvaluacion destino="/docente">
      <div className="min-h-screen bg-background">
        <BarraDocente />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Link
            href="/docente"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al panel
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Grupos de trabajo</h2>
            <p className="text-muted-foreground">
              Crea grupos como Física II y asigna estudiantes y trabajos.
            </p>
          </div>

          <Card className="border-border/50 mb-8">
            <CardHeader>
              <CardTitle>Nuevo grupo</CardTitle>
              <CardDescription>El nombre es visible para tus estudiantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={alCrear} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full space-y-2">
                  <Label htmlFor="nombre-grupo">Nombre del grupo</Label>
                  <Input
                    id="nombre-grupo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Física II"
                    maxLength={80}
                    required
                  />
                </div>
                <Button type="submit" disabled={guardando || !nombre.trim()}>
                  {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Crear grupo
                </Button>
              </form>
              {error ? <p className="text-sm text-destructive mt-3">{error}</p> : null}
            </CardContent>
          </Card>

          {grupos.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                Aún no tienes grupos. Crea el primero para empezar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grupos.map((grupo) => (
                <Card key={grupo.id} className="border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {grupo.nombre}
                    </CardTitle>
                    <CardDescription>{grupo.institucion || user?.institucion || "Sin institución"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/docente/grupos/${grupo.id}`}>
                      <Button className="w-full">Abrir grupo</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
      </GuardiaModuloEvaluacion>
    </ProtectedRoute>
  );
}
