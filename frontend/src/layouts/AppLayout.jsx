import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import AppSidebar from '../components/navigation/AppSidebar'
import AppTopbar from '../components/navigation/AppTopbar'
import MobileNavigation from '../components/navigation/MobileNavigation'
import { DURATION, EASE_OUT } from '../components/motion/motion'

const COLLAPSE_KEY = 'lw_sidebar_collapsed'

export default function AppLayout() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1">
          {/* Keyed on pathname → entrance replays per route with no exit delay
              (navigation is never blocked). The live-lecture route is under
              FocusLayout, not here, so the recorder is never remounted. */}
          <motion.div
            key={location.pathname}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <MobileNavigation open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  )
}
