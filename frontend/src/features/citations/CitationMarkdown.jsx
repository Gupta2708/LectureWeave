import ReactMarkdown from 'react-markdown';
import CitationBadge from './CitationBadge';

export default function CitationMarkdown({ markdown, onCitation }) {
  const parts = String(markdown || '').split(/(\[C\d+\])/g);
  return <>{parts.map((part, index) => {
    const match = part.match(/^\[(C\d+)\]$/);
    return match ? <CitationBadge key={`${part}-${index}`} id={match[1]} onClick={onCitation} /> : <ReactMarkdown key={index}>{part}</ReactMarkdown>;
  })}</>;
}
