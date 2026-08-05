import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal dialog: portal to <body>, backdrop, escape-to-close,
 * focus trap, and focus restoration to the trigger on close.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}) {
  const panelRef = useRef(null)
  const lastFocused = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement
    const panel = panelRef.current
    // Focus the first focusable element (or the panel itself).
    const first = panel?.querySelector(FOCUSABLE)
    ;(first || panel)?.focus?.()

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      } else if (e.key === 'Tab' && panel) {
        const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
          (n) => n.offsetParent !== null,
        )
        if (nodes.length === 0) return
        const firstEl = nodes[0]
        const lastEl = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus()
    }
  }, [open, onClose])

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 w-full rounded-2xl border border-line bg-surface shadow-lg focus:outline-none',
              sizes[size],
              className,
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 p-5 pb-3">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-ink">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-ink-soft">{description}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className={cn('px-5', title || onClose ? '' : 'pt-5')}>{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 p-5 pt-4">
                {footer}
              </div>
            )}
            {!footer && <div className="pb-5" />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
