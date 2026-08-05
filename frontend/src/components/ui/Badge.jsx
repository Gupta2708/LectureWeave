import React from 'react'
import { cn } from '../../lib/utils'

const TONES = {
  neutral: 'bg-surface-subtle text-ink-soft border-line',
  brand: 'bg-brand-soft text-brand-700 border-brand-200',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
}

export default function Badge({ tone = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
