"use client"

import { useState } from "react"
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
  User,
  CheckCircle,
  XCircle,
  Info,
  Download,
  FileSpreadsheet
} from "lucide-react"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
]

// Simulated booked slots
const bookedSlots: Record<string, string[]> = {
  "2026-3-17": ["09:00", "10:00", "14:30"],
  "2026-3-18": ["08:30", "11:00", "15:00", "16:00"],
  "2026-3-19": ["09:30", "10:30"],
  "2026-3-20": ["14:00", "14:30", "15:00"],
}

export default function ReservasPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 17)) // March 17, 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 2, 17))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate)

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date(2026, 2, 17)
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    )
  }

  const getDateKey = (day: number) => {
    return `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`
  }

  const isSlotBooked = (time: string) => {
    if (!selectedDate) return false
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`
    return bookedSlots[dateKey]?.includes(time) || false
  }

  const handleReservation = () => {
    if (selectedDate && selectedTime) {
      setShowConfirmation(true)
    }
  }

  // Función para exportar reservas a CSV (RF-14)
  const exportToCSV = () => {
    const reservasData = [
      { usuario: "Juan Pérez", institucion: "UAC", fecha: "2026-03-18", hora: "10:00", duracion: "30 min", pendulo: "UAC-01" },
      { usuario: "María García", institucion: "UNIANDES", fecha: "2026-03-18", hora: "11:00", duracion: "30 min", pendulo: "UAC-01" },
      { usuario: "Carlos López", institucion: "UAC", fecha: "2026-03-19", hora: "09:30", duracion: "30 min", pendulo: "UAC-01" },
      { usuario: "Ana Martínez", institucion: "UPC Barcelona", fecha: "2026-03-20", hora: "14:00", duracion: "30 min", pendulo: "UAC-01" },
    ]
    
    const headers = ["Usuario", "Institución", "Fecha", "Hora", "Duración", "Péndulo"]
    const csvContent = [
      headers.join(","),
      ...reservasData.map(r => `${r.usuario},${r.institucion},${r.fecha},${r.hora},${r.duracion},${r.pendulo}`)
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `reservas_pendulo_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const formatSelectedDate = () => {
    if (!selectedDate) return ""
    return `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`
  }

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
            {/* Botón de exportar CSV - RF-14 (solo Docentes/Admin) */}
            <Button variant="outline" onClick={exportToCSV} className="self-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Calendar */}
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
                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before the first day of month */}
                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const dateKey = getDateKey(day)
                    const hasBookings = bookedSlots[dateKey]?.length > 0
                    
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-colors
                          flex flex-col items-center justify-center gap-0.5
                          ${isDateSelected(day) 
                            ? "bg-primary text-primary-foreground" 
                            : isToday(day)
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted"
                          }
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

                {/* Legend */}
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

            {/* Time slots panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Horarios Disponibles
                  </CardTitle>
                  <CardDescription>
                    {selectedDate 
                      ? formatSelectedDate()
                      : "Selecciona una fecha en el calendario"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((time) => {
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
                                  : "bg-muted/50 hover:bg-muted text-foreground"
                              }
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

              {/* Reservation summary */}
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
                      <span className="font-medium">Péndulo UAC-01</span>
                    </div>
                    <Button className="w-full mt-4" onClick={handleReservation}>
                      Confirmar Reserva
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Info card */}
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

          {/* My reservations */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Mis Reservas</CardTitle>
              <CardDescription>Tus próximas sesiones programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "18 de Marzo, 2026", time: "10:00 - 10:30", status: "confirmed" },
                  { date: "20 de Marzo, 2026", time: "14:00 - 14:30", status: "pending" },
                ].map((reservation, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{reservation.date}</p>
                        <p className="text-sm text-muted-foreground">{reservation.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                        {reservation.status === "confirmed" ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Confirmada</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                        )}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation modal */}
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
