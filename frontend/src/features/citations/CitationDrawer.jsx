export default function CitationDrawer({ citation, onClose }) {
  if (!citation) return null;
  const location = citation.page_number ? `Page ${citation.page_number}` : citation.slide_number ? `Slide ${citation.slide_number}` : citation.start_ms != null ? `${Math.floor(citation.start_ms / 60000)}:${String(Math.floor(citation.start_ms / 1000) % 60).padStart(2, '0')}` : 'Source excerpt';
  return <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-30 p-6 overflow-auto">
    <button onClick={onClose} className="text-sm text-gray-500">Close</button>
    <h2 className="text-lg font-semibold mt-4">Source [{citation.id?.replace(/^C/, '')}]</h2>
    <p className="text-sm text-gray-500 mt-1">{location} · {citation.mode === 'auto' ? 'Automatically matched' : 'Model cited'}</p>
    <blockquote className="mt-5 border-l-4 border-indigo-200 pl-4 text-gray-700 whitespace-pre-wrap">{citation.excerpt}</blockquote>
  </aside>;
}
