"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, RefreshCw, Settings2, UserCog } from "lucide-react";
import {
  actualizarEstadoPendulo,
  crearPendulo,
  escucharTodosPendulos,
} from "@/app/services/penduloService";
import {
  actualizarEstadoUsuario,
  actualizarRolUsuario,
  escucharUsuarios,
} from "@/app/services/usuarioService";

type Rol = "Estudiante" | "Docente" | "Admin";
type EstadoPendulo = "Activo" | "Inactivo" | "En_uso" | "En_mantenimiento";
type EstadoUsuario = "active" | "disabled";

interface Pendulo {
  id: string;
  pendulo_id: string;
  institucion: string;
  pais: string;
  latitud: string;
  longitud: string;
  estado: EstadoPendulo;
}

interface Usuario {
  uid: string;
  nombre?: string;
  email?: string;
  rol?: Rol;
  estado?: EstadoUsuario;
}

const ESTADOS_PENDULO: EstadoPendulo[] = ["Activo", "Inactivo", "En_uso", "En_mantenimiento"];
const ROLES: Rol[] = ["Estudiante", "Docente", "Admin"];

export default function DashboardAdminPage() {
  const { user, logout } = useAuth();

  const [pendulos, setPendulos] = useState<Pendulo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [savingPendulo, setSavingPendulo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nuevoPendulo, setNuevoPendulo] = useState({
    pendulo_id: "",
    institucion: "",
    pais: "",
    latitud: "",
    longitud: "",
    estado: "Activo" as EstadoPendulo,
  });

  useEffect(() => {
    const unsubPendulos = (escucharTodosPendulos as unknown as (cb: (data: Pendulo[]) => void) => () => void)((data) => {
      setPendulos(data);
    });

    const unsubUsuarios = (escucharUsuarios as unknown as (cb: (data: Usuario[]) => void) => () => void)((data) => {
      setUsuarios(data);
    });

    return () => {
      unsubPendulos();
      unsubUsuarios();
    };
  }, []);

  const stats = useMemo(() => {
    return {
      totalPendulos: pendulos.length,
      activos: pendulos.filter((p) => p.estado === "Activo").length,
      totalUsuarios: usuarios.length,
      admins: usuarios.filter((u) => u.rol === "Admin").length,
    };
  }, [pendulos, usuarios]);

  const handleCrearPendulo = async () => {
    setError(null);
    if (!nuevoPendulo.pendulo_id || !nuevoPendulo.institucion || !nuevoPendulo.pais) {
      setError("Completa los campos obligatorios del péndulo");
      return;
    }

    try {
      setSavingPendulo(true);
      await crearPendulo(nuevoPendulo);
      setNuevoPendulo({
        pendulo_id: "",
        institucion: "",
        pais: "",
        latitud: "",
        longitud: "",
        estado: "Activo",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear péndulo");
    } finally {
      setSavingPendulo(false);
    }
  };

  const handleEstadoPendulo = async (penduloId: string, estado: EstadoPendulo) => {
    try {
      await actualizarEstadoPendulo(penduloId, estado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  };

  const handleRolUsuario = async (uid: string, rol: Rol) => {
    try {
      await actualizarRolUsuario(uid, rol);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el rol");
    }
  };

  const handleEstadoUsuario = async (uid: string, estado: EstadoUsuario) => {
    try {
      await actualizarEstadoUsuario(uid, estado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  };

  return (
    <ProtectedRoute requiredRole="Admin" exactRole>
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">Panel Admin WPA</h1>
              <p className="text-xs text-muted-foreground">Gestión completa de usuarios y péndulos</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button variant="destructive" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Péndulos</p><p className="text-2xl font-bold">{stats.totalPendulos}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="text-2xl font-bold text-emerald-600">{stats.activos}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Usuarios</p><p className="text-2xl font-bold">{stats.totalUsuarios}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Admins</p><p className="text-2xl font-bold text-primary">{stats.admins}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Agregar péndulo</CardTitle>
              <CardDescription>Crea un nuevo documento en la colección pendulos</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div><Label>ID péndulo</Label><Input value={nuevoPendulo.pendulo_id} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, pendulo_id: e.target.value })} placeholder="uac-001" /></div>
              <div><Label>Institución</Label><Input value={nuevoPendulo.institucion} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, institucion: e.target.value })} /></div>
              <div><Label>País</Label><Input value={nuevoPendulo.pais} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, pais: e.target.value })} /></div>
              <div><Label>Latitud</Label><Input value={nuevoPendulo.latitud} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, latitud: e.target.value })} /></div>
              <div><Label>Longitud</Label><Input value={nuevoPendulo.longitud} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, longitud: e.target.value })} /></div>
              <div>
                <Label>Estado inicial</Label>
                <select className="mt-2 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={nuevoPendulo.estado} onChange={(e) => setNuevoPendulo({ ...nuevoPendulo, estado: e.target.value as EstadoPendulo })}>
                  {ESTADOS_PENDULO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
              </div>
              <div className="md:col-span-3">
                <Button onClick={handleCrearPendulo} disabled={savingPendulo}>
                  {savingPendulo ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><Plus className="mr-2 h-4 w-4" /> Crear péndulo</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" /> Péndulos registrados</CardTitle>
              <CardDescription>Actualiza el estado y se reflejará en el mapa en tiempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendulos.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{p.institucion} <span className="text-muted-foreground">({p.pais})</span></p>
                    <p className="text-xs text-muted-foreground">{p.pendulo_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{p.estado}</Badge>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={p.estado} onChange={(e) => handleEstadoPendulo(p.id, e.target.value as EstadoPendulo)}>
                      {ESTADOS_PENDULO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCog className="w-5 h-5" /> Gestión de usuarios</CardTitle>
              <CardDescription>Cambia rol y estado de las cuentas registradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {usuarios.map((u) => (
                <div key={u.uid} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{u.nombre || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{u.email || u.uid}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={u.rol || "Estudiante"} onChange={(e) => handleRolUsuario(u.uid, e.target.value as Rol)}>
                      {ROLES.map((rolOpt) => <option key={rolOpt} value={rolOpt}>{rolOpt}</option>)}
                    </select>
                    <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={u.estado || "active"} onChange={(e) => handleEstadoUsuario(u.uid, e.target.value as EstadoUsuario)}>
                      <option value="active">Activo</option>
                      <option value="disabled">Desactivado</option>
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
