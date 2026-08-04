import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, AlertCircle, RotateCw, FileText } from 'lucide-react';
import { getDocumentStatus, retryDocument } from '../../api/endpoints/documents';

// Backend document lifecycle → user-facing steps.
const STEPS = [
  { key: 'uploaded', label: 'Uploaded' },
  { key: 'extracting', label: 'Extracting text' },
  { key: 'chunking', label: 'Chunking' },
  { key: 'embedding', label: 'Creating embeddings' },
  { key: 'ready', label: 'Ready for lecture' },
];
const IN_PROGRESS = new Set(['uploaded', 'extracting', 'chunking', 'embedding']);

export default function DocumentStatusCard({ documentId, filename, onReady }) {
  const [doc, setDoc] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    let active = true;
    let timer;
    const poll = async () => {
      try {
        const { data } = await getDocumentStatus(documentId);
        if (!active) return;
        setDoc(data);
        if (data.status === 'ready' && !notified.current) {
          notified.current = true;
          onReady?.(documentId);
        }
        if (IN_PROGRESS.has(data.status)) timer = setTimeout(poll, 1500);
      } catch {
        if (active) timer = setTimeout(poll, 2500);
      }
    };
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [documentId]);

  const status = doc?.status || 'uploaded';
  const failed = status === 'failed';
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const name = filename || doc?.filename || 'Document';

  const retry = async () => {
    setRetrying(true);
    notified.current = false;
    try {
      await retryDocument(documentId);
      setDoc((d) => ({ ...(d || {}), status: 'uploaded', error: null }));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <FileText className="h-4 w-4 text-indigo-500" />
        <span className="truncate">{name}</span>
      </div>

      {failed ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {doc?.error ? 'Processing failed' : 'Processing failed'}
          </div>
          <button
            onClick={retry}
            disabled={retrying || (doc?.retry_count ?? 0) >= 3}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      ) : (
        <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {STEPS.map((step, i) => {
            const done = status === 'ready' || i < currentIndex;
            const active = i === currentIndex && status !== 'ready';
            return (
              <li key={step.key} className="flex items-center gap-1.5 text-xs">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    done ? 'bg-green-500 text-white' : active ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : active ? <Loader2 className="h-3 w-3 animate-spin" /> : i + 1}
                </span>
                <span className={done ? 'text-gray-700' : active ? 'font-medium text-indigo-700' : 'text-gray-400'}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
