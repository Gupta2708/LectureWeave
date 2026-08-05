import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { ProtectedRoute, PublicOnlyRoute } from './guards'
import MarketingLayout from '../layouts/MarketingLayout'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import FocusLayout from '../layouts/FocusLayout'

import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Dashboard_Professional from '../pages/Dashboard_Professional'
import SubjectsManagement from '../pages/SubjectsManagement'
import LectureSetup from '../pages/LectureSetup'
import LiveLecture_New from '../pages/LiveLecture_New'
import NotesViewer from '../pages/NotesViewer'
import MyNotes from '../pages/MyNotes'
import SubjectChatPage from '../pages/SubjectChatPage'
import FlashcardsPage from '../pages/FlashcardsPage'
import QuizPage from '../pages/QuizPage'

// Landing is code-split so its marketing/animation code stays out of the app bundle.
const LandingPage = lazy(() => import('../pages/LandingPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  )
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public marketing */}
      <Route element={<MarketingLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteFallback />}>
              <LandingPage />
            </Suspense>
          }
        />
      </Route>

      {/* Auth (signed-out only) */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Dashboard_Professional />} />
          <Route path="/subjects" element={<SubjectsManagement />} />
          <Route path="/subjects/new" element={<SubjectsManagement />} />
          <Route path="/subjects/:subjectId/setup" element={<LectureSetup />} />
          <Route path="/subjects/:subjectId/chat" element={<SubjectChatPage />} />
          <Route path="/subjects/:subjectId/flashcards" element={<FlashcardsPage />} />
          <Route path="/subjects/:subjectId/quizzes" element={<QuizPage />} />
          <Route path="/my-notes" element={<MyNotes />} />
          <Route path="/lecture/:lectureId" element={<NotesViewer />} />
          <Route path="/notes/:id" element={<NotesViewer />} />
        </Route>

        {/* Live lecture is isolated in FocusLayout so the recorder/WebSocket
            are never remounted by app-shell chrome or route animation. */}
        <Route element={<FocusLayout />}>
          <Route path="/subjects/:subjectId/lecture" element={<LiveLecture_New />} />
        </Route>
      </Route>

      {/* Compatibility + fallback */}
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
