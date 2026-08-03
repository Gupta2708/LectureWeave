import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BookOpen, 
  Upload, 
  Mic, 
  History, 
  Settings,
  Brain,
  Menu,
  X,
  User,
  LogOut
} from 'lucide-react'
import { cn } from '../lib/utils.js'

// Navigation moved to dashboard - keeping this for reference
const navigation = []

export default function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">LectureWeave</span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-secondary-900">John Doe</p>
                  <p className="text-xs text-secondary-600">Student</p>
                </div>
              </div>
              <button className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-900 transition-colors duration-200">
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        {children}
      </main>
    </div>
  )
}
