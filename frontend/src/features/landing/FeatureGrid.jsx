import React from 'react'
import {
  Mic, FileText, Quote, MessagesSquare, Layers, HelpCircle, Compass, Download,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { SectionShell, SectionHeading } from './marketingBits'
import { cn } from '../../lib/utils'

const FEATURES = [
  { icon: Mic, title: 'Live transcription', body: 'Editable, timestamped transcript segments as you record.', span: 'sm:col-span-2', accent: 'text-brand-300' },
  { icon: FileText, title: 'Structured notes', body: 'Periodic and final notes in the style you choose.', accent: 'text-accent-cyan' },
  { icon: Quote, title: 'Source citations', body: 'Every claim links to its page, slide, or moment.', accent: 'text-accent-violet' },
  { icon: MessagesSquare, title: 'Subject chat', body: 'Ask questions grounded in your material.', accent: 'text-brand-300' },
  { icon: Layers, title: 'Flashcards', body: 'Grounded cards generated from your notes.', accent: 'text-accent-cyan' },
  { icon: HelpCircle, title: 'Quizzes', body: 'Practice with explained, cited answers.', accent: 'text-accent-violet' },
  { icon: Compass, title: 'Topic navigation', body: 'Jump around lectures by segmented topic.', accent: 'text-brand-300' },
  { icon: Download, title: 'Exports', body: 'Download notes as Markdown, TXT, PDF, or DOCX.', accent: 'text-accent-cyan' },
]

export default function FeatureGrid() {
  const reduce = useReducedMotion()
  return (
    <SectionShell id="features">
      <SectionHeading
        eyebrow="One lecture, everything you need"
        title="A complete study toolkit"
        subtitle="Capture once — then review, question, and practise from the same grounded source."
      />
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
            className={cn(
              'group rounded-2xl border border-marketing-line bg-marketing-surface p-5 transition-colors hover:border-brand-500/40',
              f.span,
            )}
          >
            <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-xl bg-marketing-bg', f.accent)}>
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-marketing-text">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-marketing-textsoft">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}
