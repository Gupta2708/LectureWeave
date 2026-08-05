import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/utils'

/**
 * Lightweight menu popover. `trigger` is a render prop receiving
 * { open, toggle, ref, props } for the trigger button. Children render inside
 * the menu. Closes on outside click and Escape.
 */
export default function Dropdown({ trigger, children, align = 'end', className }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        close: () => setOpen(false),
        props: { 'aria-haspopup': 'menu', 'aria-expanded': open },
      })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'absolute z-40 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lg',
              align === 'end' ? 'right-0' : 'left-0',
              className,
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownItem({ icon, danger, className, children, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
        'focus:outline-none focus-visible:bg-surface-subtle',
        danger
          ? 'text-danger hover:bg-danger-soft'
          : 'text-ink hover:bg-surface-subtle',
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
