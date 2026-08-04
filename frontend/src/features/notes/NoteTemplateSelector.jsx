const templates = [['concise', 'Concise'], ['detailed', 'Detailed'], ['bullet', 'Bullets'], ['revision', 'Revision'], ['summary', 'Summary']];

export default function NoteTemplateSelector({ value, onChange }) {
  return <label className="block text-sm font-medium text-gray-700">Note style
    <select value={value} onChange={(event) => onChange(event.target.value)} className="ml-2 border rounded px-2 py-1 bg-white">
      {templates.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  </label>;
}
