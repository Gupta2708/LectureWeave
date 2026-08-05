import React from 'react'
import { Lock, ShieldCheck, Quote, Server } from 'lucide-react'
import { SectionShell, SectionHeading } from './marketingBits'

const POINTS = [
  { icon: Lock, title: 'User-scoped data', body: 'Your subjects, lectures, and documents are visible only to you.' },
  { icon: ShieldCheck, title: 'Authenticated access', body: 'Every request is authenticated; ownership is enforced server-side.' },
  { icon: Quote, title: 'Source-linked output', body: 'Generated notes cite the material they were built from.' },
  { icon: Server, title: 'Your deployment', body: 'Transcription runs locally or server-side, per how you deploy it.' },
]

export default function TrustSection() {
  return (
    <SectionShell>
      <SectionHeading
        eyebrow="Trust & privacy"
        title="Built to be dependable"
        subtitle="Only claims the product actually supports — no dark patterns, no invented numbers."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map((p) => (
          <div key={p.title} className="rounded-2xl border border-marketing-line bg-marketing-surface p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-marketing-bg text-brand-300">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-marketing-text">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-marketing-textsoft">{p.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
