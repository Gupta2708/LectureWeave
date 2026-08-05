import React, { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Native <select> styled to match the token system. Native is deliberate:
 * it stays accessible and keyboard/mobile friendly with zero JS. For a
 * custom-rendered menu, use Dropdown instead.
 */
const Select = forwardRef(function Select(
  { label, hint, error, id, className, containerClassName, children, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-surface pl-3.5 pr-10 text-sm text-ink transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-400',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            error ? 'border-danger' : 'border-line',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
})

export default Select
