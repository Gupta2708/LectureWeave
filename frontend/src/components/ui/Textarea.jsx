import React, { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

const Textarea = forwardRef(function Textarea(
  { label, hint, error, id, className, containerClassName, rows = 4, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-400',
          'disabled:opacity-60 disabled:cursor-not-allowed resize-y',
          error ? 'border-danger focus-visible:ring-danger/30' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  )
})

export default Textarea
