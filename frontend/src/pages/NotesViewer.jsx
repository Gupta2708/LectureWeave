import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Edit3, 
  BookOpen, 
  Clock, 
  Calendar,
  Tag,
  FileText,
  Copy,
  Check,
  Printer,
  Star,
  StarOff
} from 'lucide-react'
import { format } from 'date-fns'
import { formatDuration } from '../lib/utils.js'
import toast from 'react-hot-toast'

// Mock data for the lecture notes
const mockLectureData = {
  id: 1,
  title: 'Introduction to Machine Learning',
  date: '2024-10-18T10:30:00Z',
  duration: 6300,
  subject: 'Computer Science',
  tags: ['ML', 'AI', 'Algorithms'],
  starred: true,
  transcriptionAccuracy: 95,
  notesQuality: 'High',
  structuredNotes: {
    title: 'Introduction to Machine Learning - Lecture Notes',
    sections: [
      {
        id: 1,
        title: 'Course Overview',
        content: [
          'Machine Learning is a subset of Artificial Intelligence that focuses on algorithms that can learn from data',
          'Three main types: Supervised Learning, Unsupervised Learning, and Reinforcement Learning',
          'Applications include image recognition, natural language processing, recommendation systems'
        ],
        keyTakeaways: [
          'ML enables computers to learn without explicit programming',
          'Data quality is crucial for successful ML implementations'
        ]
      },
      {
        id: 2,
        title: 'Supervised Learning Fundamentals',
        content: [
          'Uses labeled training data to learn mapping from inputs to outputs',
          'Two main categories: Classification and Regression',
          'Classification predicts discrete categories (spam/not spam)',
          'Regression predicts continuous values (house prices, temperature)'
        ],
        keyTakeaways: [
          'Quality of training data directly impacts model performance',
          'Feature selection is critical for model accuracy'
        ]
      },
      {
        id: 3,
        title: 'Linear Regression Deep Dive',
        content: [
          'Simplest form of supervised learning for regression problems',
          'Finds the best line that fits through data points',
          'Uses least squares method to minimize prediction errors',
          'Mathematical formula: y = mx + b (slope-intercept form)',
          'Can be extended to multiple variables (multiple linear regression)'
        ],
        keyTakeaways: [
          'Linear regression assumes linear relationship between variables',
          'Outliers can significantly impact the regression line'
        ]
      },
      {
        id: 4,
        title: 'Practical Implementation',
        content: [
          'Python libraries: scikit-learn, pandas, numpy',
          'Data preprocessing steps: cleaning, normalization, feature scaling',
          'Model evaluation metrics: R-squared, Mean Squared Error (MSE)',
          'Cross-validation for robust model assessment'
        ],
        keyTakeaways: [
          'Proper data preprocessing is essential',
          'Always validate model performance on unseen data'
        ]
      }
    ],
    summary: 'This lecture provided a comprehensive introduction to machine learning, focusing on supervised learning techniques with particular emphasis on linear regression. Key concepts covered include the importance of data quality, feature selection, and proper model evaluation techniques.'
  }
}

export default function NotesViewer() {
  const { id } = useParams()
  const [lectureData] = useState(mockLectureData)
  const [copied, setCopied] = useState(false)
  const [starred, setStarred] = useState(lectureData.starred)

  const copyToClipboard = async () => {
    try {
      const notesText = lectureData.structuredNotes.sections
        .map(section => {
          const content = section.content.map(item => `• ${item}`).join('\n')
          const takeaways = section.keyTakeaways.map(item => `  - ${item}`).join('\n')
          return `${section.title}\n${content}\n\nKey Takeaways:\n${takeaways}\n`
        })
        .join('\n---\n\n')
      
      await navigator.clipboard.writeText(`${lectureData.title}\n\n${notesText}`)
      setCopied(true)
      toast.success('Notes copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy notes')
    }
  }

  const toggleStar = () => {
    setStarred(!starred)
    toast.success(starred ? 'Removed from favorites' : 'Added to favorites')
  }

  const exportNotes = (format) => {
    toast.success(`Exporting notes as ${format.toUpperCase()}...`)
  }

  const printNotes = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-secondary-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/history" 
                className="text-secondary-500 hover:text-secondary-700 transition-colors duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {lectureData.title}
                </h1>
                <div className="flex items-center space-x-4 mt-1 text-sm text-secondary-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(lectureData.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(lectureData.duration)}</span>
                  </div>
                  <span className="px-2 py-1 bg-secondary-100 text-secondary-700 rounded-full text-xs">
                    {lectureData.subject}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleStar}
                className="p-2 text-secondary-500 hover:text-yellow-500 transition-colors duration-200"
                title={starred ? 'Remove from favorites' : 'Add to favorites'}
              >
                {starred ? (
                  <Star className="w-5 h-5 fill-current text-yellow-500" />
                ) : (
                  <StarOff className="w-5 h-5" />
                )}
              </button>

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

              <div className="relative group">
                <button className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200">
                  <Download className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-2">
                    <button
                      onClick={() => exportNotes('pdf')}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => exportNotes('docx')}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      Export as DOCX
                    </button>
                    <button
                      onClick={() => exportNotes('txt')}
                      className="w-full px-4 py-2 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      Export as TXT
                    </button>
                  </div>
                </div>
              </div>

              <button className="p-2 text-secondary-500 hover:text-primary-600 transition-colors duration-200">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="font-semibold text-secondary-900 mb-4">Lecture Info</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-secondary-600">Quality:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {lectureData.notesQuality}
                  </span>
                </div>
                
                <div>
                  <span className="text-secondary-600">Accuracy:</span>
                  <span className="ml-2 font-medium text-secondary-900">
                    {lectureData.transcriptionAccuracy}%
                  </span>
                </div>

                <div>
                  <span className="text-secondary-600 block mb-2">Tags:</span>
                  <div className="flex flex-wrap gap-1">
                    {lectureData.tags.map((tag) => (
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

              <hr className="my-4" />

              <h4 className="font-medium text-secondary-900 mb-3">Table of Contents</h4>
              <nav className="space-y-2">
                {lectureData.structuredNotes.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#section-${section.id}`}
                    className="block text-sm text-secondary-600 hover:text-primary-600 transition-colors duration-200"
                  >
                    {index + 1}. {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="prose prose-secondary max-w-none">
                <h1 className="text-3xl font-bold text-secondary-900 mb-6">
                  {lectureData.structuredNotes.title}
                </h1>

                {/* Summary */}
                <div className="bg-primary-50 border-l-4 border-primary-500 p-4 mb-8">
                  <h2 className="text-lg font-semibold text-primary-900 mb-2 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Summary
                  </h2>
                  <p className="text-primary-800 leading-relaxed">
                    {lectureData.structuredNotes.summary}
                  </p>
                </div>

                {/* Sections */}
                {lectureData.structuredNotes.sections.map((section, index) => (
                  <section key={section.id} id={`section-${section.id}`} className="mb-10">
                    <h2 className="text-2xl font-bold text-secondary-900 mb-4 pb-2 border-b border-secondary-200">
                      {index + 1}. {section.title}
                    </h2>
                    
                    <div className="mb-6">
                      <ul className="space-y-2">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-secondary-700 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {section.keyTakeaways.length > 0 && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          Key Takeaways
                        </h3>
                        <ul className="space-y-1">
                          {section.keyTakeaways.map((takeaway, takeawayIndex) => (
                            <li key={takeawayIndex} className="text-yellow-800 text-sm">
                              • {takeaway}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                ))}

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-secondary-200">
                  <div className="flex items-center justify-between text-sm text-secondary-500">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Generated by LectureWeave AI</span>
                    </div>
                    <span>
                      Last updated: {format(new Date(lectureData.date), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
