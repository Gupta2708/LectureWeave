import React from 'react'
import { cn } from '../../lib/utils'

/**
 * Controlled tab bar. `tabs` = [{ value, label, icon?, badge? }].
 * The selected value is owned by the caller so it can be preserved across
 * data updates (important for the live-lecture notes panel).
 */
export default function Tabs({ tabs, value, onChange, className, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface-subtle p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              pad,
              active
                ? 'bg-surface text-brand-700 shadow-sm'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 text-[11px] font-semibold',
                  active ? 'bg-brand-soft text-brand-700' : 'bg-surface-muted text-ink-soft',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
