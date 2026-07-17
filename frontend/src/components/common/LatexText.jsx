import { Fragment } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

const LATEX_TOKEN_RE = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^$\n]+?\$)/g;

function latexErrorRenderer({ message }) {
  return <span className="latex-error" title={message}>ביטוי LaTeX אינו תקין</span>;
}

function parseToken(token) {
  if (token.startsWith('$$') && token.endsWith('$$')) {
    return { type: 'block', math: token.slice(2, -2).trim() };
  }

  if (token.startsWith('\\[') && token.endsWith('\\]')) {
    return { type: 'block', math: token.slice(2, -2).trim() };
  }

  if (token.startsWith('\\(') && token.endsWith('\\)')) {
    return { type: 'inline', math: token.slice(2, -2).trim() };
  }

  if (token.startsWith('$') && token.endsWith('$')) {
    return { type: 'inline', math: token.slice(1, -1).trim() };
  }

  return null;
}

export default function LatexText({ text = '' }) {
  const value = String(text || '');
  const parts = value.split(LATEX_TOKEN_RE).filter((part) => part !== '');

  if (parts.length === 0) return null;

  return parts.map((part, index) => {
    const parsed = parseToken(part);

    if (!parsed) {
      return <Fragment key={`text-${index}`}>{part}</Fragment>;
    }

    if (!parsed.math) {
      return <Fragment key={`empty-math-${index}`}>{part}</Fragment>;
    }

    return parsed.type === 'block' ? (
      <BlockMath key={`block-math-${index}`} math={parsed.math} renderError={latexErrorRenderer} />
    ) : (
      <InlineMath key={`inline-math-${index}`} math={parsed.math} renderError={latexErrorRenderer} />
    );
  });
}
