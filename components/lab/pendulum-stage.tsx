'use client'

import { useRef } from 'react'
import { usePendulum, type PendulumMotion } from '@/hooks/usePendulum'
import { Corners } from '@/components/lab/corners'
import { GridBg } from '@/components/lab/grid-bg'
import { Readout } from '@/components/lab/readout'
import { StatusChip } from '@/components/lab/status-chip'

export type SignalMode = 'demo' | 'en_vivo' | 'sin_senal' | 'pausado'

const chip: Record<SignalMode, { tone: 'ok' | 'demo' | 'error' | 'pause'; label: string; note: string }> = {
  en_vivo: {
    tone: 'ok',
    label: 'EN VIVO · LABORATORIO UAC',
    note: 'Telemetría del péndulo físico · temperatura, período, oscilaciones y gravedad',
  },
  demo: {
    tone: 'demo',
    label: 'DEMO',
    note: 'Demostración · un modelo para ángulo, velocidad y período',
  },
  sin_senal: {
    tone: 'error',
    label: 'SIN SEÑAL',
    note: 'Sin telemetría reciente del laboratorio',
  },
  pausado: {
    tone: 'pause',
    label: 'PAUSADO',
    note: 'Movimiento reducido · péndulo fijo en θ₀',
  },
}

function formatSigned(value: number, digits: number) {
  const text = Math.abs(value).toFixed(digits)
  if (value < 0) return `−${text}`
  return text
}

function Sparkline({ samples }: { samples: number[] }) {
  const width = 320
  const height = 64
  const min = -20
  const max = 20
  const points =
    samples.length > 1
      ? samples
          .map((value, index) => {
            const x = (index / (samples.length - 1)) * width
            const y = height - ((value - min) / (max - min)) * (height - 4) - 2
            return `${x.toFixed(1)},${y.toFixed(1)}`
          })
          .join(' ')
      : ''

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" role="img" aria-label="Sparkline de θ(t) en los últimos 6 segundos">
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgb(247 245 241 / .18)" strokeWidth="1" />
      {points ? (
        <polyline fill="none" stroke="var(--color-naranja)" strokeWidth="1.5" points={points} />
      ) : null}
    </svg>
  )
}

export type TelemetriaEnVivoStage = {
  temperatura?: number
  periodo?: number
  muestras?: number
  maxMuestras?: number
  gravedad?: number
}

function formatLive(value: number | undefined, digits: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '— —'
  return value.toFixed(digits)
}

export function PendulumStage({
  signal,
  period,
  telemetriaEnVivo,
}: {
  signal: SignalMode
  period?: number
  telemetriaEnVivo?: TelemetriaEnVivoStage
}) {
  const armRef = useRef<HTMLDivElement>(null)
  const motion: PendulumMotion = signal === 'sin_senal' ? 'off' : signal === 'pausado' ? 'still' : 'run'
  const frame = usePendulum(period, motion, armRef)
  const meta = chip[signal]
  const silent = signal === 'sin_senal'
  const angle = silent ? '— —' : formatSigned(frame.theta, 1)
  const speed = silent ? '— —' : formatSigned(frame.velocity, 2)
  const periodText = silent ? '— —' : frame.period.toFixed(2)
  const liveReadouts = signal === 'en_vivo' && telemetriaEnVivo

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-[var(--color-naranja)] opacity-[.18] blur-[40px]"
      />
      <div className="relative overflow-hidden border border-[var(--color-linea)] bg-[var(--color-grafito-2)]">
        <GridBg />
        <Corners />
        <div className="relative flex items-center justify-between px-5 pt-5">
          <StatusChip tone={meta.tone}>{meta.label}</StatusChip>
          <p className="font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">θ(t)</p>
        </div>
        <div className="relative mx-5 mt-2 aspect-[4/3] md:aspect-auto md:h-[340px]">
          <svg viewBox="0 0 360 280" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <path
              d="M 48 196 A 150 150 0 0 1 312 196"
              fill="none"
              stroke="#9a9ba0"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
          </svg>
          <div className="absolute left-1/2 top-3 h-[83%] -translate-x-1/2">
            <div
              ref={armRef}
              className="flex h-full flex-col items-center"
              style={{ transformOrigin: 'center 4px' }}
            >
              <div className="relative z-10 size-2 shrink-0 rounded-full bg-[var(--color-marfil)]" />
              <div className="-mt-1 w-[1.5px] min-h-0 flex-1 bg-[var(--color-marfil)]" />
              <div className="size-7 shrink-0 rounded-full bg-[var(--color-naranja)]" />
            </div>
          </div>
          <div className="absolute inset-x-4 bottom-2 flex justify-between font-mono text-[.6875rem] tracking-[.14em] text-muted-foreground">
            <span>−30°</span>
            <span>−15°</span>
            <span>0°</span>
            <span>+15°</span>
            <span>+30°</span>
          </div>
        </div>
        <div className="px-5 pb-2">
          <Sparkline samples={frame.samples} />
        </div>
      </div>
      <div className={`mt-3 grid gap-2 md:gap-3 ${liveReadouts ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        {liveReadouts ? (
          <>
            <Readout
              label="Temperatura"
              value={formatLive(telemetriaEnVivo.temperatura, 2)}
              unit={telemetriaEnVivo.temperatura != null ? '°C' : undefined}
            />
            <Readout
              label="Período"
              value={formatLive(telemetriaEnVivo.periodo, 3)}
              unit={telemetriaEnVivo.periodo != null ? 's' : undefined}
            />
            <Readout
              label="Oscilaciones"
              value={
                typeof telemetriaEnVivo.muestras === 'number'
                  ? `${telemetriaEnVivo.muestras}/${telemetriaEnVivo.maxMuestras ?? '—'}`
                  : '— —'
              }
            />
            <Readout
              label="Gravedad"
              value={formatLive(telemetriaEnVivo.gravedad, 3)}
              unit={telemetriaEnVivo.gravedad != null ? 'm/s²' : undefined}
            />
          </>
        ) : (
          <>
            <Readout label="Ángulo" value={angle} unit={silent ? undefined : '°'} />
            <Readout label="Velocidad" value={speed} unit={silent ? undefined : 'm/s'} />
            <Readout label="Período" value={periodText} unit={silent ? undefined : 's'} />
          </>
        )}
      </div>
      <p className="mt-2 font-mono text-[.6875rem] uppercase tracking-[.14em] text-muted-foreground">{meta.note}</p>
    </div>
  )
}
