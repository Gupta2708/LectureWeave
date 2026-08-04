import { useState } from 'react';
import { restoreTranscript, updateTranscript } from '../../api/endpoints/transcripts';

const timestamp = (ms) => {
  if (ms == null) return '';
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export default function TranscriptSegmentEditor({ segment, onSaved }) {
  const [value, setValue] = useState(segment.corrected_text || segment.text || '');
  const [editing, setEditing] = useState(false);
  const id = segment.segment_id || segment._id;
  const save = async () => { await updateTranscript(id, value); setEditing(false); onSaved?.(value); };
  const restore = async () => { const response = await restoreTranscript(id); setValue(response.data.effective_text); onSaved?.(response.data.effective_text); };
  return <div className="p-3 bg-gray-50 rounded-lg">
    <div className="text-xs text-gray-500 mb-2">{timestamp(segment.start_ms)} – {timestamp(segment.end_ms)}</div>
    {editing ? <textarea className="w-full border rounded p-2" value={value} onChange={(event) => setValue(event.target.value)} /> : <p className="text-gray-700">{value}</p>}
    {id && <div className="flex gap-2 mt-2 text-xs"><button onClick={() => editing ? save() : setEditing(true)} className="text-indigo-700">{editing ? 'Save correction' : 'Edit'}</button><button onClick={restore} className="text-gray-600">Restore original</button></div>}
  </div>;
}
