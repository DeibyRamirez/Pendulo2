'use client'

import { useEffect, useState, type RefObject } from 'react'

export const PENDULUM_THETA0 = 15.7
export const PENDULUM_PERIOD = 2.01

const GAMMA = 0.04
const CYCLE_SECONDS = 16

export interface PendulumFrame {
  theta: number
  velocity: number
  period: number
  samples: number[]
}

export type PendulumMotion = 'run' | 'still' | 'off'

function lengthFromPeriod(period: number) {
  return 9.81 * (period / (2 * Math.PI)) ** 2
}

export function frameAt(t: number, period: number): Omit<PendulumFrame, 'samples'> {
  const omega0 = (2 * Math.PI) / period
  const decay = Math.exp(-GAMMA * t)
  const theta = PENDULUM_THETA0 * decay * Math.cos(omega0 * t)
  const theta0Rad = (PENDULUM_THETA0 * Math.PI) / 180
  const omega =
    theta0Rad * decay * (-GAMMA * Math.cos(omega0 * t) - omega0 * Math.sin(omega0 * t))
  return {
    theta,
    velocity: lengthFromPeriod(period) * omega,
    period,
  }
}

function restFrame(period: number): PendulumFrame {
  return {
    theta: PENDULUM_THETA0,
    velocity: 0,
    period,
    samples: Array.from({ length: 48 }, () => PENDULUM_THETA0),
  }
}

export function usePendulum(
  periodInput: number | undefined,
  motion: PendulumMotion,
  arm?: RefObject<HTMLElement | null>,
): PendulumFrame {
  const period =
    typeof periodInput === 'number' && periodInput > 0.4 && periodInput < 8
      ? periodInput
      : PENDULUM_PERIOD
  const [frame, setFrame] = useState<PendulumFrame>(() => restFrame(period))

  useEffect(() => {
    const applyArm = (theta: number) => {
      const node = arm?.current
      if (!node) return
      node.style.transform = `translateX(-50%) rotate(${theta}deg)`
    }

    if (motion === 'off') {
      applyArm(0)
      setFrame({ theta: 0, velocity: 0, period, samples: [] })
      return
    }

    if (motion === 'still') {
      applyArm(PENDULUM_THETA0)
      setFrame(restFrame(period))
      return
    }

    const samples: number[] = []
    let raf = 0
    let last = 0
    const started = performance.now()

    const loop = (now: number) => {
      const elapsed = (now - started) / 1000
      const current = frameAt(elapsed % CYCLE_SECONDS, period)
      applyArm(current.theta)
      if (now - last >= 50) {
        last = now
        samples.push(current.theta)
        if (samples.length > 120) samples.shift()
        setFrame({ ...current, samples: samples.slice() })
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [arm, motion, period])

  return frame
}
