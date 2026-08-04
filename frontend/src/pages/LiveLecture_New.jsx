import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Square,
  Save,
  Download,
  ArrowLeft,
  FileText,
  Clock,
  Activity,
  CheckCircle,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import AudioRecorder from '../utils/audioRecorder';
import ReactMarkdown from 'react-markdown';
import { createLectureSocket } from '../api/websocketClient';
import { uploadAudioChunk } from '../api/endpoints/audio';
import { updateLectureTemplate } from '../api/endpoints/lectures';
import ProcessingStatus from '../features/recording/ProcessingStatus';
import TranscriptSegmentEditor from '../features/transcripts/TranscriptSegmentEditor';
import LectureMarkerButton from '../features/markers/LectureMarkerButton';
import NoteTemplateSelector from '../features/notes/NoteTemplateSelector';
import ExportNotesMenu from '../features/notes/ExportNotesMenu';

const LiveLecture = () => {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Real-time data from backend
  const [transcriptions, setTranscriptions] = useState([]);
  const [enhancedNotes, setEnhancedNotes] = useState([]);
  const [structuredNotes, setStructuredNotes] = useState([]);
  const [finalNotes, setFinalNotes] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [markers, setMarkers] = useState([]);
  
  // Refs
  const websocketRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const timerRef = useRef(null);
  
  // Get lecture data from navigation state
  const lectureData = location.state || {};
  const { lectureId, lectureTitle, subjectName } = lectureData;
  const [template, setTemplate] = useState(lectureData.template || 'detailed');
  
  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // WebSocket connection
  useEffect(() => {
    if (lectureId) {
      connectWebSocket();
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [lectureId]);

  const connectWebSocket = () => {
    const ws = createLectureSocket(lectureId);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
      toast.success('Connected to lecture server');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      toast.error('Connection error');
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
      setConnectionStatus('disconnected');
    };
    
    websocketRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    console.log('📨 Received:', data.type, data);
    
    switch (data.type) {
      case 'transcription':
        // Real-time transcription chunk
        console.log('📝 Transcription received:', data.content);
        setTranscriptions(prev => [...prev, {
          id: data.chunk_number || Date.now(),
          timestamp: data.timestamp,
          segment_id: data.segment_id,
          start_ms: data.start_ms,
          end_ms: data.end_ms,
          text: data.content,  // Backend sends 'content', not 'text'
          enhanced_notes: data.enhanced_notes,  // Also store enhanced notes
          importance: data.importance || 0
        }]);
        
        // Also add to enhanced notes section
        if (data.enhanced_notes) {
          setEnhancedNotes(prev => [...prev, {
            id: Date.now(),
            content: data.enhanced_notes,
            timestamp: data.timestamp
          }]);
        }
        break;

      case 'job_status':
        setProcessingStatus(data);
        break;
        
      case 'structured_notes':
        // Structured notes (every 60 seconds)
        console.log('📚 Structured notes received:', data.content?.substring(0, 100));
        setStructuredNotes(prev => [...prev, {
          id: Date.now(),
          content: data.content,
          timestamp: new Date().toISOString(),
          transcription_count: data.transcription_count
        }]);
        toast.success('Structured notes updated!');
        break;
        
      case 'final_notes':
        // Final comprehensive notes
        console.log('🎓 Final notes received:', data);
        setFinalNotes({
          title: data.title,
          markdown: data.markdown,
          sections: data.sections,
          glossary: data.glossary,
          key_takeaways: data.key_takeaways
        });
        toast.success('Final notes generated!');
        break;
        
      case 'error':
        toast.error(data.message || 'An error occurred');
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const changeTemplate = async (nextTemplate) => {
    setTemplate(nextTemplate);
    if (!lectureId) return;
    try {
      await updateLectureTemplate(lectureId, nextTemplate);
      websocketRef.current?.send(JSON.stringify({ type: 'set_template', template: nextTemplate }));
    } catch {
      toast.error('Could not update note style');
    }
  };

  const startRecording = async () => {
    try {
      console.log('🚀 Using Web Audio API - Reliable WAV generation');
      
      // Check Web Audio API support
      if (!AudioRecorder.isSupported()) {
        throw new Error('Web Audio API not supported');
      }
      
      // Create and initialize audio recorder
      const audioRecorder = new AudioRecorder();
      await audioRecorder.initialize();
      
      audioRecorderRef.current = audioRecorder;
      
      // Define audio chunk handler
      const handleAudioChunk = async (wavBlob) => {
        console.log('🎵 WAV chunk generated:', wavBlob.size, 'bytes');

        // Send audio chunk via HTTP POST through the shared client.
        try {
          const response = await uploadAudioChunk(lectureId, wavBlob);
          console.log('✅ Audio chunk processed:', response.data);
        } catch (error) {
          console.error('❌ Error sending audio chunk:', error);
        }
      };
      
      // Start recording with 20-second chunks
      await audioRecorder.startRecording(handleAudioChunk, 20000);
      
      setIsRecording(true);
      
      // Notify backend via WebSocket
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'start_recording',
          lecture_id: lectureId
        }));
      }
      
      toast.success('Recording started with Web Audio API - crystal clear WAV!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stopRecording();
      setIsRecording(false);

      // Request final synthesis
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'stop_recording'
        }));
      }
      
      toast.success('Recording stopped');
    }
  };

  const saveNotes = async () => {
    try {
      toast.success('Notes saved successfully!');
      setTimeout(() => {
        navigate('/my-notes');
      }, 1500);
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  const downloadNotes = () => {
    if (finalNotes) {
      const blob = new Blob([finalNotes.markdown || ''], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lectureTitle || 'lecture'}-notes.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Notes downloaded!');
    } else {
      toast.error('No final notes available yet');
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lectureTitle || 'Live Lecture'}</h1>
                <p className="text-sm text-gray-600">{subjectName || 'Subject'}</p>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recording Controls & Transcription */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isRecording ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {isRecording ? (
                      <Mic className="w-8 h-8 text-red-600" />
                    ) : (
                      <MicOff className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-3xl font-mono font-bold text-gray-900">
                      {formatTime(duration)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {isRecording ? 'Recording...' : 'Ready to record'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={connectionStatus !== 'connected'}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopRecording}
                      className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Square className="w-5 h-5" />
                      Stop
                    </button>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <NoteTemplateSelector value={template} onChange={changeTemplate} />
                <LectureMarkerButton lectureId={lectureId} startMs={duration * 1000} onCreated={(marker) => setMarkers((previous) => [...previous, marker])} />
              </div>
              <ProcessingStatus status={processingStatus} />
            </div>

            {/* Real-Time Transcription */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Live Transcription
                </h2>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                {transcriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Transcription will appear here...</p>
                  </div>
                ) : (
                  transcriptions.map((trans) => <TranscriptSegmentEditor key={trans.id} segment={trans} onSaved={(text) => setTranscriptions((items) => items.map((item) => item.id === trans.id ? { ...item, text } : item))} />)
                )}
                {markers.length > 0 && <div className="text-xs text-amber-700">Markers: {markers.map((marker) => marker.type).join(', ')}</div>}
              </div>
            </div>
          </div>

          {/* Right Column - Notes */}
          <div className="space-y-6">
            {/* Enhanced Notes */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Enhanced Notes
                </h2>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                {enhancedNotes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Notes will appear as you speak...
                  </p>
                ) : (
                  enhancedNotes.map((note) => (
                    <div key={note.id} className="text-sm text-gray-700 p-2 bg-green-50 rounded">
                      {note.content}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Structured Notes */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                  Structured Notes
                  <span className="text-xs text-gray-500">(Updates every 60s)</span>
                </h2>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {structuredNotes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Structured notes will be generated...
                  </p>
                ) : (
                  <div className="space-y-6">
                    {structuredNotes.map((note, idx) => (
                      <div key={note.id} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            Update {idx + 1}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimestamp(note.timestamp)}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{note.content}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {finalNotes && (
              <div className="flex gap-3">
                <button
                  onClick={saveNotes}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <ExportNotesMenu lectureId={lectureId} title={finalNotes?.title || lectureTitle} />
                <button
                  onClick={downloadNotes}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Final Notes Section */}
        {finalNotes && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Final Comprehensive Notes
            </h2>
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: finalNotes.markdown?.replace(/\n/g, '<br/>') || '' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveLecture;
