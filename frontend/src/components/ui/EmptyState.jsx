import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Friendly empty state. `icon` is a lucide element; `action` is a node
 * (usually a Button). Keep copy short and point to the next action.
 */
export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface-subtle/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-600">
          {icon}
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
