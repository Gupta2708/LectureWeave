import React from 'react'
import { cn } from '../../lib/utils'

/**
 * The single source of truth for status language + colour across the app
 * (recording, processing stages, documents, connection). Every surface that
 * shows a status should use this so the meaning is consistent.
 */
export const STATUS = {
  ready: { label: 'Ready', color: 'var(--status-ready)', pulse: false },
  recording: { label: 'Recording', color: 'var(--status-recording)', pulse: true },
  uploading: { label: 'Uploading', color: 'var(--status-uploading)', pulse: true },
  transcribing: { label: 'Transcribing', color: 'var(--status-transcribing)', pulse: true },
  retrieving: { label: 'Retrieving', color: 'var(--status-retrieving)', pulse: true },
  generating: { label: 'Generating', color: 'var(--status-generating)', pulse: true },
  complete: { label: 'Complete', color: 'var(--status-complete)', pulse: false },
  failed: { label: 'Failed', color: 'var(--status-failed)', pulse: false },
  retrying: { label: 'Retrying', color: 'var(--status-retrying)', pulse: true },
  connected: { label: 'Connected', color: 'var(--status-complete)', pulse: false },
  disconnected: { label: 'Disconnected', color: 'var(--status-disconnected)', pulse: false },
}

export default function StatusPill({ status, label, className }) {
  const meta = STATUS[status] ?? STATUS.ready
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-soft',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {meta.pulse && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ backgroundColor: meta.color, animation: 'lw-pulse-ring 1.6s ease-out infinite' }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: meta.color }}
        />
      </span>
      {label ?? meta.label}
    </span>
  )
}
