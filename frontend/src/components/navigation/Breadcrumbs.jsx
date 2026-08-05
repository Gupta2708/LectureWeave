import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SEGMENT_LABELS } from './navConfig'
import { cn } from '../../lib/utils'

/**
 * Derives breadcrumbs from the URL. Opaque id segments (Mongo ids) are skipped
 * so we never show a raw id as a crumb.
 */
function labelFor(segment) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  // Skip id-like segments.
  if (/^[0-9a-f]{12,}$/i.test(segment) || /^\d+$/.test(segment)) return null
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export default function Breadcrumbs({ className }) {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  const crumbs = []
  let acc = ''
  segments.forEach((seg) => {
    acc += `/${seg}`
    const label = labelFor(seg)
    if (label) crumbs.push({ to: acc, label })
  })

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1
        return (
          <span key={crumb.to} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-ink-faint" />}
            {last ? (
              <span className="font-semibold text-ink">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-ink-soft hover:text-brand-700">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
