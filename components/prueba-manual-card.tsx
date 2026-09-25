"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, FileDown, Loader2, Play, Square } from "lucide-react";
import { escucharPenduloEnVivo } from "@/app/services/penduloDataService";
import {
  hayControlAjenoVigente,
  iniciarPruebaManual,
  finalizarPruebaManual,
} from "@/app/services/reservacionService";
import { exportarLecturasUsuario } from "@/app/services/lecturasExportService";
import type { Timestamp } from "firebase/firestore";

const PENDULO_PREDETERMINADO = "UAC-01";

interface LoopManualState {
  activo?: boolean;
  intervaloMinutos?: number;
  oscilaciones?: number;
  distanciaMuro?: number;
  estado?: string;
  cicloActual?: number;
  ultimoCicloInicio?: Timestamp | null;
  ultimoCicloFin?: Timestamp | null;
  proximoCicloEn?: Timestamp | null;
  ultimoError?: string | null;
  muestrasUltimoCiclo?: number;
}

interface EnVivoDoc {
  usuarioActivo?: string | null;
  practicaId?: string | null;
  modoManual?: boolean | null;
  loopManual?: LoopManualState | null;
  muestras?: number | null;
  muestra?: number | null;
  estado?: string | null;
  estadoDispositivo?: string | null;
}

interface PruebaManualCardProps {
  penduloId?: string;
}

const ESTADO_LOOP_LABEL: Record<string, string> = {
  iniciando: "Iniciando loop automático",
  conectando: "Verificando conexión MQTT",
  enviando: "Enviando comando cfg 15/15",
  midiendo: "Medición en curso",
  esperando: "Esperando próximo ciclo (15 min)",
  error: "Error en el último ciclo",
  detenido: "Loop detenido",
};

function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleString("es-ES");
}

export function PruebaManualCard({ penduloId = PENDULO_PREDETERMINADO }: PruebaManualCardProps) {
  const { user } = useAuth();
  const [enVivo, setEnVivo] = useState<EnVivoDoc | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");
  const [practicaIdSesion, setPracticaIdSesion] = useState<string | null>(null);

  useEffect(() => {
    const unsub = escucharPenduloEnVivo(
      penduloId,
      (data) => setEnVivo(data as EnVivoDoc | null),
      () => setEnVivo(null),
    );
    return () => unsub();
  }, [penduloId]);

  const capturaActiva =
    !!user?.uid &&
    enVivo?.modoManual === true &&
    enVivo?.usuarioActivo === user.uid;

  const loop = enVivo?.loopManual;
  const loopActivo = capturaActiva && loop?.activo === true;

  const ocupadoPorOtro = hayControlAjenoVigente(enVivo, user?.uid);

  const practicaIdExport =
    practicaIdSesion || (capturaActiva ? enVivo?.practicaId ?? null : null);

  const contadorMuestras =
    typeof enVivo?.muestras === "number"
      ? enVivo.muestras
      : typeof enVivo?.muestra === "number"
        ? enVivo.muestra
        : null;

  const estadoLoopLabel = loop?.estado
    ? ESTADO_LOOP_LABEL[loop.estado] ?? loop.estado
    : null;

  async function alIniciar() {
    if (!user?.uid || ocupadoPorOtro) return;
    setError("");
    setProcesando(true);
    try {
      const { practicaId } = await iniciarPruebaManual({
        penduloId,
        usuarioId: user.uid,
      });
      setPracticaIdSesion(practicaId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar la prueba manual");
    } finally {
      setProcesando(false);
    }
  }

  async function alFinalizar() {
    if (!user?.uid) return;
    setError("");
    setProcesando(true);
    try {
      await finalizarPruebaManual({ penduloId, usuarioId: user.uid });
      setPracticaIdSesion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar la prueba manual");
    } finally {
      setProcesando(false);
    }
  }

  async function alExportarSesion() {
    if (!user?.uid || !practicaIdExport) return;
    setError("");
    setExportando(true);
    try {
      await exportarLecturasUsuario(penduloId, user.uid, practicaIdExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo exportar la sesión");
    } finally {
      setExportando(false);
    }
  }

  return (
    <Card className="border-border/50 hover:border-primary/50 transition-colors md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <FlaskConical className="w-5 h-5 text-primary" />
          Prueba manual / calibración
          {capturaActiva ? (
            <Badge className="bg-emerald-600 hover:bg-emerald-600">Captura activa</Badge>
          ) : null}
          {loopActivo ? (
            <Badge variant="secondary">Loop automático</Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Al iniciar, el bridge en la Raspberry Pi ejecuta ciclos automáticos (cfg 15 cm / 15
          oscilaciones) cada 15 minutos tras cada medición, guarda todas las muestras en Firestore
          y permite exportarlas en Excel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
          <li>
            Pulse <strong className="text-foreground">Iniciar prueba manual</strong> (Captura activa
            + Loop automático).
          </li>
          <li>
            El bridge envía <code className="text-xs">cfg 15/15</code> vía MQTT; Node-RED traduce a
            serial. No hace falta programar el bucle en Node-RED.
          </li>
          <li>Cada ciclo validado espera 15 min y repite hasta que pulse Finalizar.</li>
          <li>Exporte desde aquí, desde <Link href="/historial" className="text-primary underline">Historial</Link> o Excel de muestras.</li>
        </ol>

        {ocupadoPorOtro ? (
          <p className="text-sm text-destructive">
            Ocupado: otro usuario tiene el control del péndulo. Espere a que finalice su sesión.
          </p>
        ) : null}

        {capturaActiva ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm space-y-2">
            <p className="font-medium text-foreground">Sesión: {enVivo?.practicaId ?? practicaIdSesion}</p>
            {loopActivo && estadoLoopLabel ? (
              <p className="text-foreground">
                Estado del loop: <strong>{estadoLoopLabel}</strong>
              </p>
            ) : null}
            {loopActivo && typeof loop?.cicloActual === "number" && loop.cicloActual > 0 ? (
              <p className="text-muted-foreground">Ciclo actual: {loop.cicloActual}</p>
            ) : null}
            {loopActivo && loop?.proximoCicloEn ? (
              <p className="text-muted-foreground">
                Próximo ciclo: {formatTimestamp(loop.proximoCicloEn)}
              </p>
            ) : null}
            {loop?.ultimoError ? (
              <p className="text-destructive">Último error: {loop.ultimoError}</p>
            ) : null}
            {typeof loop?.muestrasUltimoCiclo === "number" && loop.muestrasUltimoCiclo > 0 ? (
              <p className="text-muted-foreground">
                Muestras último ciclo: {loop.muestrasUltimoCiclo}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {contadorMuestras != null
                ? `Última muestra en vivo: #${contadorMuestras}`
                : "Esperando muestras del péndulo…"}
              {enVivo?.estadoDispositivo ? ` · Dispositivo: ${enVivo.estadoDispositivo}` : ""}
              {enVivo?.estado ? ` · Práctica: ${enVivo.estado}` : ""}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          {!capturaActiva ? (
            <Button
              onClick={() => void alIniciar()}
              disabled={procesando || ocupadoPorOtro || !user?.uid}
            >
              {procesando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Iniciar prueba manual
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => void alFinalizar()} disabled={procesando}>
              {procesando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Finalizar prueba manual
            </Button>
          )}

          {practicaIdExport ? (
            <Button variant="outline" onClick={() => void alExportarSesion()} disabled={exportando}>
              {exportando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Exportar esta sesión
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <p className="text-xs text-muted-foreground">
          Requiere bridge actualizado en la Pi y Node-RED con <code>mqtt in</code> en{" "}
          <code>pendulo/comando</code> (ver docs/modo-prueba-manual.md).
        </p>
      </CardContent>
    </Card>
  );
}
