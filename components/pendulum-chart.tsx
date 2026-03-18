"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// Generate initial data
function generateInitialData() {
  const data = []
  for (let i = 0; i < 50; i++) {
    const time = i * 0.1
    data.push({
      time: time.toFixed(1),
      angle: 15 * Math.cos(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time),
      velocity: -15 * (2 * Math.PI / 2.01) * Math.sin(2 * Math.PI * time / 2.01) * Math.exp(-0.02 * time),
    })
  }
  return data
}

export function PendulumChart() {
  const [data, setData] = useState(generateInitialData())

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData.slice(1)]
        const lastTime = parseFloat(prevData[prevData.length - 1].time)
        const newTime = lastTime + 0.1
        const angle = 15 * Math.cos(2 * Math.PI * newTime / 2.01) * Math.exp(-0.02 * newTime)
        const velocity = -15 * (2 * Math.PI / 2.01) * Math.sin(2 * Math.PI * newTime / 2.01) * Math.exp(-0.02 * newTime)
        
        newData.push({
          time: newTime.toFixed(1),
          angle: angle + (Math.random() - 0.5) * 0.5, // Add small noise
          velocity: velocity + (Math.random() - 0.5) * 0.5,
        })
        return newData
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="time" 
            className="text-xs fill-muted-foreground"
            tick={{ fill: 'var(--muted-foreground)' }}
            label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5, fill: 'var(--muted-foreground)' }}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tick={{ fill: 'var(--muted-foreground)' }}
            label={{ value: 'Valor', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)'
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="angle" 
            name="Ángulo (°)"
            stroke="var(--chart-1)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="velocity" 
            name="Velocidad (rad/s)"
            stroke="var(--chart-2)" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
