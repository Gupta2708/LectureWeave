import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createLecture } from '../api/endpoints/lectures';
import { uploadLectureDocument } from '../api/endpoints/documents';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle,
  Loader,
  BookOpen,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import NoteTemplateSelector from '../features/notes/NoteTemplateSelector';
import DocumentStatusCard from '../features/documents/DocumentStatusCard';
import RetryProcessingButton from '../features/documents/RetryProcessingButton';

const LectureSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getAuthHeader } = useAuth();
  
  const subjectData = location.state || {};
  const { subjectId, subjectName, subjectCode } = subjectData;
  
  const [lectureTitle, setLectureTitle] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState('detailed');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newDocs = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));
    setDocuments([...documents, ...newDocs]);
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadDocuments = async (lectureId) => {
    if (documents.length === 0) return;

    setUploading(true);
    
    for (let i = 0; i < documents.length; i++) {
      try {
        const response = await uploadLectureDocument(lectureId, documents[i].file);
        const uploaded = response.data?.files?.[0];

        setDocuments(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploaded: true, documentId: uploaded?.document_id, status: uploaded?.status };
          return updated;
        });
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error(`Failed to upload ${documents[i].name}`);
      }
    }
    
    setUploading(false);
  };

  const handleStartLecture = async () => {
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    setCreating(true);

    try {
      // Create lecture
      const response = await createLecture({
        title: lectureTitle,
        subject_id: subjectId,
        template,
      });

      const lectureId = response.data.id;

      // Upload documents if any
      if (documents.length > 0) {
        await uploadDocuments(lectureId);
      }

      toast.success('Lecture created successfully!');
      
      // Navigate to live lecture page
      navigate(`/subjects/${subjectId}/lecture`, {
        state: {
          lectureId,
          lectureTitle,
          subjectName,
          subjectCode,
          template,
          documents: documents.map(d => d.name)
        }
      });
    } catch (error) {
      console.error('Error creating lecture:', error);
      toast.error('Failed to create lecture');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Setup New Lecture</h1>
              <p className="text-sm text-gray-600">{subjectName} ({subjectCode})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Lecture Title */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lecture Title *
            </label>
            <input
              type="text"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="e.g., Introduction to Neural Networks"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="mt-4"><NoteTemplateSelector value={template} onChange={setTemplate} /></div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reference Documents</h2>
                <p className="text-sm text-gray-600">Upload PDFs, PPTs, or other materials (optional)</p>
              </div>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
                <input
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                      {doc.uploaded && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                    {doc.documentId && <div className="ml-8"><DocumentStatusCard documentId={doc.documentId} /><RetryProcessingButton documentId={doc.documentId} /></div>}
                  </div>
                ))}
              </div>
            )}

            {documents.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Documents help improve note quality with context
                </p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload relevant course materials before starting</li>
              <li>• Speak clearly and at a moderate pace</li>
              <li>• Pause briefly between topics for better segmentation</li>
              <li>• Use a quiet environment for recording</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleStartLecture}
              disabled={!lectureTitle.trim() || creating}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Lecture
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureSetup;
