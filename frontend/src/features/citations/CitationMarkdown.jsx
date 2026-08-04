import React from 'react';
import MarkdownView from '../../components/MarkdownView';
import CitationBadge from './CitationBadge';

// Replace inline [C#] tokens inside rendered text with clickable badges,
// leaving all other nodes (math, formatting) untouched.
function withCitations(children, onCitation) {
  return React.Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    const parts = child.split(/(\[C\d+\])/g);
    if (parts.length === 1) return child;
    return parts.map((part, i) => {
      const match = part.match(/^\[(C\d+)\]$/);
      return match ? <CitationBadge key={i} id={match[1]} onClick={onCitation} /> : part;
    });
  });
}

export default function CitationMarkdown({ markdown, onCitation }) {
  const wrap = (Tag) => {
    const Cite = ({ children }) => <Tag>{withCitations(children, onCitation)}</Tag>;
    Cite.displayName = `Cite(${Tag})`;
    return Cite;
  };
  const components = {
    p: wrap('p'),
    li: wrap('li'),
    td: wrap('td'),
    th: wrap('th'),
    h1: wrap('h1'),
    h2: wrap('h2'),
    h3: wrap('h3'),
  };
  return <MarkdownView components={components}>{markdown}</MarkdownView>;
}
