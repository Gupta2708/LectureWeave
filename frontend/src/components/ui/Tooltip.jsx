import React, { useId, useState } from 'react'
import { cn } from '../../lib/utils'

/**
 * Minimal tooltip driven by hover + focus (keyboard accessible). Wrap a single
 * focusable child. Purely decorative content — never put essential-only info
 * here.
 */
export default function Tooltip({ label, children, side = 'top', className }) {
  const [show, setShow] = useState(false)
  const id = useId()

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': show ? id : undefined })}
      {show && label && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-md',
            positions[side],
            className,
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
