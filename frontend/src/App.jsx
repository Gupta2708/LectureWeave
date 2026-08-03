import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
// New Professional Components
import Dashboard_Professional from './pages/Dashboard_Professional'
import SubjectsManagement from './pages/SubjectsManagement'
import LectureSetup from './pages/LectureSetup'
import LiveLecture_New from './pages/LiveLecture_New'
// Old Components (fallback)
import Dashboard from './pages/Dashboard_new'
import Subjects from './pages/Subjects'
import SubjectDetail from './pages/SubjectDetail'
import LiveLecture from './pages/LiveLecture'
import NotesViewer from './pages/NotesViewer'
import Webinar from './pages/Webinar'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyNotes from './pages/MyNotes'

// Protected Route Component
//test
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-secondary-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            
            {/* Protected Routes - Using New Professional Components */}
            <Route path="/" element={<ProtectedRoute><Dashboard_Professional /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><SubjectsManagement /></ProtectedRoute>} />
            <Route path="/subjects/new" element={<ProtectedRoute><SubjectsManagement /></ProtectedRoute>} />
            <Route path="/subjects/:subjectId/setup" element={<ProtectedRoute><LectureSetup /></ProtectedRoute>} />
            <Route path="/subjects/:subjectId/lecture" element={<ProtectedRoute><LiveLecture_New /></ProtectedRoute>} />
            <Route path="/my-notes" element={<ProtectedRoute><MyNotes /></ProtectedRoute>} />
            <Route path="/lecture/:lectureId" element={<ProtectedRoute><NotesViewer /></ProtectedRoute>} />
            
            {/* Old Routes (Fallback) */}
            <Route path="/old-dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/subjects/:subjectId" element={<ProtectedRoute><Layout><SubjectDetail /></Layout></ProtectedRoute>} />
            <Route path="/notes/:id" element={<ProtectedRoute><Layout><NotesViewer /></Layout></ProtectedRoute>} />
            <Route path="/webinar" element={<ProtectedRoute><Layout><Webinar /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          </Routes>
          
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
