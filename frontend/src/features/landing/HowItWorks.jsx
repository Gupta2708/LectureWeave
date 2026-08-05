import React from 'react'
import { Mic, Upload, Search, GraduationCap } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { SectionShell, SectionHeading } from './marketingBits'

const STEPS = [
  { icon: Mic, title: 'Record the lecture', body: 'Capture live audio straight from the browser as clean transcribed segments.' },
  { icon: Upload, title: 'Connect course material', body: 'Upload PDFs, slides, and docs — they’re indexed as searchable context.' },
  { icon: Search, title: 'Retrieve the right context', body: 'Hybrid search pulls the passages that actually match what’s being said.' },
  { icon: GraduationCap, title: 'Build cited study material', body: 'Get structured notes, flashcards, and quizzes with sources on every claim.' },
]

export default function HowItWorks() {
  const reduce = useReducedMotion()
  return (
    <SectionShell id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="From live audio to cited notes"
        subtitle="Four steps turn a lecture into study material you can rely on."
      />
      <div className="relative mt-14">
        {/* Connecting timeline line (desktop) */}
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent lg:block" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="relative"
            >
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-marketing-line bg-marketing-surface text-brand-300">
                <step.icon className="h-6 w-6" />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-marketing-text">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-marketing-textsoft">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
