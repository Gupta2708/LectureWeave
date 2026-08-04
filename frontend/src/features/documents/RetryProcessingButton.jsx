import { useState } from 'react';
import { retryDocument } from '../../api/endpoints/documents';

export default function RetryProcessingButton({ documentId, retryCount = 0, maxRetries = 3 }) {
  const [busy, setBusy] = useState(false);
  const retry = async () => { setBusy(true); try { await retryDocument(documentId); } finally { setBusy(false); } };
  return <button disabled={busy || retryCount >= maxRetries} onClick={retry} className="text-xs text-indigo-700 disabled:text-gray-400">{busy ? 'Retrying…' : `Retry (${retryCount}/${maxRetries})`}</button>;
}
