import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  spark:
    'bg-spark-600 text-white shadow-sm hover:bg-spark-700 active:bg-spark-700 disabled:bg-spark-300',
  flash:
    'bg-flash-500 text-white shadow-sm hover:bg-flash-600 active:bg-flash-700 disabled:bg-flash-200',
  secondary:
    'bg-surface text-ink ring-1 ring-line hover:bg-canvas hover:ring-brand-200 disabled:text-muted',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:text-brand-300',
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  outlineDanger: 'text-red-600 ring-1 ring-red-200 hover:bg-red-50',
}

const SIZES = {
  xs: 'h-8 gap-1.5 px-3 text-xs',
  sm: 'h-9 gap-1.5 px-3.5 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-13 gap-2 px-7 text-base',
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  icon: Icon,
  iconRight: IconRight,
  children,
  ...props
}) {
  const isButton = Component === 'button'
  return (
    <Component
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-70',
        !disabled && !loading && 'hover:-translate-y-px active:translate-y-0',
        SIZES[size],
        VARIANTS[variant],
        className
      )}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className={cn(size === 'xs' ? 'size-3.5' : 'size-4')} aria-hidden="true" />
      ) : null}
      {children}
      {IconRight && !loading ? <IconRight className="size-4" aria-hidden="true" /> : null}
    </Component>
  )
}

export function IconButton({
  as: Component = 'button',
  className,
  label,
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  ...props
}) {
  return (
    <Component
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        size === 'sm' ? 'size-9' : 'size-11',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden="true" />
    </Component>
  )
}
