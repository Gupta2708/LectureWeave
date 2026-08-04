export default function CitationBadge({ id, onClick }) {
  return <button onClick={() => onClick?.(id)} className="inline-flex mx-0.5 px-1.5 py-0.5 text-xs rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200" title={`Open source ${id}`}>[{id.replace(/^C/, '')}]</button>;
}
