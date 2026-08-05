import React, { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { DURATION } from './motion'

/**
 * Counts up to `value` once it becomes available. Reduced motion → shows the
 * final value immediately. Only animate real, loaded numbers (never fabricate
 * a metric just to animate it).
 */
export default function AnimatedNumber({ value = 0, duration = DURATION.slow, className }) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (reduce) {
      setDisplay(value)
      return
    }
    const target = Number(value) || 0
    const from = 0
    const ms = duration * 1000
    startRef.current = null

    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts
      const progress = Math.min(1, (ts - startRef.current) / ms)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [value, duration, reduce])

  return <span className={className}>{display}</span>
}
