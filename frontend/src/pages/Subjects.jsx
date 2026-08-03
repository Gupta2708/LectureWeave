import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  FileText,
  Star,
  ChevronRight,
  Grid,
  List,
  Mic,
  Users,
  ArrowLeft,
  Home
} from 'lucide-react'

const subjects = [
  {
    id: 1,
    name: 'Machine Learning',
    code: 'CS-401',
    instructor: 'Dr. Sarah Johnson',
    lectureCount: 8,
    totalHours: 16.5,
    lastLecture: '2024-10-18',
    nextLecture: '2024-10-22',
    color: 'bg-blue-500',
    progress: 75,
    starred: true,
    description: 'Introduction to machine learning algorithms and applications'
  },
  {
    id: 2,
    name: 'Data Structures & Algorithms',
    code: 'CS-301',
    instructor: 'Prof. Michael Chen',
    lectureCount: 12,
    totalHours: 24,
    lastLecture: '2024-10-17',
    nextLecture: '2024-10-21',
    color: 'bg-green-500',
    progress: 90,
    starred: false,
    description: 'Fundamental data structures and algorithmic problem solving'
  },
  {
    id: 3,
    name: 'Database Management Systems',
    code: 'CS-302',
    instructor: 'Dr. Emily Rodriguez',
    lectureCount: 6,
    totalHours: 12,
    lastLecture: '2024-10-16',
    nextLecture: '2024-10-23',
    color: 'bg-purple-500',
    progress: 60,
    starred: true,
    description: 'Database design, SQL, and database administration'
  },
  {
    id: 4,
    name: 'Linear Algebra',
    code: 'MATH-201',
    instructor: 'Prof. David Kim',
    lectureCount: 10,
    totalHours: 20,
    lastLecture: '2024-10-15',
    nextLecture: '2024-10-20',
    color: 'bg-orange-500',
    progress: 80,
    starred: false,
    description: 'Vector spaces, matrices, and linear transformations'
  },
  {
    id: 5,
    name: 'Organic Chemistry',
    code: 'CHEM-301',
    instructor: 'Dr. Lisa Wang',
    lectureCount: 9,
    totalHours: 18,
    lastLecture: '2024-10-14',
    nextLecture: '2024-10-24',
    color: 'bg-red-500',
    progress: 70,
    starred: false,
    description: 'Organic compounds, reactions, and synthesis mechanisms'
  }
]

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStarred = !showStarredOnly || subject.starred
    return matchesSearch && matchesStarred
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to="/" 
            className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              My Subjects
            </h1>
            <p className="text-secondary-600">
              Manage your enrolled subjects and lecture notes
            </p>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                showStarredOnly 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
              <span>Starred</span>
            </button>

            <div className="flex items-center bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-secondary-600 hover:text-secondary-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid/List */}
      {filteredSubjects.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No subjects found</h3>
          <p className="text-secondary-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first subject to get started'}
          </p>
          <button className="btn-primary">
            Add Subject
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredSubjects.map((subject) => (
            <div key={subject.id} className={`card hover:shadow-md transition-shadow duration-200 ${
              viewMode === 'list' ? 'flex items-center space-x-6' : ''
            }`}>
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${subject.color}`} />
                      <div>
                        <h3 className="font-semibold text-secondary-900">{subject.name}</h3>
                        <p className="text-sm text-secondary-600">{subject.code}</p>
                      </div>
                    </div>
                    <button className={`text-secondary-400 hover:text-yellow-500 transition-colors duration-200 ${
                      subject.starred ? 'text-yellow-500' : ''
                    }`}>
                      <Star className={`w-4 h-4 ${subject.starred ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-sm text-secondary-600 mb-4">{subject.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-secondary-600">
                      <span>Instructor: {subject.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-secondary-600">
                      <span>{subject.lectureCount} lectures</span>
                      <span>{subject.totalHours}h total</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-secondary-600">
                      <span>Next: {subject.nextLecture}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-secondary-600 mb-1">
                      <span>Progress</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${subject.color}`}
                        style={{ width: `${subject.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      to={`/subjects/${subject.id}/lecture`}
                      className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Lecture</span>
                    </Link>
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              ) : (
                // List View
                <>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-4 h-4 rounded-full ${subject.color} flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-secondary-900">{subject.name}</h3>
                        <span className="text-sm text-secondary-600">({subject.code})</span>
                        {subject.starred && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-secondary-600 mb-2">{subject.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-secondary-600">
                        <span>{subject.instructor}</span>
                        <span>{subject.lectureCount} lectures</span>
                        <span>{subject.totalHours}h total</span>
                        <span>Next: {subject.nextLecture}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-sm font-medium text-secondary-900">{subject.progress}%</div>
                      <div className="text-xs text-secondary-600">Complete</div>
                    </div>
                    <Link
                      to={`/subjects/${subject.id}/lecture`}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Lecture</span>
                    </Link>
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>View</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
