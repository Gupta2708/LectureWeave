import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Some LLM outputs double-wrap display math, e.g.
//   $$
//   $$
//   P(y|x) = ...
//   $$
//   $$
// which remark-math reads as an empty math block + literal text. Collapsing
// consecutive `$$`-only lines to a single delimiter restores valid display math.
export function sanitizeMarkdown(md) {
  if (!md) return '';
  const out = [];
  for (const line of String(md).split('\n')) {
    if (line.trim() === '$$' && out.length && out[out.length - 1].trim() === '$$') continue;
    out.push(line);
  }
  return out.join('\n');
}

const REMARK = [remarkGfm, remarkMath];
const REHYPE = [rehypeKatex];

/**
 * Renders Markdown with GitHub-flavoured extensions and KaTeX math.
 * `components` lets callers override element rendering (e.g. inline citations).
 */
export default function MarkdownView({ children, className = '', components }) {
  return (
    <div className={`prose prose-sm max-w-none prose-headings:font-semibold prose-pre:bg-gray-900 ${className}`}>
      <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={components}>
        {sanitizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
