import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Calendar, 
  Clock, 
  Video, 
  Mic, 
  MicOff,
  VideoOff,
  Settings,
  Share2,
  MessageSquare,
  Hand,
  Monitor,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  MoreVertical,
  UserPlus,
  Link as LinkIcon,
  Download,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'

const upcomingWebinars = [
  {
    id: 1,
    title: 'Advanced Machine Learning Techniques',
    host: 'Dr. Sarah Johnson',
    date: '2024-10-22T14:00:00Z',
    duration: 90,
    attendees: 45,
    maxAttendees: 100,
    description: 'Deep dive into advanced ML algorithms including ensemble methods and neural networks',
    status: 'upcoming'
  },
  {
    id: 2,
    title: 'Database Optimization Strategies',
    host: 'Prof. Michael Chen',
    date: '2024-10-24T16:30:00Z',
    duration: 60,
    attendees: 32,
    maxAttendees: 50,
    description: 'Learn about query optimization, indexing strategies, and performance tuning',
    status: 'upcoming'
  },
  {
    id: 3,
    title: 'Introduction to Cloud Computing',
    host: 'Dr. Emily Rodriguez',
    date: '2024-10-25T10:00:00Z',
    duration: 120,
    attendees: 78,
    maxAttendees: 150,
    description: 'Overview of cloud platforms, services, and deployment strategies',
    status: 'upcoming'
  }
]

const liveWebinars = [
  {
    id: 4,
    title: 'React Best Practices Workshop',
    host: 'Alex Thompson',
    startedAt: '2024-10-19T13:00:00Z',
    duration: 120,
    attendees: 67,
    maxAttendees: 100,
    description: 'Hands-on workshop covering React hooks, state management, and performance optimization',
    status: 'live'
  }
]

export default function Webinar() {
  const [activeTab, setActiveTab] = useState('browse') // 'browse', 'joined', 'hosting'
  const [isInWebinar, setIsInWebinar] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoOff, setIsVideoOff] = useState(true)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)

  const joinWebinar = (webinarId) => {
    setIsInWebinar(true)
  }

  const leaveWebinar = () => {
    setIsInWebinar(false)
  }

  if (isInWebinar) {
    return (
      <div className="h-screen bg-secondary-900 flex flex-col">
        {/* Webinar Header */}
        <div className="bg-secondary-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-medium">LIVE</span>
            </div>
            <h1 className="text-white text-lg font-semibold">React Best Practices Workshop</h1>
            <span className="text-secondary-300 text-sm">with Alex Thompson</span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-300 text-sm">
            <span>67 participants</span>
            <span>1:23:45</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video Area */}
          <div className="flex-1 relative bg-secondary-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-white text-3xl font-bold">AT</span>
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">Alex Thompson</h3>
                <p className="text-secondary-300">Host • Speaking</p>
              </div>
            </div>

            {/* Screen Share Indicator */}
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Screen Sharing</span>
            </div>

            {/* Participants Grid (Small) */}
            <div className="absolute top-4 right-4 grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-16 bg-secondary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">User {i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 bg-white border-l border-secondary-200 flex flex-col">
            <div className="p-4 border-b border-secondary-200">
              <h3 className="font-semibold text-secondary-900">Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="text-sm">
                <span className="font-medium text-primary-600">Alex Thompson:</span>
                <span className="text-secondary-700 ml-2">Welcome everyone! Let's start with React hooks.</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-secondary-600">Sarah M:</span>
                <span className="text-secondary-700 ml-2">Great topic! Looking forward to this.</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-secondary-600">John D:</span>
                <span className="text-secondary-700 ml-2">Can you share the slides?</span>
              </div>
            </div>
            <div className="p-4 border-t border-secondary-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 input text-sm"
                />
                <button className="btn-primary py-2 px-3">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-secondary-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary-600 hover:bg-secondary-700'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-secondary-600 hover:bg-secondary-700'
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-5 h-5 text-white" />
              ) : (
                <Video className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={() => setIsSpeakerOff(!isSpeakerOff)}
              className="p-3 bg-secondary-600 hover:bg-secondary-700 rounded-full transition-colors duration-200"
            >
              {isSpeakerOff ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-3 bg-secondary-600 hover:bg-secondary-700 rounded-full transition-colors duration-200">
              <Hand className="w-5 h-5 text-white" />
            </button>

            <button className="p-3 bg-secondary-600 hover:bg-secondary-700 rounded-full transition-colors duration-200">
              <Share2 className="w-5 h-5 text-white" />
            </button>

            <button className="p-3 bg-secondary-600 hover:bg-secondary-700 rounded-full transition-colors duration-200">
              <Settings className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={leaveWebinar}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

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
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Webinars
            </h1>
            <p className="text-secondary-600">
              Join live webinars and seminars with AI-powered note generation
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'browse'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Browse Webinars
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'joined'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              My Webinars
            </button>
            <button
              onClick={() => setActiveTab('hosting')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'hosting'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              Host Webinar
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'browse' && (
        <div className="space-y-8">
          {/* Live Webinars */}
          {liveWebinars.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span>Live Now</span>
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liveWebinars.map((webinar) => (
                  <div key={webinar.id} className="card border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                          {webinar.title}
                        </h3>
                        <p className="text-secondary-600 text-sm mb-2">
                          Hosted by {webinar.host}
                        </p>
                        <p className="text-secondary-700 text-sm">
                          {webinar.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 text-red-600 text-sm font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span>LIVE</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-secondary-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{webinar.attendees}/{webinar.maxAttendees}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{webinar.duration} min</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => joinWebinar(webinar.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Live</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Webinars */}
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Upcoming Webinars</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingWebinars.map((webinar) => (
                <div key={webinar.id} className="card hover:shadow-md transition-shadow duration-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                      {webinar.title}
                    </h3>
                    <p className="text-secondary-600 text-sm mb-2">
                      Hosted by {webinar.host}
                    </p>
                    <p className="text-secondary-700 text-sm">
                      {webinar.description}
                    </p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(webinar.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(webinar.date), 'HH:mm')} • {webinar.duration} min</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-secondary-600">
                      <Users className="w-4 h-4" />
                      <span>{webinar.attendees}/{webinar.maxAttendees} registered</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="flex-1 btn-primary">
                      Register
                    </button>
                    <button className="btn-secondary">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'joined' && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No registered webinars</h3>
          <p className="text-secondary-600 mb-4">
            Register for webinars to see them here
          </p>
          <button 
            onClick={() => setActiveTab('browse')}
            className="btn-primary"
          >
            Browse Webinars
          </button>
        </div>
      )}

      {activeTab === 'hosting' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Host a Webinar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Webinar Title
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter webinar title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Describe your webinar..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button className="btn-primary w-full">
                  Schedule Webinar
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 card">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <span>AI-powered note generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-primary-600" />
                <span>HD video streaming</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-primary-600" />
                <span>Interactive chat</span>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-primary-600" />
                <span>Screen sharing</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-primary-600" />
                <span>Recording & export</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-600" />
                <span>Up to 500 attendees</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
