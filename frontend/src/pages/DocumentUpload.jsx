import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  Check,
  AlertCircle,
  Loader2,
  Download,
  Trash2
} from 'lucide-react'
import { formatFileSize } from '../lib/utils'
import toast from 'react-hot-toast'

const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif']
}

const getFileIcon = (type) => {
  if (type.includes('pdf')) return FileText
  if (type.includes('image')) return Image
  return File
}

export default function DocumentUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: 1,
      name: 'Machine Learning Slides.pdf',
      size: 2048576,
      type: 'application/pdf',
      uploadedAt: '2024-10-18T10:30:00Z',
      status: 'processed'
    },
    {
      id: 2,
      name: 'Course Syllabus.docx',
      size: 524288,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: '2024-10-17T14:20:00Z',
      status: 'processed'
    }
  ])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Some files were rejected. Please check file types and sizes.')
    }

    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  })

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload')
      return
    }

    setUploading(true)
    
    try {
      // Simulate upload process
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ))

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' } : f
        ))

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Move to uploaded files
        const uploadedFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          status: 'processed'
        }

        setUploadedFiles(prev => [uploadedFile, ...prev])
        
        // Remove from pending files
        setFiles(prev => prev.filter(f => f.id !== file.id))
      }

      toast.success('All files uploaded and processed successfully!')
    } catch (error) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const deleteUploadedFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
    toast.success('File deleted successfully')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
      case 'processed':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">
          Document Upload
        </h1>
        <p className="text-secondary-600">
          Upload reference materials to enhance AI-generated notes with better context
        </p>
      </div>

      {/* Upload Area */}
      <div className="card mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Upload Documents'}
          </h3>
          <p className="text-secondary-600 mb-4">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-secondary-500">
            Supports: PDF, DOC, DOCX, TXT, PPT, PPTX, JPG, PNG (Max 50MB each)
          </p>
        </div>

        {/* Pending Files */}
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-secondary-900">
                Files to Upload ({files.length})
              </h3>
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload All</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type)
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileIcon className="w-8 h-8 text-secondary-500" />
                      <div>
                        <p className="font-medium text-secondary-900">{file.name}</p>
                        <p className="text-sm text-secondary-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      {file.status === 'pending' && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-secondary-400 hover:text-red-600 transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">
            Uploaded Documents ({uploadedFiles.length})
          </h2>
        </div>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No documents uploaded yet</p>
            <p className="text-sm text-secondary-500 mt-1">
              Upload some reference materials to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedFiles.map((file) => {
              const FileIcon = getFileIcon(file.type)
              return (
                <div key={file.id} className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <FileIcon className="w-8 h-8 text-secondary-500" />
                    <div>
                      <p className="font-medium text-secondary-900">{file.name}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-secondary-600">
                        <span>{formatFileSize(file.size)}</span>
                        <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <button
                      className="text-secondary-400 hover:text-primary-600 transition-colors duration-200"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUploadedFile(file.id)}
                      className="text-secondary-400 hover:text-red-600 transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
