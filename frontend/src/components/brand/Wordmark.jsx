import React from 'react'
import Logo from './Logo'
import { cn } from '../../lib/utils'

/**
 * Brand lockup: the real woven mark + a two-tone "LectureWeave" wordmark
 * ("Weave" in a violet→cyan gradient echoing the mark's teal accent).
 *
 * Interactive: hovering the lockup lifts + tilts the mark behind a soft brand
 * glow. `tone`: 'light' (default) for light surfaces → ink text + navy mark;
 * 'dark' for marketing/auth surfaces → white text + white mark.
 */
export default function Wordmark({ size = 34, tone = 'light', className }) {
  const dark = tone === 'dark'
  return (
    <span
      className={cn(
        'group inline-flex select-none items-center gap-2.5',
        className,
      )}
    >
      <span className="relative inline-flex">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-brand-500/40 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
        />
        <Logo
          size={size}
          color={dark ? 'var(--marketing-text)' : '#201A4C'}
          className="relative transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
        />
      </span>
      <span
        className="font-extrabold leading-none tracking-tight"
        style={{ fontSize: Math.round(size * 0.6) }}
      >
        <span className={dark ? 'text-white' : 'text-ink'}>Lecture</span>
        <span className="bg-gradient-to-r from-brand-400 via-accent-violet to-accent-cyan bg-clip-text text-transparent">
          Weave
        </span>
      </span>
    </span>
  )
}
