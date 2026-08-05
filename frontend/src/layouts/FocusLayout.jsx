import React from 'react'
import { Outlet } from 'react-router-dom'

/**
 * Distraction-free layout for the live-lecture route.
 *
 * CRITICAL: this renders <Outlet /> as a bare, stable child — NO route key,
 * NO AnimatePresence/PageTransition, NO sidebar/topbar chrome. Any of those
 * would remount LiveLecture_New and tear down the active WebSocket + audio
 * recorder + timer. The live page keeps its own header for now; a slim focus
 * session bar is added in phase UI-5 (in place, without changing recorder
 * lifecycle).
 */
export default function FocusLayout() {
  return <Outlet />
}
