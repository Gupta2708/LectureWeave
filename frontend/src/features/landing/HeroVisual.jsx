import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Mic, FileText, Sparkles } from 'lucide-react'

/*
 * Animated product-style composition demonstrating the pipeline:
 *   live audio → transcript → retrieved source → cited note.
 * This is an illustrative mock (not real user data) — clearly a product visual.
 */

function Waveform({ animate }) {
  const bars = Array.from({ length: 28 })
  return (
    <div className="flex h-8 items-center gap-[3px]">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-brand-400"
          initial={{ height: 6 }}
          animate={animate ? { height: [6, 8 + ((i * 7) % 22), 6] } : { height: 10 }}
          transition={
            animate
              ? { duration: 0.9 + (i % 5) * 0.12, repeat: Infinity, ease: 'easeInOut', delay: i * 0.03 }
              : { duration: 0 }
          }
        />
      ))}
    </div>
  )
}

export default function HeroVisual() {
  const reduce = useReducedMotion()
  const rise = (delay) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
  })

  return (
    <div className="relative w-full max-w-md">
      {/* Main card */}
      <motion.div
        {...rise(0.05)}
        className="rounded-2xl border border-marketing-line bg-marketing-surface/90 p-5 shadow-lg backdrop-blur"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-marketing-textsoft">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-danger/20 text-danger">
              <Mic className="h-3.5 w-3.5" />
            </span>
            Recording
          </span>
          <span className="font-mono text-xs text-marketing-textsoft">12:40</span>
        </div>

        <div className="mt-4 rounded-xl bg-marketing-bg/60 p-3">
          <Waveform animate={!reduce} />
        </div>

        {/* Transcript line */}
        <motion.div {...rise(0.5)} className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-marketing-textsoft/70">
            Transcript
          </p>
          <p className="mt-1 text-sm leading-relaxed text-marketing-text">
            “A high learning rate can overshoot the minimum during gradient
            descent…”
          </p>
        </motion.div>

        {/* Cited note line */}
        <motion.div
          {...rise(1.05)}
          className="mt-4 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3"
        >
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Note
          </p>
          <p className="mt-1 text-sm leading-relaxed text-marketing-text">
            Too large a learning rate causes the optimiser to diverge instead of
            converging.
            <span className="ml-1 inline-flex items-center rounded-md bg-brand-500/30 px-1.5 py-0.5 align-middle text-[10px] font-bold text-brand-100">
              C1
            </span>
          </p>
        </motion.div>
      </motion.div>

      {/* Floating source card */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.55, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-4 -top-6 hidden w-48 rounded-xl border border-marketing-line bg-marketing-surface2 p-3 shadow-lg sm:block"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-cyan/15 text-accent-cyan">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-marketing-text">
              GradientDescent.pdf
            </p>
            <p className="text-[10px] text-marketing-textsoft">page 17 · matched</p>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-full rounded-full bg-marketing-line" />
          <div className="h-1.5 w-3/4 rounded-full bg-marketing-line" />
        </div>
      </motion.div>
    </div>
  )
}
