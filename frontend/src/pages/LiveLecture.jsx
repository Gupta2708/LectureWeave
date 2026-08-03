import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import { environment } from '../config/environment'
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Volume2,
  Settings,
  FileText,
  Clock,
  Activity,
  Save,
  Download,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Folder
} from 'lucide-react'
import { formatDuration } from '../lib/utils.js'
import toast from 'react-hot-toast'
import AudioRecorder from '../utils/audioRecorder'
import FinalNotesDocument from '../components/FinalNotesDocument'

const mockTranscriptionChunks = [
  {
    id: 1,
    timestamp: '00:00:15',
    text: "Welcome to today's lecture on Machine Learning fundamentals. We'll be covering supervised learning algorithms.",
    importance: 0.9,
    processed: true
  },
  {
    id: 2,
    timestamp: '00:01:30',
    text: "Let's start with linear regression, which is one of the most basic yet powerful algorithms in machine learning.",
    importance: 0.8,
    processed: true
  },
  {
    id: 3,
    timestamp: '00:02:45',
    text: "The goal of linear regression is to find the best line that fits through our data points.",
    importance: 0.7,
    processed: true
  }
]

const mockRawNotes = [
  "• Introduction to Machine Learning fundamentals",
  "• Focus on supervised learning algorithms",
  "• Linear regression as foundational algorithm",
  "• Goal: find best-fit line through data points",
  "• Mathematical foundation and practical applications"
]

// Mock subject data
const subjectData = {
  1: { name: 'Machine Learning', code: 'CS-401', color: 'bg-blue-500' },
  2: { name: 'Data Structures', code: 'CS-301', color: 'bg-green-500' },
  3: { name: 'Database Systems', code: 'CS-302', color: 'bg-purple-500' }
}

export default function LiveLecture() {
  const { subjectId } = useParams()
  const location = useLocation()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcriptionChunks, setTranscriptionChunks] = useState([])
  const [rawNotes, setRawNotes] = useState([])
  const [liveNotes, setLiveNotes] = useState([])
  const [finalNotes, setFinalNotes] = useState(null)  // Final comprehensive notes
  const [audioLevel, setAudioLevel] = useState(0)
  const [lectureTitle, setLectureTitle] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [audioStream, setAudioStream] = useState(null)
  const intervalRef = useRef(null)
  const transcriptionRef = useRef(null)
  const websocketRef = useRef(null)
  const audioRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  
  const subject = subjectData[subjectId] || { name: 'Unknown Subject', code: 'N/A', color: 'bg-secondary-500' }
  
  // Get lecture setup data from navigation state
  const lectureSetup = location.state || {}
  const { lectureId, lectureTitle: setupTitle, documents: setupDocuments = [], subjectName } = lectureSetup

  // WebSocket connection effect - connect when lecture is available
  useEffect(() => {
    if (lectureId) {
      connectWebSocket()
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [lectureId])

  // Send recording commands when recording state changes
  useEffect(() => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      if (isRecording) {
        websocketRef.current.send(JSON.stringify({
          type: 'start_recording',
          lecture_id: lectureId
        }))
      } else {
        websocketRef.current.send(JSON.stringify({
          type: 'stop_recording',
          lecture_id: lectureId
        }))
      }
    }
  }, [isRecording, lectureId])

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
        // Simulate audio level
        setAudioLevel(Math.random() * 100)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRecording, isPaused])

  const connectWebSocket = () => {
    if (!lectureId) return

    console.log('Connecting to WebSocket for lecture:', lectureId)
    
    // Try multiple connection approaches
    const wsUrl = `${environment.WS_BASE_URL}/ws/lecture/${lectureId}`
    console.log('WebSocket URL:', wsUrl)
    
    const ws = new WebSocket(wsUrl,[],{
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })
    websocketRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected successfully')
      setConnectionStatus('connected')
      
      // Don't send start recording immediately - wait for user to click record
      ws.send(JSON.stringify({
        type: 'connection_established',
        lecture_id: lectureId
      }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received WebSocket message:', data)
      
      if (data.type === 'transcription') {
        // Real-time transcription (every 20 seconds)
        console.log('📝 Transcription received:', data.content)
        console.log('📝 Enhanced notes received:', data.enhanced_notes)
        
        setTranscriptionChunks(prev => [...prev, {
          id: data.timestamp,
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          text: data.content,
          enhanced_notes: data.enhanced_notes || data.content,  // Use enhanced notes if available
          chunk_number: data.chunk_number,
          processed: false
        }])
        
        toast.success(`Transcription ${data.chunk_number} complete`, { duration: 2000 })
        
      } else if (data.type === 'synthesis_started') {
        console.log('🤖 Synthesis started')
        toast.loading('Generating structured notes...', { id: 'synthesis' })
        
      } else if (data.type === 'structured_notes') {
        // Structured notes (every 60 seconds)
        console.log('📚 Structured notes received:', data.content)
        
        const newNote = {
          id: data.timestamp,
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          content: data.content,
          transcription_count: data.transcription_count,
          created_at: new Date().toISOString()
        }
        
        setLiveNotes(prev => [...prev, newNote])
        
        // Mark transcriptions as processed
        setTranscriptionChunks(prev => prev.map(chunk => ({
          ...chunk,
          processed: true
        })))
        
        toast.success('Structured notes generated!', { id: 'synthesis', duration: 3000 })
        
      } else if (data.type === 'synthesis_error') {
        console.error('Synthesis error:', data.error)
        toast.error('Error generating notes', { id: 'synthesis' })
        
      } else if (data.type === 'connection_confirmed') {
        console.log('WebSocket connection confirmed')
        toast.success('Connected to server')
        
      } else if (data.type === 'recording_started') {
        console.log('Recording started confirmation received')
        
      } else if (data.type === 'recording_stopped') {
        console.log('Recording stopped confirmation received')
        
      } else if (data.type === 'final_synthesis_started') {
        console.log('🎓 Final synthesis started')
        toast.loading('Creating comprehensive final notes...', { id: 'final-synthesis', duration: 10000 })
        
      } else if (data.type === 'final_notes') {
        console.log('📚 Final comprehensive notes received:', data)
        
        // Store final notes separately
        setFinalNotes({
          title: data.title,
          markdown: data.markdown,
          sections: data.sections,
          glossary: data.glossary,
          key_takeaways: data.key_takeaways,
          timestamp: new Date(data.timestamp).toLocaleTimeString()
        })
        
        toast.success('Final comprehensive notes ready!', { id: 'final-synthesis', duration: 5000 })
        
      } else if (data.type === 'final_synthesis_error') {
        console.error('Final synthesis error:', data.error)
        toast.error('Error creating final notes', { id: 'final-synthesis' })
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setConnectionStatus('disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }
  }

  useEffect(() => {
    // Auto-scroll transcription to bottom
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [transcriptionChunks])

  const startRecording = async () => {
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title')
      return
    }
    
    console.log('🚀 USING WEB AUDIO API - RELIABLE WAV GENERATION')

    try {
      // Check Web Audio API support
      if (!AudioRecorder.isSupported()) {
        throw new Error('Web Audio API not supported')
      }

      // Create and initialize audio recorder
      const audioRecorder = new AudioRecorder()
      await audioRecorder.initialize()
      
      audioRecorderRef.current = audioRecorder
      
      // Define audio chunk handler
      const handleAudioChunk = async (wavBlob) => {
        console.log('🎵 WAV chunk generated:', wavBlob.size, 'bytes')
        console.log('🔧 MIME type: audio/wav')
        console.log('📁 File extension: wav')
        
        // Send audio chunk to backend
        const formData = new FormData()
        formData.append('audio_file', wavBlob, 'audio_chunk.wav')
        
        try {
          const API_URL = environment.API_BASE_URL;
            axios.defaults.baseURL = API_URL;
              axios.defaults.headers.post['Content-Type'] = 'application/json';
              axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
          const response = await axios.post(`${API_URL}/api/audio/lecture/${lectureId}/chunk`, formData, {
            headers: getAuthHeader()
          })
          
          const result = await response.json()
          console.log('✅ Audio processing result:', result)
        } catch (error) {
          console.error('❌ Error sending audio chunk:', error)
        }
      }
      
      // Start recording with 20-second chunks for better transcription
      await audioRecorder.startRecording(handleAudioChunk, 20000)
      
      setIsRecording(true)
      toast.success('Recording started with Web Audio API - crystal clear WAV!')
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Could not access microphone. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    // Stop Web Audio API recorder
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording()
      audioRecorderRef.current = null
    }
    
    setIsRecording(false)
    setIsPaused(false)
    clearInterval(intervalRef.current)
    toast.success('Recording stopped')
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    toast.success(isPaused ? 'Recording resumed' : 'Recording paused')
  }

  const saveLecture = () => {
    if (!isRecording && duration > 0) {
      toast.success('Lecture saved successfully')
    } else {
      toast.error('No recording to save')
    }
  }

  const exportNotes = () => {
    if (rawNotes.length > 0) {
      toast.success('Notes exported successfully')
    } else {
      toast.error('No notes to export')
    }
  }

  const getImportanceColor = (importance) => {
    if (importance >= 0.8) return 'border-l-red-500 bg-red-50'
    if (importance >= 0.6) return 'border-l-yellow-500 bg-yellow-50'
    return 'border-l-green-500 bg-green-50'
  }

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link 
            to={subjectId ? `/subjects/${subjectId}` : '/subjects'} 
            className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${subject.color}`} />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                {subject.name} - Live Lecture
              </h1>
              <p className="text-secondary-600">{subject.code}</p>
            </div>
          </div>
        </div>
        <p className="text-secondary-600">
          Record lectures and generate intelligent notes in real-time
        </p>
      </div>

      {/* Lecture Setup */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-900">Lecture Setup</h2>
          <button className="text-secondary-500 hover:text-secondary-700">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Lecture Title
            </label>
            <input
              type="text"
              value={lectureTitle || setupTitle || ''}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="Enter lecture title..."
              className="input"
              disabled={isRecording}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Duration
            </label>
            <div className="input bg-secondary-50">
              {formatDuration(duration)}
            </div>
          </div>
        </div>

        {/* Uploaded Documents */}
        {setupDocuments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Uploaded Documents ({setupDocuments.length})
            </label>
            <div className="bg-secondary-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-secondary-900">
                  Documents processed and ready for AI context
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {setupDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-2 text-sm text-secondary-700">
                    <FileText className="w-4 h-4 text-secondary-500" />
                    <span className="truncate">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                <Mic className="w-5 h-5" />
                <span>Start Recording</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePause}
                  className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-secondary-600" />
                <div className="w-24 h-2 bg-secondary-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="flex items-center space-x-2 text-secondary-600">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatDuration(duration)}</span>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 recording-pulse'}`} />
                <span className="text-sm font-medium text-secondary-700">
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Transcription */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Live Transcription</h2>
            <Activity className="w-5 h-5 text-primary-600" />
          </div>
          
          <div 
            ref={transcriptionRef}
            className="h-96 overflow-y-auto space-y-3 p-4 bg-secondary-50 rounded-lg"
          >
            {transcriptionChunks.length === 0 ? (
              <div className="flex items-center justify-center h-full text-secondary-500">
                <div className="text-center">
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start recording to see live transcription</p>
                </div>
              </div>
            ) : (
              transcriptionChunks.map((chunk) => (
                <div 
                  key={chunk.id} 
                  className={`p-3 rounded-lg border-l-4 ${getImportanceColor(chunk.importance)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-secondary-600">
                      {chunk.timestamp}
                    </span>
                    <span className="text-xs px-2 py-1 bg-white rounded-full">
                      {Math.round(chunk.importance * 100)}% important
                    </span>
                  </div>
                  <p className="text-secondary-800">{chunk.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live AI Notes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary-900">Live AI Notes</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-secondary-600 capitalize">{connectionStatus}</span>
              <button
                onClick={exportNotes}
                className="text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                title="Export Notes"
              >
                <Download className="w-5 h-5" />
              </button>
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 bg-secondary-50 rounded-lg">
            {liveNotes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-secondary-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>AI-generated notes will appear here during recording</p>
                  {connectionStatus === 'connected' && isRecording && (
                    <div className="mt-4">
                      <div className="animate-pulse flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </div>
                      <p className="text-sm mt-2">Generating notes...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Transcriptions Section */}
                {transcriptionChunks.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Real-time Transcriptions
                    </h3>
                    <div className="space-y-2">
                      {transcriptionChunks.slice(-3).map((chunk) => (
                        <div key={chunk.id} className={`p-3 rounded ${chunk.processed ? 'bg-white' : 'bg-blue-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-blue-600 font-mono">
                              {chunk.timestamp} - Chunk #{chunk.chunk_number}
                            </span>
                            {!chunk.processed && (
                              <span className="text-xs text-blue-500 animate-pulse">Processing...</span>
                            )}
                          </div>
                          {/* Display enhanced notes instead of raw transcription */}
                          <div className="text-sm text-secondary-700 whitespace-pre-line">
                            {chunk.enhanced_notes || chunk.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Final Comprehensive Notes Section */}
                {finalNotes && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-xl border-4 border-amber-300 shadow-2xl mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-amber-900 flex items-center">
                        🎓 {finalNotes.title}
                      </h2>
                      <span className="text-xs bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-semibold">
                        Final Comprehensive Notes
                      </span>
                    </div>
                    
                    {/* Key Takeaways */}
                    {finalNotes.key_takeaways && finalNotes.key_takeaways.length > 0 && (
                      <div className="mb-6 p-4 bg-white rounded-lg border-2 border-amber-200">
                        <h3 className="text-lg font-bold text-amber-900 mb-3">🎯 Key Takeaways</h3>
                        <ul className="space-y-2">
                          {finalNotes.key_takeaways.map((takeaway, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="text-amber-600 mr-2">•</span>
                              {takeaway}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Sections */}
                    {finalNotes.sections && finalNotes.sections.map((section, idx) => (
                      <div key={idx} className="mb-6 p-4 bg-white rounded-lg border border-amber-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h3>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                          {section.content}
                        </div>
                        {section.formulas && section.formulas.length > 0 && (
                          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Formulas:</p>
                            {section.formulas.map((formula, fIdx) => (
                              <div key={fIdx} className="text-sm font-mono text-gray-800 mb-1">
                                {formula}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Glossary */}
                    {finalNotes.glossary && Object.keys(finalNotes.glossary).length > 0 && (
                      <div className="p-4 bg-white rounded-lg border-2 border-amber-200">
                        <h3 className="text-lg font-bold text-amber-900 mb-3">📖 Glossary</h3>
                        <dl className="space-y-2">
                          {Object.entries(finalNotes.glossary).map(([term, definition]) => (
                            <div key={term} className="text-sm">
                              <dt className="font-semibold text-gray-900">{term}</dt>
                              <dd className="text-gray-700 ml-4">{definition}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Structured Notes Section (60s synthesis) */}
                {liveNotes.map((note) => (
                  <div key={note.id} className="bg-gradient-to-br from-white to-secondary-50 p-6 rounded-lg border-2 border-primary-200 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-secondary-500 font-mono flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {note.timestamp}
                      </span>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        📚 Synthesized from {note.transcription_count} chunks
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-secondary-800" 
                        dangerouslySetInnerHTML={{ 
                          __html: note.content.replace(/\n/g, '<br/>').replace(/##\s/g, '<h2 class="text-lg font-bold mt-3 mb-2">').replace(/###\s/g, '<h3 class="text-md font-semibold mt-2 mb-1">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(duration > 0 || isRecording) && (
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={saveLecture}
            disabled={isRecording}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Lecture</span>
          </button>
          
          <button
            onClick={exportNotes}
            disabled={rawNotes.length === 0}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Notes</span>
          </button>
        </div>
      )}
    </div>

    {/* Final Comprehensive Notes Document - Separate A4 Section */}
    {finalNotes && (
      <FinalNotesDocument 
        finalNotes={finalNotes} 
        lectureName={lectureTitle || location.state?.subjectName || 'Lecture'}
      />
    )}
    </>
  )
}
