import React from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Mic, 
  FileText, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Users,
  Play,
  Star,
  Calendar,
  ChevronRight,
  User,
  ArrowRight
} from 'lucide-react'

const stats = [
  { name: 'Active Subjects', value: '5', icon: BookOpen, color: 'text-blue-600' },
  { name: 'Total Lectures', value: '23', icon: Mic, color: 'text-green-600' },
  { name: 'Notes Generated', value: '45', icon: FileText, color: 'text-purple-600' },
  { name: 'Study Hours', value: '32.5', icon: Clock, color: 'text-orange-600' },
]

const recentSubjects = [
  {
    id: 1,
    name: 'Machine Learning',
    code: 'CS-401',
    lectureCount: 8,
    lastLecture: '2024-10-18',
    color: 'bg-blue-500',
    progress: 75
  },
  {
    id: 2,
    name: 'Data Structures',
    code: 'CS-301',
    lectureCount: 12,
    lastLecture: '2024-10-17',
    color: 'bg-green-500',
    progress: 90
  },
  {
    id: 3,
    name: 'Database Systems',
    code: 'CS-302',
    lectureCount: 6,
    lastLecture: '2024-10-16',
    color: 'bg-purple-500',
    progress: 60
  }
]

const mainNavigation = [
  {
    title: 'My Subjects',
    description: 'View all your enrolled subjects and lectures',
    icon: BookOpen,
    href: '/subjects',
    color: 'bg-blue-500 hover:bg-blue-600',
    stats: '5 Active Subjects'
  },
  {
    title: 'Webinar',
    description: 'Join live webinars and host sessions',
    icon: Users,
    href: '/webinar',
    color: 'bg-green-500 hover:bg-green-600',
    stats: '2 Live Sessions'
  },
  {
    title: 'Profile',
    description: 'Manage your account and preferences',
    icon: User,
    href: '/profile',
    color: 'bg-purple-500 hover:bg-purple-600',
    stats: 'Settings & Data'
  }
]

const quickActions = [
  {
    title: 'Quick Lecture',
    description: 'Start recording a lecture immediately',
    icon: Mic,
    href: '/subjects',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    title: 'Browse Notes',
    description: 'Search through all your lecture notes',
    icon: FileText,
    href: '/subjects',
    color: 'bg-orange-500 hover:bg-orange-600'
  }
]

export default function Dashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Welcome to LectureWeave
        </h1>
        <p className="text-secondary-600">
          AI-powered intelligent lecture note generation system
        </p>
      </div>

      {/* Main Navigation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-6">Main Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainNavigation.map((nav) => (
            <Link
              key={nav.title}
              to={nav.href}
              className="card hover:shadow-lg transition-all duration-200 group border-2 border-transparent hover:border-primary-200"
            >
              <div className="text-center p-4">
                <div className={`w-16 h-16 rounded-full text-white ${nav.color} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <nav.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">
                  {nav.title}
                </h3>
                <p className="text-secondary-600 text-sm mb-3">
                  {nav.description}
                </p>
                <div className="text-primary-600 font-medium text-sm">
                  {nav.stats}
                </div>
                <div className="flex items-center justify-center mt-4 text-primary-600 group-hover:text-primary-700">
                  <span className="text-sm font-medium mr-2">Open</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-secondary-100 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.name}</p>
                <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="card hover:shadow-md transition-shadow duration-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg text-white ${action.color} transition-colors duration-200`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                    {action.title}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Subjects and Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Subjects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">My Subjects</h2>
            <Link 
              to="/subjects" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentSubjects.map((subject) => (
              <Link 
                key={subject.id} 
                to={`/subjects/${subject.id}`}
                className="block p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                    <div>
                      <h3 className="font-medium text-secondary-900">{subject.name}</h3>
                      <p className="text-sm text-secondary-600">{subject.code}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-secondary-400" />
                </div>
                <div className="flex items-center justify-between text-sm text-secondary-600">
                  <span>{subject.lectureCount} lectures</span>
                  <span>Last: {subject.lastLecture}</span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-secondary-600 mb-1">
                    <span>Progress</span>
                    <span>{subject.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${subject.color}`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div className="card">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">How LectureWeave Works</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Document Upload</h3>
                <p className="text-sm text-secondary-600">Upload lecture materials for better context</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Mic className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Live Recording</h3>
                <p className="text-sm text-secondary-600">Real-time audio capture and transcription</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">AI Processing</h3>
                <p className="text-sm text-secondary-600">Intelligent summarization and organization</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-secondary-900">Structured Notes</h3>
                <p className="text-sm text-secondary-600">Well-organized, exportable study materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
