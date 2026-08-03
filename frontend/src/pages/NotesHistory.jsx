import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Trash2,
  Eye,
  Star,
  StarOff,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { formatDuration } from '../lib/utils'
import { format } from 'date-fns'

const mockLectures = [
  {
    id: 1,
    title: 'Introduction to Machine Learning',
    date: '2024-10-18T10:30:00Z',
    duration: 6300, // seconds
    status: 'completed',
    notesGenerated: true,
    starred: true,
    subject: 'Computer Science',
    tags: ['ML', 'AI', 'Algorithms'],
    transcriptionAccuracy: 95,
    notesQuality: 'High'
  },
  {
    id: 2,
    title: 'Data Structures and Algorithms',
    date: '2024-10-17T14:20:00Z',
    duration: 8100,
    status: 'completed',
    notesGenerated: true,
    starred: false,
    subject: 'Computer Science',
    tags: ['DSA', 'Programming'],
    transcriptionAccuracy: 92,
    notesQuality: 'High'
  },
  {
    id: 3,
    title: 'Database Management Systems',
    date: '2024-10-16T09:15:00Z',
    duration: 5400,
    status: 'processing',
    notesGenerated: false,
    starred: false,
    subject: 'Computer Science',
    tags: ['Database', 'SQL'],
    transcriptionAccuracy: 88,
    notesQuality: 'Medium'
  },
  {
    id: 4,
    title: 'Linear Algebra Fundamentals',
    date: '2024-10-15T11:00:00Z',
    duration: 7200,
    status: 'completed',
    notesGenerated: true,
    starred: true,
    subject: 'Mathematics',
    tags: ['Math', 'Linear Algebra'],
    transcriptionAccuracy: 90,
    notesQuality: 'High'
  },
  {
    id: 5,
    title: 'Organic Chemistry Reactions',
    date: '2024-10-14T13:30:00Z',
    duration: 6900,
    status: 'completed',
    notesGenerated: true,
    starred: false,
    subject: 'Chemistry',
    tags: ['Chemistry', 'Organic'],
    transcriptionAccuracy: 85,
    notesQuality: 'Medium'
  }
]

const subjects = ['All Subjects', 'Computer Science', 'Mathematics', 'Chemistry']
const sortOptions = [
  { value: 'date-desc', label: 'Date (Newest First)' },
  { value: 'date-asc', label: 'Date (Oldest First)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'duration-desc', label: 'Duration (Longest First)' },
  { value: 'duration-asc', label: 'Duration (Shortest First)' }
]

export default function NotesHistory() {
  const [lectures, setLectures] = useState(mockLectures)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [sortBy, setSortBy] = useState('date-desc')
  const [showFilters, setShowFilters] = useState(false)

  const toggleStar = (id) => {
    setLectures(prev => prev.map(lecture => 
      lecture.id === id ? { ...lecture, starred: !lecture.starred } : lecture
    ))
  }

  const deleteLecture = (id) => {
    setLectures(prev => prev.filter(lecture => lecture.id !== id))
  }

  const filteredAndSortedLectures = React.useMemo(() => {
    let filtered = lectures.filter(lecture => {
      const matchesSearch = lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lecture.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSubject = selectedSubject === 'All Subjects' || lecture.subject === selectedSubject
      return matchesSearch && matchesSubject
    })

    // Sort lectures
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date) - new Date(a.date)
        case 'date-asc':
          return new Date(a.date) - new Date(b.date)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        case 'duration-desc':
          return b.duration - a.duration
        case 'duration-asc':
          return a.duration - b.duration
        default:
          return 0
      }
    })

    return filtered
  }, [lectures, searchTerm, selectedSubject, sortBy])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Processing</span>
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>
      default:
        return null
    }
  }

  const getQualityBadge = (quality) => {
    const colors = {
      'High': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Low': 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[quality] || colors.Medium}`}>
        {quality} Quality
      </span>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Lecture History
        </h1>
        <p className="text-secondary-600">
          Browse and manage all your recorded lectures and generated notes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input min-w-0"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="input"
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-secondary-600">
          Showing {filteredAndSortedLectures.length} of {lectures.length} lectures
        </p>
        <div className="flex items-center space-x-2 text-sm text-secondary-600">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {format(new Date(), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Lectures Grid */}
      {filteredAndSortedLectures.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No lectures found</h3>
          <p className="text-secondary-600 mb-4">
            {searchTerm || selectedSubject !== 'All Subjects' 
              ? 'Try adjusting your search or filters' 
              : 'Start recording lectures to see them here'
            }
          </p>
          <Link to="/lecture" className="btn-primary">
            Start Recording
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedLectures.map((lecture) => (
            <div key={lecture.id} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {lecture.title}
                        </h3>
                        <button
                          onClick={() => toggleStar(lecture.id)}
                          className="text-secondary-400 hover:text-yellow-500 transition-colors duration-200"
                        >
                          {lecture.starred ? (
                            <Star className="w-5 h-5 fill-current text-yellow-500" />
                          ) : (
                            <StarOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-secondary-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(lecture.date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(lecture.duration)}</span>
                        </div>
                        <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                          {lecture.subject}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mb-3">
                        {getStatusBadge(lecture.status)}
                        {lecture.notesGenerated && getQualityBadge(lecture.notesQuality)}
                        <span className="text-xs text-secondary-600">
                          {lecture.transcriptionAccuracy}% accuracy
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {lecture.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  {lecture.notesGenerated && (
                    <Link
                      to={`/notes/${lecture.id}`}
                      className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                      title="View Notes"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  )}
                  
                  <button
                    className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => deleteLecture(lecture.id)}
                    className="p-2 text-secondary-500 hover:text-red-600 transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
