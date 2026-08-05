import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Determinate progress bar. `value` is 0–1 (a ratio). When `value` is null or
 * undefined the bar renders in an indeterminate sliding state — use that only
 * when the real ratio is genuinely unknown (never fake a percentage).
 */
export default function Progress({ value, className, barClassName, label }) {
  const isIndeterminate = value == null
  const pct = isIndeterminate ? 0 : Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : Math.round(pct)}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out',
          isIndeterminate && 'w-1/3 animate-[lw-shimmer_1.2s_ease-in-out_infinite]',
          barClassName,
        )}
        style={isIndeterminate ? undefined : { width: `${pct}%` }}
      />
    </div>
  )
}
