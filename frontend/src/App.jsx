import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Active LectureWeave routes
import Dashboard_Professional from './pages/Dashboard_Professional'
import SubjectsManagement from './pages/SubjectsManagement'
import LectureSetup from './pages/LectureSetup'
import LiveLecture_New from './pages/LiveLecture_New'
import NotesViewer from './pages/NotesViewer'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyNotes from './pages/MyNotes'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return !isAuthenticated ? children : <Navigate to="/" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-secondary-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected LectureWeave routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard_Professional /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><SubjectsManagement /></ProtectedRoute>} />
            <Route path="/subjects/new" element={<ProtectedRoute><SubjectsManagement /></ProtectedRoute>} />
            <Route path="/subjects/:subjectId/setup" element={<ProtectedRoute><LectureSetup /></ProtectedRoute>} />
            <Route path="/subjects/:subjectId/lecture" element={<ProtectedRoute><LiveLecture_New /></ProtectedRoute>} />
            <Route path="/my-notes" element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
            <Route path="/lecture/:lectureId" element={<ProtectedRoute><NotesViewer /></ProtectedRoute>} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
