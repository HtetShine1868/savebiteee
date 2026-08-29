import { cn } from '../../lib/cn.js'
import { CATEGORIES } from '../../lib/promotions.js'

export function CategoryScroller({ selected = [], onToggle, className, counts }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0', className)}>
      {CATEGORIES.map((category) => {
        const active = selected.includes(category.slug)
        const count = counts?.[category.slug]
        return (
          <button
            key={category.slug}
            type="button"
            onClick={() => onToggle(category.slug)}
            aria-pressed={active}
            className={cn(
              'group flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-200',
              active
                ? 'bg-ink text-white shadow-card'
                : 'bg-surface text-ink ring-1 ring-line hover:ring-brand-300'
            )}
          >
            <span
              className={cn(
                'grid size-9 place-items-center rounded-xl bg-gradient-to-br text-lg transition',
                category.tint,
                active && 'ring-2 ring-white/40'
              )}
              aria-hidden="true"
            >
              {category.emoji}
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold whitespace-nowrap">{category.name}</span>
              {count != null ? (
                <span className={cn('block text-xs', active ? 'text-white/70' : 'text-muted')}>
                  {count} live
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
