import { Loader2, CheckCircle2 } from 'lucide-react';

// Maps backend job_status.stage values to friendly labels.
const LABELS = {
  transcribe: 'Transcribing audio',
  retrieve: 'Retrieving context',
  enhanced_notes: 'Generating notes',
  periodic_synthesis: 'Structuring notes',
  final_synthesis: 'Finalising lecture',
  complete: 'Up to date',
};

export default function ProcessingStatus({ status }) {
  if (!status?.stage) return null;
  const label = LABELS[status.stage] || status.stage.replaceAll('_', ' ');
  const done = status.stage === 'complete';
  const pct = Math.round((status.ratio || 0) * 100);

  return (
    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/70 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-800">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        )}
        {label}
      </div>
      {!done && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
          <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
