import { cn } from '../../lib/cn.js'

export function Card({ as: Component = 'div', className, padded = true, hover = false, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-3xl bg-surface ring-1 ring-line/80 shadow-card',
        padded && 'p-5 sm:p-6',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-200',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function SectionHeading({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1.5 text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted text-balance-pretty">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function StatTile({ icon: Icon, label, value, hint, tone = 'brand', className }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    flash: 'bg-flash-50 text-flash-600',
    spark: 'bg-spark-100 text-spark-600',
    neutral: 'bg-canvas text-muted',
  }
  return (
    <div className={cn('rounded-3xl bg-surface p-5 ring-1 ring-line/80 shadow-card', className)}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={cn('grid size-10 place-items-center rounded-2xl', tones[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        ) : null}
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export function Divider({ className }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}
