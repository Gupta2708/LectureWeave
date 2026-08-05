import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/utils'

/** Small shared marketing pieces to keep sections consistent. */

export function SectionShell({ id, className, children }) {
  return (
    <section id={id} className={cn('relative py-20 sm:py-24', className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5 }}
      className={cn('max-w-2xl', center && 'mx-auto text-center')}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-marketing-text sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-marketing-textsoft">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
