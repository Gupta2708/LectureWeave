import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Wordmark from '../brand/Wordmark'
import Button from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

const LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#grounded', label: 'Grounded AI' },
]

export default function MarketingNavbar() {
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        scrolled
          ? 'border-b border-marketing-line bg-marketing-bg/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" aria-label="LectureWeave home">
          <Wordmark tone="dark" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-marketing-textsoft transition-colors hover:text-marketing-text"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Button as={Link} to="/app" size="sm">
              Open app
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-marketing-textsoft transition-colors hover:text-marketing-text"
              >
                Log in
              </Link>
              <Button as={Link} to="/signup" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="rounded-lg p-2 text-marketing-text md:hidden"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-marketing-line bg-marketing-bg md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-marketing-textsoft hover:bg-marketing-surface hover:text-marketing-text"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                {isAuthenticated ? (
                  <Button as={Link} to="/app" onClick={() => setMenuOpen(false)}>
                    Open app
                  </Button>
                ) : (
                  <>
                    <Button
                      as={Link}
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                    >
                      Get started
                    </Button>
                    <Button
                      as={Link}
                      to="/login"
                      variant="outline"
                      onClick={() => setMenuOpen(false)}
                      className="border-marketing-line text-marketing-text hover:bg-marketing-surface"
                    >
                      Log in
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
