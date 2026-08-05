import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_OUT } from './motion'

/**
 * Per-route entrance for standard pages (opacity + slight rise).
 *
 * IMPORTANT: never wrap the live-lecture route in this. Animating/keying that
 * subtree would remount the recorder + WebSocket. The FocusLayout renders it
 * as a stable, un-animated child by design.
 */
export default function PageTransition({ children, className }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
