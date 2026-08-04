export default function TopicNavigation({ topics, onSelect }) {
  if (!topics?.length) return null;
  return <nav className="mb-5 p-3 bg-indigo-50 rounded"><p className="font-medium text-sm mb-2">Lecture topics</p>{topics.map((topic) => <button key={topic._id || topic.start_ms} onClick={() => onSelect?.(topic)} className="block text-left text-sm text-indigo-700 py-1">{topic.title}</button>)}</nav>;
}
