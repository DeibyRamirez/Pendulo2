import { cn } from '@/lib/utils'

type Tone = 'ok' | 'demo' | 'error' | 'pause'

const dotClass: Record<Tone, string> = {
  ok: 'bg-[var(--color-ok)] latido',
  demo: 'bg-[var(--color-niebla)]',
  error: 'bg-[var(--color-error)]',
  pause: 'bg-[var(--color-niebla)]',
}

export function StatusChip({
  tone,
  children,
}: {
  tone: Tone
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-linea)] px-3 py-1 font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-foreground">
      <span className={cn('size-1.5 shrink-0 rounded-full', dotClass[tone])} aria-hidden />
      {children}
    </span>
  )
}
