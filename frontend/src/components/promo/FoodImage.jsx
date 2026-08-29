import { useState } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Listing photo with a category-tinted fallback, so a missing or broken
 * image_url still looks intentional instead of leaving a grey box.
 */
export function FoodImage({ src, alt, category, className, imgClassName, children }) {
  const [failed, setFailed] = useState(false)
  const showFallback = !src || failed

  return (
    <div className={cn('relative overflow-hidden bg-canvas', className)}>
      {showFallback ? (
        <div
          className={cn(
            'grid size-full place-items-center bg-gradient-to-br',
            category?.tint ?? 'from-stone-200 to-stone-300'
          )}
        >
          <span className="text-5xl drop-shadow-sm select-none" aria-hidden="true">
            {category?.emoji ?? '🍽️'}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            'size-full object-cover transition-transform duration-500 group-hover:scale-105',
            imgClassName
          )}
        />
      )}
      {children}
    </div>
  )
}
