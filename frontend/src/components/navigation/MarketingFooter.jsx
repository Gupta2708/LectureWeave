import React from 'react'
import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import Wordmark from '../brand/Wordmark'

const REPO_URL = 'https://github.com/Gupta2708/LectureWeave'

const PRODUCT = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Grounded AI', href: '#grounded' },
]

const RESOURCES = [
  { label: 'Documentation', href: `${REPO_URL}/tree/main/docs` },
  { label: 'Architecture', href: `${REPO_URL}/blob/main/docs/architecture.md` },
  { label: 'Security', href: `${REPO_URL}/blob/main/SECURITY.md` },
]

export default function MarketingFooter() {
  const year = 2026
  return (
    <footer className="border-t border-marketing-line bg-marketing-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div className="max-w-xs">
          <Wordmark tone="dark" />
          <p className="mt-4 text-sm leading-relaxed text-marketing-textsoft">
            Grounded AI notes for every lecture — transcribe live audio, connect
            it to your course material, and study from cited notes you can trust.
          </p>
        </div>

        <FooterColumn title="Product" links={PRODUCT} />
        <FooterColumn title="Resources" links={RESOURCES} external />

        <div>
          <h3 className="text-sm font-semibold text-marketing-text">Project</h3>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-marketing-line px-3 py-2 text-sm text-marketing-textsoft transition-colors hover:text-marketing-text"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>

      <div className="border-t border-marketing-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-marketing-textsoft sm:flex-row sm:px-6">
          <p>© {year} LectureWeave</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-marketing-text">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-marketing-text">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links, external }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-marketing-text">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="text-sm text-marketing-textsoft transition-colors hover:text-marketing-text"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
