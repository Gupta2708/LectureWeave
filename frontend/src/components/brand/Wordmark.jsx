import React from 'react'
import Logo from './Logo'
import { cn } from '../../lib/utils'

/**
 * Logo + "LectureWeave" wordmark lockup.
 * `tone` = 'dark' renders light text for marketing (dark) surfaces.
 */
export default function Wordmark({ size = 28, tone = 'light', className }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Logo size={size} />
      <span
        className={cn(
          'text-lg font-extrabold tracking-tight',
          tone === 'dark' ? 'text-marketing-text' : 'text-ink',
        )}
      >
        Lecture<span className="text-brand-600">Weave</span>
      </span>
    </span>
  )
}
