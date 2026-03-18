"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Settings,
  Bell,
  Shield,
  Wifi,
  Database,
  Mail,
  Smartphone
} from "lucide-react"

export default function ConfiguracionPage() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra las preferencias del sistema y tu cuenta</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Notificaciones por correo</Label>
                <p className="text-sm text-muted-foreground">Recibe alertas de tus reservas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Recordatorios de sesión</Label>
                <p className="text-sm text-muted-foreground">15 minutos antes de cada experimento</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Resumen semanal</Label>
                <p className="text-sm text-muted-foreground">Estadísticas de uso cada lunes</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cuenta y Seguridad
            </CardTitle>
            <CardDescription>Gestiona tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" defaultValue="usuario@uac.edu.co" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institución</Label>
              <Input id="institution" defaultValue="Corporación Universitaria Autónoma del Cauca" disabled />
            </div>
            <Button variant="outline" className="w-full mt-4">
              Cambiar contraseña
            </Button>
          </CardContent>
        </Card>

        {/* Hardware Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              Estado del Hardware
            </CardTitle>
            <CardDescription>Conexión con el péndulo físico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-chart-3 animate-pulse" />
                <span className="text-sm font-medium">Raspberry Pi</span>
              </div>
              <span className="text-sm text-chart-3">Conectado</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <span className="text-sm font-medium">Sensores</span>
              </div>
              <span className="text-sm text-chart-3">Operativos</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <span className="text-sm font-medium">Frecuencia de muestreo</span>
              </div>
              <span className="text-sm text-foreground font-mono">10 Hz</span>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Base de Datos
            </CardTitle>
            <CardDescription>Estado de Firebase y almacenamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <span className="text-sm font-medium">Firebase Realtime</span>
              </div>
              <span className="text-sm text-chart-3">Sincronizado</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Almacenamiento usado</span>
                <span className="text-foreground">2.4 GB / 10 GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[24%] bg-primary rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experimentos almacenados</span>
                <span className="text-foreground">1,247</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Integraciones
            </CardTitle>
            <CardDescription>Conexiones con otros servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10">
                    <Mail className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email SMTP</p>
                    <p className="text-xs text-chart-3">Configurado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">Configurar</Button>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                    <Database className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Firebase</p>
                    <p className="text-xs text-chart-3">Conectado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">Configurar</Button>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">App Móvil</p>
                    <p className="text-xs text-muted-foreground">No configurado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">Conectar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
