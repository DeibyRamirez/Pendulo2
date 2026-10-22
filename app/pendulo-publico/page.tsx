"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, QrCode } from "lucide-react";
import Link from "next/link";
import { IconoPendulo } from "@/components/IconoPendulo";
import { NOMBRE_PROYECTO, SIGLA_PROYECTO } from "@/lib/marca";
import { PENDULO_PRINCIPAL_ID } from "@/lib/constantes";
import { VistaPublicaPendulo } from "@/components/vista-publica-pendulo";
import { QRCodeSVG } from "qrcode.react";

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
const qrUrl = `${baseUrl}/pendulo-publico`;

export default function PublicPendulumPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <IconoPendulo className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{SIGLA_PROYECTO}</h1>
              <p className="text-xs text-muted-foreground">{NOMBRE_PROYECTO}</p>
            </div>
          </Link>

          <Link href="/login">
            <Button>
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Péndulo remoto — {PENDULO_PRINCIPAL_ID}
          </h1>
          <p className="text-lg text-muted-foreground">
            Telemetría en tiempo real desde Firestore, sin iniciar sesión
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <VistaPublicaPendulo catalogId={PENDULO_PRINCIPAL_ID} />
          </div>

          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Código QR
                </CardTitle>
                <CardDescription>Escanea para acceder a esta página</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="rounded-lg border border-border bg-background p-4 mb-4">
                  <QRCodeSVG value={qrUrl} size={160} level="M" />
                </div>
                <p className="text-xs text-muted-foreground text-center break-all mb-4">{qrUrl}</p>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <a href={qrUrl} download={`qr-${PENDULO_PRINCIPAL_ID}.png`}>
                    Abrir enlace
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Acceso completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Inicia sesión para agendar sesiones, ver historial y más datos detallados.
                </p>
                <Link href="/login" className="w-full block">
                  <Button className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar sesión
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">¿Nuevo usuario?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea una cuenta para agendar sesiones y acceder a datos históricos de experimentos.
                </p>
                <Link href="/registro" className="w-full block">
                  <Button variant="outline" className="w-full">
                    Crear cuenta
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
