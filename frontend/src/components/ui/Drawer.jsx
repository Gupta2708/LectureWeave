import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/** Side sheet. `side` = 'right' | 'left'. Escape + focus trap + restore. */
export default function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  className,
  width = 'w-full sm:w-[26rem]',
}) {
  const panelRef = useRef(null)
  const lastFocused = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement
    const panel = panelRef.current
    ;(panel?.querySelector(FOCUSABLE) || panel)?.focus?.()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prev
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus()
    }
  }, [open, onClose])

  const offscreen = side === 'right' ? '100%' : '-100%'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : 'Panel'}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { x: offscreen }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: offscreen }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cn(
              'absolute top-0 bottom-0 flex flex-col border-line bg-surface shadow-lg focus:outline-none',
              side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              width,
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
