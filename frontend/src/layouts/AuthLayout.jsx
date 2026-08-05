import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ShieldCheck, Sparkles, Quote } from 'lucide-react'
import Wordmark from '../components/brand/Wordmark'

/**
 * Split auth shell: branded story panel (desktop) + focused form area.
 * The form itself is rendered by the Login/Signup routes via <Outlet />.
 */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-[38%] max-w-[30rem] overflow-hidden bg-marketing-bg lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(600px circle at 20% 20%, rgba(91,92,226,0.35), transparent 55%), radial-gradient(500px circle at 80% 70%, rgba(139,92,246,0.28), transparent 55%)',
          }}
        />
        <div className="relative z-10">
          <Link to="/" aria-label="LectureWeave home">
            <Wordmark tone="dark" size={30} />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-marketing-line bg-marketing-surface/70 px-3 py-1 text-xs font-medium text-marketing-textsoft">
            <Sparkles className="h-3.5 w-3.5" /> Grounded AI study workspace
          </p>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-marketing-text">
            Turn every lecture into notes you can trust.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-marketing-textsoft">
            Transcribe live audio, connect it with your own course material, and
            build cited notes, flashcards, quizzes, and answers — grounded in
            what you are actually studying.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-marketing-line bg-marketing-surface/60 p-4">
            <Quote className="h-5 w-5 shrink-0 text-brand-400" />
            <p className="text-sm text-marketing-textsoft">
              Every generated claim links back to the exact page, slide, or
              transcript moment it came from.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-marketing-textsoft">
          <ShieldCheck className="h-4 w-4" />
          Private by default — your subjects and lectures are scoped to you.
        </div>
      </aside>

      {/* Form area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link to="/" aria-label="LectureWeave home">
            <Wordmark />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
