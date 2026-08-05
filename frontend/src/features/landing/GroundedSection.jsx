import React from 'react'
import { FileText, ArrowRight, Quote } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { SectionShell, SectionHeading } from './marketingBits'

export default function GroundedSection() {
  const reduce = useReducedMotion()
  const step = (delay) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5, delay },
  })
  return (
    <SectionShell id="grounded" className="bg-marketing-surface/30">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Grounded AI"
            title="Answers grounded in your own material"
            subtitle="Your uploaded documents are retrieved and used as context — so notes reflect what you’re studying, and every claim is traceable. The model isn’t trained on your files; it cites them."
          />
        </div>

        {/* Retrieval flow illustration */}
        <div className="space-y-3">
          <motion.div {...step(0)} className="flex items-center gap-3 rounded-2xl border border-marketing-line bg-marketing-surface p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-cyan/15 text-accent-cyan">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-marketing-text">Source document</p>
              <p className="text-xs text-marketing-textsoft">GradientDescent.pdf · slides + notes indexed</p>
            </div>
          </motion.div>

          <motion.div {...step(0.15)} className="flex justify-center text-brand-400">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </motion.div>

          <motion.div {...step(0.3)} className="rounded-2xl border border-marketing-line bg-marketing-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-marketing-textsoft/70">Matched passage</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-marketing-text">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              “A high learning rate can overshoot the minimum…”
            </p>
          </motion.div>

          <motion.div {...step(0.45)} className="flex justify-center text-brand-400">
            <ArrowRight className="h-5 w-5 rotate-90" />
          </motion.div>

          <motion.div {...step(0.6)} className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">Cited note</p>
            <p className="mt-1 text-sm text-marketing-text">
              Too large a learning rate causes divergence.
              <span className="ml-1 rounded-md bg-brand-500/30 px-1.5 py-0.5 text-[10px] font-bold text-brand-100">C1</span>
            </p>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  )
}
