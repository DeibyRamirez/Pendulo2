export function SectionHeader({
  index,
  kicker,
  title,
  lead,
}: {
  index: string
  kicker: string
  title: string
  lead?: string
}) {
  return (
    <header className="max-w-3xl">
      <div className="flex items-center gap-4">
        <p className="shrink-0 font-mono text-[.6875rem] font-medium uppercase tracking-[.14em] text-primary">
          {index} · {kicker}
        </p>
        <span
          aria-hidden
          className="h-px flex-1 bg-[linear-gradient(90deg,var(--border),transparent)]"
        />
      </div>
      <h2 className="mt-4 font-display text-titulo font-semibold leading-[.95] tracking-[-0.035em] text-foreground">
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 max-w-[42ch] text-destacado leading-[1.45] text-muted-foreground">
          {lead}
        </p>
      ) : null}
    </header>
  )
}
