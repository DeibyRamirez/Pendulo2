import { cn } from '@/lib/utils'

export function GridBg({ className }: { className?: string }) {
  return <div aria-hidden className={cn('rejilla pointer-events-none absolute inset-0', className)} />
}
