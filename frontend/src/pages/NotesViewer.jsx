import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  BookOpen,
  Clock,
  Calendar,
  FileText,
  Copy,
  Check,
  Printer,
  Loader
} from 'lucide-react'
import { format } from 'date-fns'
import { formatDuration } from '../lib/utils.js'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import { getLectureNotes } from '../api/endpoints/notes'

const safeDate = (value, pattern) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : format(d, pattern)
}

export default function NotesViewer() {
  // Route is registered as both /lecture/:lectureId and /notes/:id.
  const { id, lectureId } = useParams()
  const realId = lectureId || id
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lecture, setLecture] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await getLectureNotes(realId)
        if (!active) return
        if (res.data?.success && res.data.lecture) {
          setLecture(res.data.lecture)
        } else {
          setError('Notes not found')
        }
      } catch (err) {
        if (!active) return
        setError(
          err.response?.status === 404
            ? "Lecture not found or you don't have access"
            : 'Failed to load notes'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    if (realId) {
      load()
    } else {
      setError('No lecture specified')
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [realId])

  const finalNotes = lecture?.final_notes || null
  const structured = Array.isArray(lecture?.structured_notes)
    ? lecture.structured_notes
    : []

  // Prefer the final comprehensive notes; fall back to the periodic structured
  // notes captured during the lecture.
  const markdown =
    finalNotes?.markdown ||
    structured
      .map((n) => n?.content)
      .filter(Boolean)
      .join('\n\n---\n\n') ||
    ''

  const title = finalNotes?.title || lecture?.title || 'Lecture Notes'
  const createdLabel = safeDate(lecture?.created_at, 'MMM d, yyyy')
  const updatedLabel = safeDate(lecture?.updated_at || lecture?.created_at, 'MMM d, yyyy HH:mm')

  const copyToClipboard = async () => {
    if (!markdown) {
      toast.error('No notes to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      toast.success('Notes copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy notes')
    }
  }

  const downloadNotes = () => {
    if (!markdown) {
      toast.error('No notes to download')
      return
    }
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Notes downloaded!')
  }

  const printNotes = () => window.print()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 gap-4">
        <p className="text-secondary-700">{error}</p>
        <button
          onClick={() => navigate('/my-notes')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to My Notes
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/my-notes')}
                className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
                title="Back to My Notes"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>
                <div className="flex items-center space-x-4 mt-1 text-sm text-secondary-600">
                  {createdLabel && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{createdLabel}</span>
                    </div>
                  )}
                  {lecture?.duration ? (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(lecture.duration)}</span>
                    </div>
                  ) : null}
                  {lecture?.status && (
                    <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                      {lecture.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={copyToClipboard}
                className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                title="Copy notes"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={printNotes}
                className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                title="Print notes"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={downloadNotes}
                className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200"
                title="Download as Markdown"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="card">
          {markdown ? (
            <div className="prose prose-secondary max-w-none">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-secondary-500">
              <BookOpen className="w-10 h-10 mb-3" />
              <p className="font-medium text-secondary-700">No notes yet</p>
              <p className="text-sm">
                Final notes are generated when a recording is stopped.
              </p>
            </div>
          )}

          {markdown && (
            <div className="mt-12 pt-6 border-t border-secondary-200">
              <div className="flex items-center justify-between text-sm text-secondary-500">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Generated by LectureWeave AI</span>
                </div>
                {updatedLabel && <span>Last updated: {updatedLabel}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
