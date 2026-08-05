import React, { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

/*
 * Decorative hero background: layered radial gradients + a network of nodes
 * with drawn connecting lines that softly drift, plus a gentle pointer
 * parallax. Represents information being connected (audio → sources → notes).
 *
 * CSS + SVG + Framer only — no canvas/WebGL. Parallax is disabled on touch
 * devices and under prefers-reduced-motion.
 */

const NODES = [
  { x: 14, y: 26, r: 4 },
  { x: 30, y: 62, r: 3 },
  { x: 46, y: 30, r: 5 },
  { x: 62, y: 66, r: 3 },
  { x: 74, y: 34, r: 4 },
  { x: 86, y: 58, r: 3 },
  { x: 22, y: 80, r: 2.5 },
  { x: 54, y: 84, r: 2.5 },
]

const LINKS = [
  [0, 2], [2, 4], [4, 5], [1, 2], [1, 3], [3, 4], [1, 6], [3, 7], [6, 7],
]

export default function AnimatedKnowledgeField() {
  const reduce = useReducedMotion()
  const ref = useRef(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const tx = useTransform(sx, [-0.5, 0.5], [-12, 12])
  const ty = useTransform(sy, [-0.5, 0.5], [-12, 12])

  useEffect(() => {
    if (reduce) return
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return
    const onMove = (e) => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      mx.set((e.clientX - r.left) / r.width - 0.5)
      my.set((e.clientY - r.top) / r.height - 0.5)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my, reduce])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Radial gradient glows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(700px circle at 18% 22%, rgba(91,92,226,0.35), transparent 55%),' +
            'radial-gradient(600px circle at 82% 30%, rgba(139,92,246,0.28), transparent 55%),' +
            'radial-gradient(700px circle at 60% 85%, rgba(34,211,238,0.16), transparent 55%)',
        }}
      />
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent 75%)',
        }}
      />

      {/* Node network */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={reduce ? undefined : { x: tx, y: ty }}
      >
        {LINKS.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="rgba(129,140,248,0.35)"
            strokeWidth="0.18"
            initial={reduce ? { pathLength: 1, opacity: 0.4 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={reduce ? { duration: 0 } : { duration: 1.6, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
          />
        ))}
        {NODES.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r / 4}
            fill={i % 3 === 0 ? 'rgba(34,211,238,0.9)' : 'rgba(139,120,246,0.9)'}
            initial={reduce ? { opacity: 0.8 } : { opacity: 0, scale: 0 }}
            animate={
              reduce
                ? { opacity: 0.8 }
                : { opacity: [0.5, 0.95, 0.5], scale: 1 }
            }
            transition={
              reduce
                ? { duration: 0 }
                : { opacity: { duration: 3.5, repeat: Infinity, delay: i * 0.3 }, scale: { duration: 0.6, delay: i * 0.1 } }
            }
          />
        ))}
      </motion.svg>

      {/* Bottom fade into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-marketing-bg" />
    </div>
  )
}
