import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_OUT } from './motion'

/**
 * Fade (+ optional rise) an element into view. When `whileInView` is set it
 * animates on scroll-reveal; otherwise on mount. Reduced motion → plain fade.
 */
export default function FadeIn({
  children,
  delay = 0,
  y = 16,
  whileInView = false,
  once = true,
  duration = DURATION.slow,
  className,
  as = 'div',
  ...props
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  const from = reduce ? { opacity: 0 } : { opacity: 0, y }
  const to = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }

  const animateProps = whileInView
    ? { whileInView: to, viewport: { once, amount: 0.2 } }
    : { animate: to }

  return (
    <MotionTag
      initial={from}
      {...animateProps}
      transition={{ duration, ease: EASE_OUT, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
