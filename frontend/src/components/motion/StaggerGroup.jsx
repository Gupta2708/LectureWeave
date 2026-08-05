import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE_OUT } from './motion'

/**
 * Staggers its <StaggerItem> children into view. Use for card grids and lists
 * on initial load. Reduced motion collapses to an instant appearance.
 */
export function StaggerGroup({
  children,
  className,
  stagger = 0.06,
  whileInView = false,
  once = true,
  as = 'div',
}) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
  }
  const trigger = whileInView
    ? { whileInView: 'visible', viewport: { once, amount: 0.15 } }
    : { animate: 'visible' }

  return (
    <MotionTag initial="hidden" variants={container} {...trigger} className={className}>
      {children}
    </MotionTag>
  )
}

export function StaggerItem({ children, className, y = 14, as = 'div', ...props }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div
  const variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.base, ease: EASE_OUT },
    },
  }
  return (
    <MotionTag variants={variants} className={className} {...props}>
      {children}
    </MotionTag>
  )
}

export default StaggerGroup
