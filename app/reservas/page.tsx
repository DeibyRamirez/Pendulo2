"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import {
  crearReservacion,
  cancelarReservacion,
  escucharReservacionesUsuario,
} from "@/app/services/reservacionService"
import type { Timestamp } from "firebase/firestore"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
]
const PENDULO_ID = "UAC-01"

interface Reservacion {
  id: string
  usuario_id: string
  inicio_sesion_reserva: Timestamp
  final_sesion_reserva: Timestamp
  estado: "pending" | "active" | "completed" | "cancelled"
  institucion: string
  pendulo_id: string
}

function toDate(value: Timestamp | Date): Date {
  if (value instanceof Date) return value
  return value?.toDate?.() ?? new Date()
}

function buildBookedSlots(reservaciones: Reservacion[]): Record<string, string[]> {
  const slots: Record<string, string[]> = {}
  reservaciones
    .filter((r) => r.estado === "pending" || r.estado === "active")
    .forEach((r) => {
      const inicio = toDate(r.inicio_sesion_reserva)
      const key = `${inicio.getFullYear()}-${inicio.getMonth() + 1}-${inicio.getDate()}`
      const timeStr = inicio.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      if (!slots[key]) slots[key] = []
      slots[key].push(timeStr)
    })
  return slots
}

export default function ReservasPage() {
  const { user } = useAuth()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = escucharReservacionesUsuario(user.uid, (data: Reservacion[]) => {
      setReservaciones(data)
    })
    return () => unsub()
  }, [user?.uid])

  const bookedSlots = buildBookedSlots(reservaciones)

  const getDaysInMonth = (date: Date) => ({
    firstDay: new Date(date.getFullYear(), date.getMonth(), 1).getDay(),
    daysInMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
  })
  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)

  const prevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const isDateSelected = (day: number) =>
    !!selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === currentDate.getMonth() &&
    selectedDate.getFullYear() === currentDate.getFullYear()

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const getDateKey = (day: number) =>
    `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`

  const isSlotBooked = (time: string) => {
    if (!selectedDate) return false
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`
    return bookedSlots[key]?.includes(time) || false
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ""
    return `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`
  }

  const handleReservation = async () => {
    if (!selectedDate || !selectedTime || !user) return
    setError(null)
    setLoading(true)
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const inicio = new Date(selectedDate)
      inicio.setHours(hours, minutes, 0, 0)
      const fin = new Date(inicio)
      fin.setMinutes(fin.getMinutes() + 30)

      await crearReservacion({
        usuario_id: user.uid,
        inicio_sesion_reserva: inicio,
        final_sesion_reserva: fin,
        estado: "pending",
        institucion: user.institucion ?? "Sin institución",
        pendulo_id: PENDULO_ID,
      })

      setShowConfirmation(true)
      setSelectedTime(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear la reservación")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async (id: string) => {
    setCancellingId(id)
    try {
      await cancelarReservacion(id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cancelar la reservación")
    } finally {
      setCancellingId(null)
    }
  }

  const exportToCSV = () => {
    const activas = reservaciones.filter(
      (r) => r.estado === "pending" || r.estado === "active"
    )
    if (activas.length === 0) {
      alert("No hay reservaciones activas para exportar")
      return
    }
    const headers = ["Fecha Inicio", "Fecha Fin", "Péndulo", "Institución", "Estado"]
    const rows = activas.map((r) => [
      toDate(r.inicio_sesion_reserva).toLocaleString("es-ES"),
      toDate(r.final_sesion_reserva).toLocaleString("es-ES"),
      r.pendulo_id,
      r.institucion,
      r.estado,
    ])
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((c) => `"${c}"`).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `reservas_pendulo_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const misReservasActivas = reservaciones
    .filter((r) => r.estado === "pending" || r.estado === "active")
    .sort(
      (a, b) =>
        toDate(a.inicio_sesion_reserva).getTime() -
        toDate(b.inicio_sesion_reserva).getTime()
    )

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reservar Sesión</h1>
              <p className="text-muted-foreground mt-2">
                Selecciona una fecha y hora para tu sesión experimental con el péndulo físico
              </p>
            </div>
            <Button variant="outline" onClick={exportToCSV} className="self-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
              <button className="ml-auto text-xs underline" onClick={() => setError(null)}>
                Cerrar
              </button>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">

            {/* Calendario */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Calendario de Reservas
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[140px] text-center">
                      {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const dateKey = getDateKey(day)
                    const hasBookings = (bookedSlots[dateKey]?.length ?? 0) > 0
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                          setSelectedTime(null)
                          setError(null)
                        }}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-colors
                          flex flex-col items-center justify-center gap-0.5
                          ${isDateSelected(day)
                            ? "bg-primary text-primary-foreground"
                            : isToday(day)
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-muted"}
                        `}
                      >
                        {day}
                        {hasBookings && !isDateSelected(day) && (
                          <span className="h-1 w-1 rounded-full bg-chart-4" />
                        )}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-primary" />
                    <span className="text-muted-foreground">Seleccionado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-primary/20" />
                    <span className="text-muted-foreground">Hoy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
                    <span className="text-muted-foreground">Con reservas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel derecho */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Horarios Disponibles
                  </CardTitle>
                  <CardDescription>
                    {selectedDate ? formatSelectedDate() : "Selecciona una fecha en el calendario"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((time) => {
                        const booked = isSlotBooked(time)
                        const selected = selectedTime === time
                        return (
                          <button
                            key={time}
                            disabled={booked}
                            onClick={() => setSelectedTime(time)}
                            className={`
                              py-2 px-3 rounded-lg text-sm font-medium transition-colors
                              ${booked
                                ? "bg-muted text-muted-foreground cursor-not-allowed line-through opacity-50"
                                : selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 hover:bg-muted text-foreground"}
                            `}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona una fecha para ver los horarios disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedDate && selectedTime && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen de Reserva</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Fecha</span>
                      <span className="font-medium">{formatSelectedDate()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Hora</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Duración</span>
                      <span className="font-medium">30 minutos</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Equipo</span>
                      <span className="font-medium">Péndulo {PENDULO_ID}</span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={handleReservation}
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</>
                      ) : (
                        "Confirmar Reserva"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Información importante</p>
                      <ul className="space-y-1">
                        <li>Cada sesión tiene una duración de 30 minutos</li>
                        <li>Puedes cancelar hasta 2 horas antes</li>
                        <li>El acceso remoto se habilita 5 minutos antes</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mis Reservas */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Mis Reservas</CardTitle>
              <CardDescription>Tus próximas sesiones programadas</CardDescription>
            </CardHeader>
            <CardContent>
              {misReservasActivas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tienes reservas activas. ¡Selecciona una fecha y hora para comenzar!
                </p>
              ) : (
                <div className="space-y-4">
                  {misReservasActivas.map((r) => {
                    const inicio = toDate(r.inicio_sesion_reserva)
                    const fin = toDate(r.final_sesion_reserva)
                    return (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {inicio.getDate()} de {MONTHS[inicio.getMonth()]}, {inicio.getFullYear()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {inicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}
                              {" – "}
                              {fin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={r.estado === "active" ? "default" : "secondary"}>
                            {r.estado === "active" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" /> Activa</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancellingId === r.id}
                            onClick={() => handleCancelar(r.id)}
                          >
                            {cancellingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><XCircle className="h-4 w-4 mr-1" /> Cancelar</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-3/20 mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Reserva Confirmada</h3>
              <p className="text-muted-foreground mb-6">
                Tu sesión ha sido reservada para el {formatSelectedDate()} a las {selectedTime}
              </p>
              <Button className="w-full" onClick={() => setShowConfirmation(false)}>
                Entendido
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </main>
  )
}