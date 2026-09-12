"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react"
import {
  confirmarNuevaContrasena,
  enviarCorreoRecuperacion,
  verificarCodigoRecuperacion,
} from "@/app/services/authService"

function traducirErrorRecuperacion(codigo: string, respaldo?: string) {
  const errores: Record<string, string> = {
    "auth/invalid-email": "El formato del correo no es válido.",
    "auth/missing-email": "El correo es obligatorio.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    "auth/network-request-failed": "Error de red. Verifica tu conexión a internet.",
    "auth/expired-action-code": "El enlace expiró. Solicita uno nuevo.",
    "auth/invalid-action-code": "El enlace no es válido o ya se usó. Solicita uno nuevo.",
    "auth/weak-password": "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
  }
  return errores[codigo] || respaldo || "No se pudo completar la recuperación. Intenta de nuevo."
}

export default function PaginaRecuperarContrasena() {
  const router = useRouter()
  const [correo, setCorreo] = useState("")
  const [codigo, setCodigo] = useState("")
  const [nuevaContrasena, setNuevaContrasena] = useState("")
  const [confirmarContrasena, setConfirmarContrasena] = useState("")
  const [mostrarClave, setMostrarClave] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [correoDestino, setCorreoDestino] = useState("")
  const [claveActualizada, setClaveActualizada] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const correoParam = params.get("correo") || params.get("email") || ""
    const oobCode = params.get("oobCode") || ""
    if (correoParam) setCorreo(correoParam)
    if (oobCode) {
      setCodigo(oobCode)
      verificarCodigoRecuperacion(oobCode).catch((err) => {
        setError(traducirErrorRecuperacion(err?.code, err?.message))
      })
    }
  }, [])

  async function alEnviarCorreo(evento: FormEvent) {
    evento.preventDefault()
    setError("")
    setEnviando(true)
    try {
      await enviarCorreoRecuperacion(correo)
      setCorreoDestino(correo.trim())
      setEnviado(true)
    } catch (err) {
      const authError = err as { code?: string; message?: string }
      setError(traducirErrorRecuperacion(authError.code || "", authError.message))
    } finally {
      setEnviando(false)
    }
  }

  async function alGuardarContrasena(evento: FormEvent) {
    evento.preventDefault()
    setError("")
    if (nuevaContrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden.")
      return
    }
    setEnviando(true)
    try {
      await confirmarNuevaContrasena(codigo, nuevaContrasena)
      setClaveActualizada(true)
    } catch (err) {
      const authError = err as { code?: string; message?: string }
      setError(traducirErrorRecuperacion(authError.code || "", authError.message))
    } finally {
      setEnviando(false)
    }
  }

  const modoNuevaClave = Boolean(codigo)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
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
            <CardTitle className="text-2xl">
              {claveActualizada
                ? "Contraseña actualizada"
                : enviado
                  ? "Revisa tu correo"
                  : modoNuevaClave
                    ? "Nueva contraseña"
                    : "Recuperar contraseña"}
            </CardTitle>
            <CardDescription>
              {claveActualizada
                ? "Ya puedes iniciar sesión con tu nueva clave."
                : enviado
                  ? `Si existe una cuenta con ${correoDestino}, recibirás un enlace para restablecerla.`
                  : modoNuevaClave
                    ? "Elige una contraseña de al menos 8 caracteres."
                    : "Te enviaremos un enlace al correo con el que te registraste."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            ) : null}

            {claveActualizada ? (
              <Button className="w-full" onClick={() => router.push("/login")}>
                Ir a iniciar sesión
              </Button>
            ) : enviado ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                  <MailCheck className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Revisa también la carpeta de spam. El enlace caduca en un rato. Si te registraste con Google, entra con
                  Google Institucional.
                </p>
                <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
                  Volver al inicio de sesión
                </Button>
              </div>
            ) : modoNuevaClave ? (
              <form onSubmit={alGuardarContrasena} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nueva-contrasena">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="nueva-contrasena"
                      type={mostrarClave ? "text" : "password"}
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      className="bg-input/50 pr-10"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarClave(!mostrarClave)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {mostrarClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-contrasena">Confirmar contraseña</Label>
                  <Input
                    id="confirmar-contrasena"
                    type={mostrarClave ? "text" : "password"}
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                    className="bg-input/50"
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar contraseña"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={alEnviarCorreo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="correo-recuperacion">Correo electrónico</Label>
                  <Input
                    id="correo-recuperacion"
                    type="email"
                    placeholder="usuario@uniautonoma.edu.co"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className="bg-input/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Si tu cuenta es solo de Google, usa el botón Google Institucional en el login.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              ¿La recordaste?{" "}
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
