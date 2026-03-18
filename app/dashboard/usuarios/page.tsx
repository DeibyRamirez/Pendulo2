"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  GraduationCap,
  UserCog,
  Mail,
  Calendar,
  Activity
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type UserRole = "admin" | "docente" | "estudiante"

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  institution: string
  experiments: number
  lastActive: string
  status: "active" | "inactive"
}

const users: User[] = [
  { id: 1, name: "María García", email: "maria.garcia@uac.edu.co", role: "docente", institution: "UAC", experiments: 45, lastActive: "Hace 2 horas", status: "active" },
  { id: 2, name: "Carlos López", email: "carlos.lopez@uniandes.edu.co", role: "estudiante", institution: "UNIANDES", experiments: 12, lastActive: "Hace 1 día", status: "active" },
  { id: 3, name: "Ana Martínez", email: "ana.martinez@uac.edu.co", role: "admin", institution: "UAC", experiments: 78, lastActive: "Hace 5 minutos", status: "active" },
  { id: 4, name: "Diego Sánchez", email: "diego.sanchez@uniandes.edu.co", role: "estudiante", institution: "UNIANDES", experiments: 8, lastActive: "Hace 3 días", status: "inactive" },
  { id: 5, name: "Laura Rodríguez", email: "laura.rodriguez@uac.edu.co", role: "estudiante", institution: "UAC", experiments: 23, lastActive: "Hace 6 horas", status: "active" },
  { id: 6, name: "Juan Pérez", email: "juan.perez@uac.edu.co", role: "docente", institution: "UAC", experiments: 56, lastActive: "Hace 1 hora", status: "active" },
]

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  admin: { label: "Administrador", icon: Shield, color: "text-chart-5", bgColor: "bg-chart-5/10" },
  docente: { label: "Docente", icon: UserCog, color: "text-chart-1", bgColor: "bg-chart-1/10" },
  estudiante: { label: "Estudiante", icon: GraduationCap, color: "text-chart-2", bgColor: "bg-chart-2/10" },
}

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all")

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    docentes: users.filter(u => u.role === "docente").length,
    estudiantes: users.filter(u => u.role === "estudiante").length,
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios y sus permisos en la plataforma</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${roleConfig.admin.bgColor}`}>
                <Shield className={`h-6 w-6 ${roleConfig.admin.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Docentes</p>
                <p className="text-2xl font-bold text-foreground">{stats.docentes}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${roleConfig.docente.bgColor}`}>
                <UserCog className={`h-6 w-6 ${roleConfig.docente.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estudiantes</p>
                <p className="text-2xl font-bold text-foreground">{stats.estudiantes}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${roleConfig.estudiante.bgColor}`}>
                <GraduationCap className={`h-6 w-6 ${roleConfig.estudiante.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "admin", "docente", "estudiante"] as const).map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                >
                  {role === "all" ? "Todos" : roleConfig[role].label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? "s" : ""} encontrado{filteredUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rol</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Institución</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Experimentos</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Última actividad</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const role = roleConfig[user.role]
                  const RoleIcon = role.icon
                  
                  return (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.bgColor} ${role.color}`}>
                          <RoleIcon className="h-3 w-3" />
                          {role.label}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">{user.institution}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{user.experiments}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {user.lastActive}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                            <DropdownMenuItem>Editar usuario</DropdownMenuItem>
                            <DropdownMenuItem>Ver experimentos</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Desactivar cuenta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
