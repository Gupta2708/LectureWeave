import { createMarker } from '../../api/endpoints/markers';

const markers = [['important', 'Important'], ['confusing', 'Confusing'], ['exam_hint', 'Exam hint'], ['example', 'Example'], ['revisit', 'Revisit']];

export default function LectureMarkerButton({ lectureId, startMs, onCreated }) {
  const add = async (type) => {
    const response = await createMarker(lectureId, { type, start_ms: Math.max(0, startMs || 0) });
    onCreated?.({ _id: response.data.marker_id, type, start_ms: startMs || 0 });
  };
  return <div className="flex flex-wrap gap-2">{markers.map(([type, label]) => <button key={type} onClick={() => add(type)} className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">{label}</button>)}</div>;
}
