import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createLecture } from '../api/endpoints/lectures';
import { uploadLectureDocument } from '../api/endpoints/documents';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Loader,
  Play,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import NoteTemplateSelector from '../features/notes/NoteTemplateSelector';
import DocumentStatusCard from '../features/documents/DocumentStatusCard';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

const LectureSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { subjectId, subjectName, subjectCode } = location.state || {};

  const [lectureTitle, setLectureTitle] = useState('');
  const [documents, setDocuments] = useState([]);
  const [template, setTemplate] = useState('detailed');

  const [creating, setCreating] = useState(false);
  // Once created + uploaded, we switch to the "preparing" view that shows the
  // per-document processing steppers before entering the live lecture.
  const [prepared, setPrepared] = useState(null); // { lectureId, docs: [{documentId, name}] }
  const [readyIds, setReadyIds] = useState(new Set());

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setDocuments((prev) => [...prev, ...files.map((file) => ({ file, name: file.name, size: file.size }))]);
    e.target.value = '';
  };

  const removeDocument = (index) => setDocuments((prev) => prev.filter((_, i) => i !== index));

  const enterLecture = (lectureId) =>
    navigate(`/subjects/${subjectId}/lecture`, {
      state: { lectureId, lectureTitle, subjectName, subjectCode, template },
    });

  const handleStart = async () => {
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }
    setCreating(true);
    try {
      const { data } = await createLecture({ title: lectureTitle, subject_id: subjectId, template });
      const lectureId = data.id;

      if (documents.length === 0) {
        enterLecture(lectureId);
        return;
      }

      const docs = [];
      for (const doc of documents) {
        try {
          const res = await uploadLectureDocument(lectureId, doc.file);
          const uploaded = res.data?.files?.[0];
          if (uploaded?.document_id) docs.push({ documentId: uploaded.document_id, name: doc.name });
        } catch {
          toast.error(`Failed to upload ${doc.name}`);
        }
      }
      setPrepared({ lectureId, docs });
    } catch {
      toast.error('Failed to create lecture');
    } finally {
      setCreating(false);
    }
  };

  const markReady = (id) => setReadyIds((prev) => new Set(prev).add(id));
  const allReady = prepared && prepared.docs.every((d) => readyIds.has(d.documentId));

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/40 to-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set up a new lecture</h1>
            {subjectName && <p className="text-sm text-gray-500">{subjectName}{subjectCode ? ` · ${subjectCode}` : ''}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {!prepared ? (
          <>
            {/* Title + template */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-gray-800">Lecture title</label>
              <input
                autoFocus
                value={lectureTitle}
                onChange={(e) => setLectureTitle(e.target.value)}
                placeholder="e.g. Introduction to Neural Networks"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <div className="mt-5"><NoteTemplateSelector value={template} onChange={setTemplate} /></div>
            </section>

            {/* Reference documents */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Reference documents</h2>
                  <p className="text-sm text-gray-500">PDF, PPTX, DOCX or TXT — used to ground your notes (optional)</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
                  <Upload className="h-4 w-4" /> Upload
                  <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>

              {documents.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No documents added yet</p>
                  <p className="mt-1 text-xs text-gray-400">Documents improve note accuracy with citations</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {documents.map((doc, index) => (
                    <li key={index} className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                      <FileText className="h-5 w-5 text-indigo-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                      </div>
                      <button onClick={() => removeDocument(index)} className="rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleStart}
                disabled={!lectureTitle.trim() || creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {creating ? <><Loader className="h-5 w-5 animate-spin" /> Preparing…</> : <><Play className="h-5 w-5" /> Start lecture</>}
              </button>
            </div>
          </>
        ) : (
          /* Preparing view — live document processing */
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Preparing your material</h2>
            </div>
            <p className="mb-5 text-sm text-gray-500">
              We&apos;re extracting and indexing your documents so notes can cite them. You can enter the lecture as
              soon as they&apos;re ready.
            </p>

            <div className="space-y-3">
              {prepared.docs.map((doc) => (
                <DocumentStatusCard key={doc.documentId} documentId={doc.documentId} filename={doc.name} onReady={markReady} />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => enterLecture(prepared.lectureId)}
                className="text-sm text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
              >
                Skip and start now
              </button>
              <button
                onClick={() => enterLecture(prepared.lectureId)}
                disabled={!allReady}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {allReady ? <><Play className="h-5 w-5" /> Enter lecture</> : <><Loader className="h-5 w-5 animate-spin" /> Indexing…</>}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default LectureSetup;
