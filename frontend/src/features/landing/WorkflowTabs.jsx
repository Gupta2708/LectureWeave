import React, { useState } from 'react'
import { Mic, BookOpen, RefreshCw, Dumbbell } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SectionShell, SectionHeading } from './marketingBits'
import { cn } from '../../lib/utils'

const TABS = [
  {
    key: 'capture', label: 'Capture', icon: Mic,
    heading: 'Record and transcribe live',
    points: ['Browser recording in clean segments', 'Editable, timestamped transcript', 'Mark important / confusing moments'],
  },
  {
    key: 'understand', label: 'Understand', icon: BookOpen,
    heading: 'Notes grounded in your sources',
    points: ['Structured notes in your chosen style', 'Inline citations on every claim', 'Automatic topic segmentation'],
  },
  {
    key: 'review', label: 'Review', icon: RefreshCw,
    heading: 'Revisit with confidence',
    points: ['Readable notes viewer with topics', 'Inspect any citation’s source', 'Export to MD / TXT / PDF / DOCX'],
  },
  {
    key: 'practise', label: 'Practise', icon: Dumbbell,
    heading: 'Test what you learned',
    points: ['Grounded flashcards from your notes', 'Quizzes with explained answers', 'Subject-wide chat to fill gaps'],
  },
]

export default function WorkflowTabs() {
  const [active, setActive] = useState('capture')
  const reduce = useReducedMotion()
  const current = TABS.find((t) => t.key === active)

  return (
    <SectionShell className="bg-marketing-surface/30">
      <SectionHeading
        eyebrow="Built for the complete study workflow"
        title="From capture to practice"
        subtitle="The same grounded material powers every stage of studying."
      />

      <div className="mx-auto mt-10 flex max-w-md flex-wrap justify-center gap-2">
        {TABS.map((t) => {
          const on = t.key === active
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                on
                  ? 'border-brand-500 bg-brand-600 text-white'
                  : 'border-marketing-line text-marketing-textsoft hover:text-marketing-text',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-8 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-marketing-line bg-marketing-surface p-8"
          >
            <h3 className="text-xl font-semibold text-marketing-text">{current.heading}</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {current.points.map((p) => (
                <li key={p} className="rounded-xl bg-marketing-bg/60 p-4 text-sm text-marketing-textsoft">
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  )
}
