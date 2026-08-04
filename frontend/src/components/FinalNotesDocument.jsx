import React, { useRef } from 'react'
import { Download, Printer, BookOpen, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

export default function FinalNotesDocument({ finalNotes, lectureName }) {
  const documentRef = useRef(null)

  const handleDownload = () => {
    // Create markdown file for download
    const markdown = finalNotes.markdown
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lectureName || 'lecture'}_notes.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Trigger browser print dialog with "Save as PDF" option
    window.print()
  }

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white py-12 print:py-0">
      {/* Action Buttons - Hidden when printing */}
      <div className="max-w-5xl mx-auto px-6 mb-8 print:hidden">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md border-2 border-amber-300">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Final Comprehensive Notes</h2>
              <p className="text-sm text-gray-600">Complete lecture documentation ready for study</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download MD</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* A4 Document Container */}
      <div className="max-w-5xl mx-auto print:max-w-none">
        <div 
          ref={documentRef}
          className="bg-white shadow-2xl print:shadow-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '25mm 20mm',
            boxSizing: 'border-box'
          }}
        >
          {/* Document Header */}
          <div className="border-b-4 border-amber-500 pb-6 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {finalNotes.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-semibold">{lectureName || 'Educational Lecture'}</span>
              <span>{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          {/* Key Takeaways Box */}
          {finalNotes.key_takeaways && finalNotes.key_takeaways.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
              <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Key Takeaways
              </h2>
              <ul className="space-y-2">
                {finalNotes.key_takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start text-gray-800">
                    <span className="text-amber-600 font-bold mr-3">{idx + 1}.</span>
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Content Sections */}
          <div className="space-y-8">
            {finalNotes.sections && finalNotes.sections.map((section, idx) => (
              <div key={idx} className="break-inside-avoid">
                {/* Section Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-4 mb-4 rounded-r-lg">
                  <h2 className="text-2xl font-bold text-blue-900">
                    {idx + 1}. {section.title}
                  </h2>
                </div>

                {/* Section Content with Markdown */}
                <div className="prose prose-lg max-w-none mb-6 text-gray-800 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      // Custom styling for markdown elements
                      h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3" {...props} />,
                      h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700 ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-800" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? 
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600" {...props} /> :
                          <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4" {...props} />
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>

                {/* Formulas Section */}
                {section.formulas && section.formulas.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">📐</span>
                      Key Formulas
                    </h3>
                    <div className="space-y-4">
                      {section.formulas.map((formula, fIdx) => (
                        <div key={fIdx} className="bg-white p-4 rounded border border-blue-200">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {formula}
                          </ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagrams Section (Mermaid support) */}
                {section.diagram && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Diagram
                    </h3>
                    <div className="bg-white p-4 rounded border border-green-200">
                      <pre className="text-sm overflow-x-auto">
                        <code>{section.diagram}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Glossary Section */}
          {finalNotes.glossary && Object.keys(finalNotes.glossary).length > 0 && (
            <div className="mt-12 pt-8 border-t-2 border-gray-300 break-inside-avoid">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📖</span>
                Glossary
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(finalNotes.glossary).map(([term, definition]) => (
                  <div key={term} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <dt className="font-bold text-lg text-gray-900 mb-1">{term}</dt>
                    <dd className="text-gray-700 leading-relaxed">{definition}</dd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>Generated by LectureWeave AI • {new Date().toLocaleString()}</p>
            <p className="mt-1">Comprehensive lecture notes with AI-enhanced content</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            size: A4;
            margin: 20mm;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          /* Ensure proper page breaks */
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Better formula rendering in print */
          .katex {
            font-size: 1.1em;
          }
        }
      `}</style>
    </div>
  )
}
