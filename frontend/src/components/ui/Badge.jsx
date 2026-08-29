import { cn } from '../../lib/cn.js'

const TONES = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  flash: 'bg-flash-50 text-flash-700 ring-flash-200',
  spark: 'bg-spark-100 text-spark-700 ring-spark-200',
  neutral: 'bg-canvas text-muted ring-line',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  inverse: 'bg-ink/85 text-white ring-white/10 backdrop-blur',
}

export function Badge({ tone = 'neutral', className, icon: Icon, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONES[tone],
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function Dot({ tone = 'brand', pulse = false, className }) {
  const colors = {
    brand: 'bg-brand-500',
    flash: 'bg-flash-500',
    spark: 'bg-spark-500',
    neutral: 'bg-muted',
    danger: 'bg-red-500',
  }
  return (
    <span className={cn('relative flex size-2', className)}>
      {pulse ? (
        <span
          className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', colors[tone])}
        />
      ) : null}
      <span className={cn('relative inline-flex size-2 rounded-full', colors[tone])} />
    </span>
  )
}
