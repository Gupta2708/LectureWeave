import { useEffect, useState } from 'react';
import { getDocumentStatus } from '../../api/endpoints/documents';

export default function DocumentStatusCard({ documentId }) {
  const [document, setDocument] = useState(null);
  useEffect(() => {
    let active = true;
    const poll = async () => { const response = await getDocumentStatus(documentId); if (active) setDocument(response.data); };
    poll(); const timer = setInterval(() => { if (document && !['extracting', 'chunking', 'embedding'].includes(document.status)) return; poll(); }, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [documentId, document?.status]);
  return <div className="text-xs text-gray-600">{document?.filename || 'Document'}: {document?.status || 'checking'}</div>;
}
