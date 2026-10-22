import { cn } from '@/lib/utils'

export function Readout({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--color-linea)] bg-[var(--color-grafito-2)] p-3">
      <p className="font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex flex-col md:flex-row md:items-baseline md:gap-1.5">
        <span className={cn('num whitespace-nowrap text-[1.125rem] leading-none text-foreground md:text-xl')}>
          {value}
        </span>
        {unit ? (
          <span className="num whitespace-nowrap text-[.8125rem] text-muted-foreground">{unit}</span>
        ) : null}
      </p>
    </div>
  )
}
