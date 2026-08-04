import { exportLectureNotes } from '../../api/endpoints/notes';

export default function ExportNotesMenu({ lectureId, title = 'lecture-notes' }) {
  const download = async (format) => {
    const response = await exportLectureNotes(lectureId, format);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a'); link.href = url; link.download = `${title}.${format}`; link.click(); URL.revokeObjectURL(url);
  };
  return <select aria-label="Export notes" defaultValue="" onChange={(event) => event.target.value && download(event.target.value)} className="border rounded p-1 text-sm"><option value="" disabled>Export</option><option value="md">Markdown</option><option value="txt">Text</option><option value="pdf">PDF</option><option value="docx">DOCX</option></select>;
}
