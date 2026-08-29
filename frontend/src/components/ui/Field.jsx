import { useId } from 'react'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const CONTROL =
  'w-full rounded-2xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line transition placeholder:text-muted/70 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-canvas disabled:text-muted'

export function Field({ label, hint, error, required, children, className, htmlFor }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required ? <span className="ml-0.5 text-flash-600">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, hint, error, required, className, icon: Icon, id, ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const control = (
    <input
      id={inputId}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL, Icon && 'pl-11', error && 'ring-red-300 focus:ring-red-500', className)}
      {...props}
    />
  )

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      {Icon ? (
        <div className="relative">
          <Icon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          {control}
        </div>
      ) : (
        control
      )}
    </Field>
  )
}

export function Textarea({ label, hint, error, required, className, id, rows = 4, ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'resize-y', error && 'ring-red-300 focus:ring-red-500', className)}
        {...props}
      />
    </Field>
  )
}

export function Select({ label, hint, error, required, className, id, children, ...props }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      <div className="relative">
        <select
          id={inputId}
          className={cn(CONTROL, 'appearance-none pr-11', error && 'ring-red-300', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted" />
      </div>
    </Field>
  )
}

export function QuantityStepper({ value, min = 1, max = 99, onChange, disabled }) {
  const clamp = (next) => Math.min(max, Math.max(min, next))
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-canvas p-1 ring-1 ring-line">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="grid size-9 place-items-center rounded-full bg-surface text-ink shadow-sm transition hover:bg-brand-50 disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span aria-live="polite" className="w-10 text-center font-display text-lg font-bold text-ink">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        className="grid size-9 place-items-center rounded-full bg-surface text-ink shadow-sm transition hover:bg-brand-50 disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export function Switch({ checked, onChange, label, description, id }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <label
      htmlFor={inputId}
      className="flex cursor-pointer items-start gap-3 rounded-2xl p-1 transition hover:bg-canvas"
    >
      <span className="relative mt-0.5 inline-flex">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-6 w-11 rounded-full bg-line transition peer-checked:bg-brand-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500" />
        <span className="pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  )
}

export function Chip({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200',
        active
          ? 'bg-ink text-white shadow-sm'
          : 'bg-surface text-muted ring-1 ring-line hover:text-ink hover:ring-brand-200',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
