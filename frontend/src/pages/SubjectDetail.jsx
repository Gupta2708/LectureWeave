import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Mic,
  FileText,
  Calendar,
  Clock,
  User,
  Star,
  StarOff,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Upload,
  BookOpen,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { formatDuration } from '../lib/utils.js'
import { environment } from '../config/environment'

// Mock subject data
const subjectData = {
  1: {
    id: 1,
    name: 'Machine Learning',
    code: 'CS-401',
    instructor: 'Dr. Sarah Johnson',
    description: 'Introduction to machine learning algorithms and applications including supervised learning, unsupervised learning, and neural networks.',
    color: 'bg-blue-500',
    semester: 'Fall 2024',
    credits: 3,
    starred: true,
    documents: [
      { id: 1, name: 'Course Syllabus.pdf', uploadedAt: '2024-09-01', size: '245 KB' },
      { id: 2, name: 'ML Fundamentals Slides.pptx', uploadedAt: '2024-09-15', size: '2.1 MB' },
      { id: 3, name: 'Linear Regression Notes.pdf', uploadedAt: '2024-10-01', size: '890 KB' }
    ],
    lectures: [
      {
        id: 1,
        title: 'Introduction to Machine Learning',
        date: '2024-10-18T10:30:00Z',
        duration: 6300,
        status: 'completed',
        notesGenerated: true,
        starred: true,
        topics: ['ML Overview', 'Types of Learning', 'Applications']
      },
      {
        id: 2,
        title: 'Linear Regression Deep Dive',
        date: '2024-10-16T10:30:00Z',
        duration: 5400,
        status: 'completed',
        notesGenerated: true,
        starred: false,
        topics: ['Linear Models', 'Least Squares', 'Gradient Descent']
      },
      {
        id: 3,
        title: 'Classification Algorithms',
        date: '2024-10-14T10:30:00Z',
        duration: 6000,
        status: 'completed',
        notesGenerated: true,
        starred: true,
        topics: ['Logistic Regression', 'Decision Trees', 'SVM']
      },
      {
        id: 4,
        title: 'Neural Networks Basics',
        date: '2024-10-12T10:30:00Z',
        duration: 7200,
        status: 'processing',
        notesGenerated: false,
        starred: false,
        topics: ['Perceptron', 'Backpropagation', 'Activation Functions']
      }
    ]
  }
}

export default function SubjectDetail() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [activeTab, setActiveTab] = useState('lectures') // 'lectures' or 'documents'
  const [showLectureSetup, setShowLectureSetup] = useState(false)
  const [lectureTitle, setLectureTitle] = useState('')
  const [lectureDocuments, setLectureDocuments] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  
  const subject = subjectData[subjectId]
  
  if (!subject) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">Subject not found</h3>
          <Link to="/subjects" className="btn-primary">
            Back to Subjects
          </Link>
        </div>
      </div>
    )
  }

  const filteredLectures = subject.lectures.filter(lecture => {
    const matchesSearch = lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lecture.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStarred = !showStarredOnly || lecture.starred
    return matchesSearch && matchesStarred
  })

  const toggleStar = () => {
    // Toggle subject star status
  }

  const toggleLectureStar = (lectureId) => {
    // Toggle lecture star status
  }

  const handleFileUpload = (files) => {
    const newDocuments = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      status: 'ready' // 'ready', 'uploading', 'uploaded', 'error'
    }))
    setLectureDocuments([...lectureDocuments, ...newDocuments])
  }

  const removeDocument = (docId) => {
    setLectureDocuments(lectureDocuments.filter(doc => doc.id !== docId))
  }

  const startLecture = async () => {
    if (!lectureTitle.trim()) {
      alert('Please enter a lecture title')
      return
    }

    setIsUploading(true)
    
    try {
      // Create lecture in backend
      const lectureResponse = await fetch(`${environment.API_BASE_URL}/api/lectures/`, {
        method: 'POST',
         headers: {
    ...getAuthHeader(),
    "Content-Type": "application/json",
    'ngrok-skip-browser-warning': 'true', // ⬅️ prevents the ngrok banner
  },
        body: JSON.stringify({
          subject_id: subjectId,
          title: lectureTitle
        })
      })
      
      const lectureData = await lectureResponse.json()
      
      // Upload documents if any
      if (lectureDocuments.length > 0) {
        const formData = new FormData()
        lectureDocuments.forEach(doc => {
          formData.append('files', doc.file)
        })
        
        await fetch(`${environment.API_BASE_URL}/api/documents/lecture/${lectureData.id}/upload`, {
          method: 'POST',
          body: formData
        })
      }

      setIsUploading(false)
      
      // Navigate to live lecture with the lecture ID
      navigate(`/subjects/${subjectId}/lecture`, {
        state: {
          lectureId: lectureData.id,
          lectureTitle,
          documents: lectureDocuments,
          subjectName: subject.name
        }
      })
    } catch (error) {
      console.error('Error starting lecture:', error)
      setIsUploading(false)
      alert('Error starting lecture. Please try again.')
    }
  }

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to="/subjects" 
            className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${subject.color}`} />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">{subject.name}</h1>
              <p className="text-secondary-600">{subject.code} • {subject.semester}</p>
            </div>
          </div>
          <button
            onClick={toggleStar}
            className="text-secondary-400 hover:text-yellow-500 transition-colors duration-200 ml-auto"
          >
            {subject.starred ? (
              <Star className="w-6 h-6 fill-current text-yellow-500" />
            ) : (
              <StarOff className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Subject Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-5 h-5 text-secondary-500" />
              <span className="font-medium text-secondary-900">Instructor</span>
            </div>
            <p className="text-secondary-700">{subject.instructor}</p>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-5 h-5 text-secondary-500" />
              <span className="font-medium text-secondary-900">Lectures</span>
            </div>
            <p className="text-secondary-700">{subject.lectures.length} recorded</p>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3 mb-2">
              <Upload className="w-5 h-5 text-secondary-500" />
              <span className="font-medium text-secondary-900">Documents</span>
            </div>
            <p className="text-secondary-700">{subject.documents.length} uploaded</p>
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="font-semibold text-secondary-900 mb-2">Description</h3>
          <p className="text-secondary-700">{subject.description}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={() => setShowLectureSetup(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Mic className="w-4 h-4" />
            <span>Start New Lecture</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export All Notes</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lectures')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'lectures'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Lectures ({subject.lectures.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'documents'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Documents ({subject.documents.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'lectures' ? (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
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

            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                showStarredOnly 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
              <span>Starred Only</span>
            </button>
          </div>

          {/* Lectures List */}
          {filteredLectures.length === 0 ? (
            <div className="card text-center py-12">
              <Mic className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No lectures found</h3>
              <p className="text-secondary-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start your first lecture recording'}
              </p>
              <Link to={`/subjects/${subjectId}/lecture`} className="btn-primary">
                Start Recording
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLectures.map((lecture) => (
                <div key={lecture.id} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {lecture.title}
                        </h3>
                        <button
                          onClick={() => toggleLectureStar(lecture.id)}
                          className="text-secondary-400 hover:text-yellow-500 transition-colors duration-200"
                        >
                          {lecture.starred ? (
                            <Star className="w-4 h-4 fill-current text-yellow-500" />
                          ) : (
                            <StarOff className="w-4 h-4" />
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
                        {getStatusBadge(lecture.status)}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {lecture.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
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
        </>
      ) : (
        /* Documents Tab */
        <div className="space-y-4">
          {subject.documents.length === 0 ? (
            <div className="card text-center py-12">
              <Upload className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents uploaded</h3>
              <p className="text-secondary-600 mb-4">
                Upload reference materials to enhance AI-generated notes
              </p>
              <button className="btn-primary">
                Upload Documents
              </button>
            </div>
          ) : (
            subject.documents.map((doc) => (
              <div key={doc.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-secondary-500" />
                    <div>
                      <h3 className="font-medium text-secondary-900">{doc.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-secondary-600">
                        <span>{doc.size}</span>
                        <span>Uploaded {doc.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200">
                      <Download className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-secondary-500 hover:text-red-600 transition-colors duration-200">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lecture Setup Modal */}
      {showLectureSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary-900">Start New Lecture</h2>
                <button
                  onClick={() => setShowLectureSetup(false)}
                  className="text-secondary-500 hover:text-secondary-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Lecture Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="Enter lecture title..."
                  className="input"
                />
              </div>

              {/* Document Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Upload Lecture Documents
                </label>
                <p className="text-sm text-secondary-600 mb-4">
                  Upload slides, PDFs, or notes that will help generate better AI-powered lecture notes
                </p>
                
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-8 h-8 text-secondary-400 mb-2" />
                    <span className="text-secondary-600">Click to upload documents</span>
                    <span className="text-xs text-secondary-500 mt-1">
                      PDF, PPT, DOC, TXT files supported
                    </span>
                  </label>
                </div>
              </div>

              {/* Uploaded Documents */}
              {lectureDocuments.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-secondary-900 mb-3">Uploaded Documents</h3>
                  <div className="space-y-2">
                    {lectureDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-secondary-500" />
                          <div>
                            <p className="font-medium text-secondary-900">{doc.name}</p>
                            <p className="text-xs text-secondary-600">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.status === 'ready' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {doc.status === 'uploading' && (
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                          )}
                          {doc.status === 'uploaded' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {doc.status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <button
                            onClick={() => removeDocument(doc.id)}
                            className="text-secondary-500 hover:text-red-600"
                            disabled={isUploading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowLectureSetup(false)}
                  className="btn-secondary"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={startLecture}
                  disabled={!lectureTitle.trim() || isUploading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Start Lecture</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
