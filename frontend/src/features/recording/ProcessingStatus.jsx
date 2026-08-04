export default function ProcessingStatus({ status }) {
  if (!status?.stage) return null;
  return <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 rounded p-2">Processing: {status.stage.replaceAll('_', ' ')} ({Math.round((status.ratio || 0) * 100)}%)</div>;
}
