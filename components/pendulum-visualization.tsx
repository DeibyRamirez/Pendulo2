"use client"

interface PendulumVisualizationProps {
  angle: number
  isRunning: boolean
}

export function PendulumVisualization({ angle, isRunning }: PendulumVisualizationProps) {
  return (
    <div className="relative aspect-square w-full max-w-[300px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#grid)" />
        
        {/* Pivot mount */}
        <rect x="80" y="10" width="40" height="8" rx="2" fill="var(--muted)" />
        <circle cx="100" cy="20" r="5" fill="var(--primary)" />
        
        {/* Pendulum arm and bob */}
        <g 
          transform={`rotate(${angle}, 100, 20)`}
          style={{ 
            transition: isRunning ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Arm */}
          <line 
            x1="100" 
            y1="20" 
            x2="100" 
            y2="140" 
            stroke="var(--foreground)" 
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Bob */}
          <circle 
            cx="100" 
            cy="150" 
            r="18" 
            fill="var(--primary)"
            className="drop-shadow-lg"
          />
          <circle 
            cx="100" 
            cy="150" 
            r="12" 
            fill="var(--primary)"
            opacity="0.7"
          />
        </g>
        
        {/* Angle arc */}
        <path
          d={`M 100 50 A 30 30 0 0 ${angle > 0 ? 1 : 0} ${100 + 30 * Math.sin(angle * Math.PI / 180)} ${50 - 30 * Math.cos(angle * Math.PI / 180) + 30}`}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeDasharray="4 2"
        />
        
        {/* Center line (vertical reference) */}
        <line 
          x1="100" 
          y1="20" 
          x2="100" 
          y2="180" 
          stroke="var(--muted-foreground)" 
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity="0.5"
        />
        
        {/* Motion trail indicator */}
        <path
          d={`M 60 150 Q 100 170 140 150`}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />
        
        {/* Angle label */}
        <text 
          x="120" 
          y="60" 
          fill="var(--foreground)" 
          fontSize="12"
          fontFamily="monospace"
        >
          {angle.toFixed(1)}°
        </text>
      </svg>
      
      {/* Status indicator */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-center">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isRunning 
            ? 'bg-chart-3/20 text-chart-3' 
            : 'bg-muted text-muted-foreground'
        }`}>
          <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-chart-3 animate-pulse' : 'bg-muted-foreground'}`} />
          {isRunning ? 'En movimiento' : 'Pausado'}
        </div>
      </div>
    </div>
  )
}
