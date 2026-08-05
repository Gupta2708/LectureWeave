/*
 * Shared motion tokens. Keep durations short and animate transform/opacity
 * only. Every consumer must also respect useReducedMotion() from framer-motion.
 */
export const DURATION = {
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
}

// Expressive "ease-out-back-ish" curve used for entrances.
export const EASE_OUT = [0.16, 1, 0.3, 1]

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
