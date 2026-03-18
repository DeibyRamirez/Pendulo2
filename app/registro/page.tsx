"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { registrarUsuario } from "@/app/services/authService"

const INSTITUCIONES = [
  { value: "uac", label: "Corporación Universitaria Autónoma del Cauca" },
  { value: "uniandes", label: "Universidad de los Andes" },
  { value: "unal", label: "Universidad Nacional de Colombia" },
  { value: "upc", label: "Universitat Politècnica de Catalunya" },
  { value: "mit", label: "Massachusetts Institute of Technology" },
  { value: "otra", label: "Otra institución de la red WPA" }
]

export default function RegistroPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    institucion: "",
    rol: "",
    password: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nombre) newErrors.nombre = "El nombre es requerido"
    if (!formData.email) newErrors.email = "El correo es requerido"
    else if (!formData.email.includes("@")) newErrors.email = "Correo inválido"
    if (!formData.institucion) newErrors.institucion = "Selecciona una institución"
    if (!formData.rol) newErrors.rol = "Selecciona un rol"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.password) newErrors.password = "La contraseña es requerida"
    else if (formData.password.length < 8) newErrors.password = "Mínimo 8 caracteres"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
     if (!validateStep2()) return

     setIsLoading(true)

     try {
       // Registro real con Firebase Auth
       await registrarUsuario(formData.email, formData.password, formData.nombre, formData.rol)
       setStep(3)
     } catch (error: any) {
       // Manejar errores de Firebase
       console.error('Error en el registro:', error)
       // Puedes mostrar el error al usuario aquí si lo deseas
       alert('Error al crear la cuenta: ' + (error.message || 'Error desconocido'))
     } finally {
       setIsLoading(false)
     }
   }

  const passwordStrength = () => {
    const { password } = formData
    if (!password) return { strength: 0, label: "", color: "" }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    const labels = ["", "Débil", "Regular", "Buena", "Fuerte"]
    const colors = ["", "bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-green-500"]
    
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const { strength, label: strengthLabel, color: strengthColor } = passwordStrength()

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Registro Exitoso!</h2>
            <p className="text-muted-foreground mb-6">
              Tu cuenta ha sido creada. Hemos enviado un correo de verificación a <strong>{formData.email}</strong>
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="4" r="2" />
                <line x1="12" y1="6" x2="12" y2="16" />
                <circle cx="12" cy="18" r="3" fill="currentColor" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">WPA</h1>
              <p className="text-xs text-muted-foreground">World Pendulum Alliance</p>
            </div>
          </Link>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>
              {step === 1 ? "Ingresa tus datos personales" : "Crea una contraseña segura"}
            </CardDescription>
            {/* Progress indicator */}
            <div className="flex gap-2 justify-center mt-4">
              <div className={`h-1 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-1 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      placeholder="Juan Pérez"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={`bg-input/50 ${errors.nombre ? "border-destructive" : ""}`}
                    />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Institucional</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@uniautonoma.edu.co"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`bg-input/50 ${errors.email ? "border-destructive" : ""}`}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institucion">Institución</Label>
                    <Select
                      value={formData.institucion}
                      onValueChange={(value) => setFormData({ ...formData, institucion: value })}
                    >
                      <SelectTrigger className={`bg-input/50 ${errors.institucion ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Selecciona tu institución" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTITUCIONES.map((inst) => (
                          <SelectItem key={inst.value} value={inst.value}>
                            {inst.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.institucion && <p className="text-xs text-destructive">{errors.institucion}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol</Label>
                    <Select
                      value={formData.rol}
                      onValueChange={(value) => setFormData({ ...formData, rol: value })}
                    >
                      <SelectTrigger className={`bg-input/50 ${errors.rol ? "border-destructive" : ""}`}>
                        <SelectValue placeholder="Selecciona tu rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="estudiante">Estudiante</SelectItem>
                        <SelectItem value="docente">Docente</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.rol && <p className="text-xs text-destructive">{errors.rol}</p>}
                  </div>

                  <Button type="submit" className="w-full">
                    Continuar
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`bg-input/50 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : "bg-muted"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Fortaleza: <span className={strength >= 3 ? "text-green-500" : strength >= 2 ? "text-yellow-500" : "text-destructive"}>{strengthLabel}</span>
                        </p>
                      </div>
                    )}
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`bg-input/50 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Atrás
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        "Crear Cuenta"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
