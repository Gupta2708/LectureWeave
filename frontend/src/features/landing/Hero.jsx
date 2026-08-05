import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import Button from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import AnimatedKnowledgeField from './AnimatedKnowledgeField'
import HeroVisual from './HeroVisual'

export default function Hero() {
  const { isAuthenticated } = useAuth()
  const reduce = useReducedMotion()

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 } },
  }
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  }

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36">
      <AnimatedKnowledgeField />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-marketing-line bg-marketing-surface/70 px-3 py-1 text-xs font-medium text-marketing-textsoft"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Grounded AI notes for every lecture
          </motion.p>

          <motion.h1
            variants={item}
            className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-marketing-text sm:text-5xl lg:text-6xl"
          >
            Turn every lecture into{' '}
            <span className="bg-gradient-to-r from-brand-400 to-accent-violet bg-clip-text text-transparent">
              notes you can trust
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-lg leading-relaxed text-marketing-textsoft"
          >
            LectureWeave transcribes live audio, connects it with your course
            material, and creates cited notes, flashcards, quizzes, and answers
            grounded in what you are actually studying.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button as={Link} to="/app" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open app
              </Button>
            ) : (
              <Button as={Link} to="/signup" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get started
              </Button>
            )}
            <Button
              as="a"
              href="#how-it-works"
              size="lg"
              variant="outline"
              className="border-marketing-line text-marketing-text hover:bg-marketing-surface"
            >
              See how it works
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  )
}
