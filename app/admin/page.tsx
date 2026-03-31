"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CalendarClock,
  Globe,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import {
  actualizarEstadoPendulo,
  actualizarPendulo,
  crearPendulo,
  escucharTodosPendulos,
} from "@/app/services/penduloService";
import {
  actualizarEstadoUsuario,
  actualizarRolUsuario,
  escucharUsuarios,
} from "@/app/services/usuarioService";
import { escucharTodasReservaciones } from "@/app/services/reservacionService";

type Rol = "Estudiante" | "Docente" | "Admin";
type EstadoPendulo = "Activo" | "Inactivo" | "En_uso" | "En_mantenimiento";
type EstadoUsuario = "active" | "disabled";
type EstadoReserva = "pending" | "active" | "completed" | "cancelled";

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

interface Reservacion {
  id: string;
  usuario_id: string;
  inicio_sesion_reserva: { toDate: () => Date } | Date;
  estado: EstadoReserva;
}

const ESTADOS_PENDULO: EstadoPendulo[] = ["Activo", "Inactivo", "En_uso", "En_mantenimiento"];
const ROLES: Rol[] = ["Estudiante", "Docente", "Admin"];

function toDate(value: Reservacion["inicio_sesion_reserva"]): Date {
  if (value instanceof Date) return value;
  return value?.toDate?.() ?? new Date();
}

export default function DashboardAdminPage() {
  const { user, logout } = useAuth();

  const [pendulos, setPendulos] = useState<Pendulo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [savingPendulo, setSavingPendulo] = useState(false);
  const [editingPenduloId, setEditingPenduloId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pendulos" | "usuarios" | "reservas">("pendulos");

  const [nuevoPendulo, setNuevoPendulo] = useState({
    pendulo_id: "",
    institucion: "",
    pais: "",
    latitud: "",
    longitud: "",
    estado: "Activo" as EstadoPendulo,
  });

  const [penduloEdit, setPenduloEdit] = useState({
    institucion: "",
    pais: "",
    latitud: "",
    longitud: "",
  });

  useEffect(() => {
    const unsubPendulos = (escucharTodosPendulos as unknown as (cb: (data: Pendulo[]) => void) => () => void)((data) => {
      setPendulos(data);
    });

    const unsubUsuarios = (escucharUsuarios as unknown as (cb: (data: Usuario[]) => void) => () => void)((data) => {
      setUsuarios(data);
    });

    const unsubReservas = (escucharTodasReservaciones as unknown as (cb: (data: Reservacion[]) => void) => () => void)((data) => {
      setReservaciones(data);
    });

    return () => {
      unsubPendulos();
      unsubUsuarios();
      unsubReservas();
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const sesionesCompletadas = reservaciones.filter((r) => r.estado === "completed");
    const sesionesMes = sesionesCompletadas.filter((r) => {
      const d = toDate(r.inicio_sesion_reserva);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const counter = sesionesCompletadas.reduce((acc, r) => {
      acc[r.usuario_id] = (acc[r.usuario_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top = Object.entries(counter).sort((a, b) => b[1] - a[1])[0];
    const topUser = top ? usuarios.find((u) => u.uid === top[0]) : null;

    return {
      totalPendulos: pendulos.length,
      activos: pendulos.filter((p) => p.estado === "Activo").length,
      totalUsuarios: usuarios.length,
      totalSesiones: sesionesCompletadas.length,
      sesionesMes,
      usuarioMasActivo: topUser?.nombre || topUser?.email || "Sin datos",
    };
  }, [pendulos, usuarios, reservaciones]);

  const handleCrearPendulo = async () => {
    setError(null);
    if (!nuevoPendulo.pendulo_id || !nuevoPendulo.institucion || !nuevoPendulo.pais || !nuevoPendulo.latitud || !nuevoPendulo.longitud) {
      setError("Completa institución, país y coordenadas para crear el péndulo");
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
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado del péndulo");
    }
  };

  const startEditPendulo = (p: Pendulo) => {
    setEditingPenduloId(p.id);
    setPenduloEdit({
      institucion: p.institucion,
      pais: p.pais,
      latitud: p.latitud,
      longitud: p.longitud,
    });
  };

  const saveEditPendulo = async (penduloId: string) => {
    try {
      await actualizarPendulo(penduloId, penduloEdit);
      setEditingPenduloId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios del péndulo");
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
              <p className="text-xs text-muted-foreground">Gestión completa de la plataforma</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.nombre || user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/mapa">
                  <Globe className="w-4 h-4 mr-2" /> Ver mapa WPA
                </Link>
              </Button>
              <Button variant="destructive" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
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
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Sesiones</p><p className="text-2xl font-bold">{stats.totalSesiones}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Resumen de uso</CardTitle>
              <CardDescription>Métricas globales del sistema</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Total de sesiones completadas</p>
                <p className="text-2xl font-bold">{stats.totalSesiones}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Sesiones del mes</p>
                <p className="text-2xl font-bold">{stats.sesionesMes}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Usuario más activo</p>
                <p className="text-lg font-semibold truncate">{stats.usuarioMasActivo}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className={`cursor-pointer border ${activeTab === "pendulos" ? "border-primary" : "border-border"}`} onClick={() => setActiveTab("pendulos")}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Péndulos</CardTitle><CardDescription>Alta y edición de péndulos</CardDescription></CardHeader>
            </Card>
            <Card className={`cursor-pointer border ${activeTab === "usuarios" ? "border-primary" : "border-border"}`} onClick={() => setActiveTab("usuarios")}>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Gestión de usuarios</CardTitle><CardDescription>Roles y estado de cuentas</CardDescription></CardHeader>
            </Card>
            <Card className={`cursor-pointer border ${activeTab === "reservas" ? "border-primary" : "border-border"}`} onClick={() => setActiveTab("reservas")}>
              <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Todas reservaciones</CardTitle><CardDescription>Vista global de sesiones</CardDescription></CardHeader>
            </Card>
          </div>

          {activeTab === "pendulos" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" /> Gestión de péndulos de la red</CardTitle>
                  <CardDescription>Agregar nuevo péndulo con institución, país y coordenadas</CardDescription>
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
                  <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Péndulos registrados</CardTitle>
                  <CardDescription>Edita datos y estado. Los cambios se reflejan en el mapa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendulos.map((p) => {
                    const isEditing = editingPenduloId === p.id;
                    return (
                      <div key={p.id} className="rounded-lg border border-border p-3 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{p.pendulo_id}</p>
                            <p className="text-xs text-muted-foreground">{p.institucion} ({p.pais})</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{p.estado}</Badge>
                            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={p.estado} onChange={(e) => handleEstadoPendulo(p.id, e.target.value as EstadoPendulo)}>
                              {ESTADOS_PENDULO.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                            </select>
                            {!isEditing ? (
                              <Button size="sm" variant="outline" onClick={() => startEditPendulo(p)}>Editar</Button>
                            ) : (
                              <Button size="sm" onClick={() => saveEditPendulo(p.id)}><Save className="h-4 w-4 mr-1" /> Guardar</Button>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="grid md:grid-cols-4 gap-2">
                            <Input value={penduloEdit.institucion} onChange={(e) => setPenduloEdit({ ...penduloEdit, institucion: e.target.value })} placeholder="Institución" />
                            <Input value={penduloEdit.pais} onChange={(e) => setPenduloEdit({ ...penduloEdit, pais: e.target.value })} placeholder="País" />
                            <Input value={penduloEdit.latitud} onChange={(e) => setPenduloEdit({ ...penduloEdit, latitud: e.target.value })} placeholder="Latitud" />
                            <Input value={penduloEdit.longitud} onChange={(e) => setPenduloEdit({ ...penduloEdit, longitud: e.target.value })} placeholder="Longitud" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "usuarios" && (
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
          )}

          {activeTab === "reservas" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Todas las reservaciones</CardTitle>
                <CardDescription>Sesiones de toda la plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservaciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay reservaciones registradas</p>
                ) : (
                  reservaciones
                    .slice()
                    .sort((a, b) => toDate(b.inicio_sesion_reserva).getTime() - toDate(a.inicio_sesion_reserva).getTime())
                    .map((r) => (
                      <div key={r.id} className="rounded-lg border border-border p-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{usuarios.find((u) => u.uid === r.usuario_id)?.nombre || r.usuario_id}</p>
                            <p className="text-xs text-muted-foreground">{toDate(r.inicio_sesion_reserva).toLocaleString("es-ES")}</p>
                          </div>
                          <Badge variant="outline">{r.estado}</Badge>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
