import React, { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'

const baseField =
  'w-full rounded-xl border bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:border-brand-400 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed'

const Input = forwardRef(function Input(
  { label, hint, error, leftIcon, id, className, containerClassName, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id || autoId
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            baseField,
            'h-11',
            leftIcon && 'pl-10',
            error ? 'border-danger focus-visible:ring-danger/30' : 'border-line',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export default Input
