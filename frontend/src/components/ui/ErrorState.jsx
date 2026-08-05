import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'
import Button from './Button'

/** Recoverable error surface with an optional retry action. */
export default function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger-soft/50 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
