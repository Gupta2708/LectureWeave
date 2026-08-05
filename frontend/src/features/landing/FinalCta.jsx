import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'

export default function FinalCta() {
  const { isAuthenticated } = useAuth()
  const reduce = useReducedMotion()
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-marketing-surface p-10 text-center sm:p-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                'radial-gradient(500px circle at 30% 20%, rgba(91,92,226,0.30), transparent 60%), radial-gradient(400px circle at 75% 80%, rgba(139,92,246,0.24), transparent 60%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-marketing-text sm:text-4xl">
              Make your next lecture easier to revisit
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-marketing-textsoft">
              Start capturing grounded, cited study material in minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isAuthenticated ? (
                <Button as={Link} to="/app" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Open app
                </Button>
              ) : (
                <>
                  <Button as={Link} to="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Start with LectureWeave
                  </Button>
                  <Button
                    as={Link}
                    to="/login"
                    size="lg"
                    variant="outline"
                    className="border-marketing-line text-marketing-text hover:bg-marketing-bg"
                  >
                    Log in
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
