import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, User } from 'lucide-react'

const mainNavigation = [
  {
    title: 'My Subjects',
    description: 'View all your enrolled subjects and lectures',
    icon: BookOpen,
    href: '/subjects',
    color: 'bg-blue-500',
    stats: '5 Active Subjects'
  },
  {
    title: 'Webinar',
    description: 'Join live webinars and host sessions',
    icon: Users,
    href: '/webinar',
    color: 'bg-green-500',
    stats: '2 Live Sessions'
  },
  {
    title: 'Profile',
    description: 'Manage your account and preferences',
    icon: User,
    href: '/profile',
    color: 'bg-purple-500',
    stats: 'Settings & Data'
  }
]

export default function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to LectureWeave
        </h1>
        <p className="text-gray-600">
          AI-powered intelligent lecture note generation system
        </p>
      </div>
       <p className='text-xl text-black'>Please use personal internet for this project</p>

      {/* Main Navigation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Main Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainNavigation.map((nav) => (
            <Link
              key={nav.title}
              to={nav.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center p-4">
                <div className={`w-16 h-16 rounded-full text-white ${nav.color} mx-auto mb-4 flex items-center justify-center`}>
                  <nav.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {nav.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {nav.description}
                </p>
                <div className="text-blue-600 font-medium text-sm">
                  {nav.stats}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
