// Small presentational primitives shared across screens.

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const buttonVariants = {
  primary: 'bg-accent text-accent-ink hover:bg-accent-strong font-semibold',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 border border-line',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:bg-danger/20',
}

const buttonSizes = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-14 px-6 text-base gap-2.5 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl',
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl bg-surface border border-line', className)} {...props} />
}

export function PageHeader({ title, subtitle, action, back }) {
  return (
    <header className="pt-safe">
      <div className="flex items-end justify-between gap-3 pt-6 pb-5">
        <div className="min-w-0 flex items-center gap-2">
          {back}
          <div className="min-w-0">
            {subtitle && <p className="text-xs font-medium uppercase tracking-wider text-faint">{subtitle}</p>}
            <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          </div>
        </div>
        {action}
      </div>
    </header>
  )
}

export function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-surface border border-line p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {Icon && <Icon size={14} strokeWidth={2.25} />}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold tabular tracking-tight">{value}</div>
    </div>
  )
}

export function MuscleTag({ muscle, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-medium text-muted', className)}>
      {muscle}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-6">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-faint">
          <Icon size={26} />
        </div>
      )}
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-1 text-sm text-muted max-w-xs">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl bg-surface-2 border border-line px-4 text-ink placeholder:text-faint outline-none focus:border-accent/60 transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export function Chip({ active, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'shrink-0 h-9 rounded-full px-3.5 text-sm font-medium border transition-colors',
        active ? 'bg-accent text-accent-ink border-accent' : 'bg-surface border-line text-muted hover:text-ink',
        className,
      )}
      {...props}
    />
  )
}
