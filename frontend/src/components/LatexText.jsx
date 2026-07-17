import katex from 'katex';
import 'katex/dist/katex.min.css';

function findClosingDelimiter(text, startIndex, delimiter) {
  let index = startIndex;
  while (index < text.length) {
    const foundIndex = text.indexOf(delimiter, index);
    if (foundIndex === -1) return -1;

    const previousChar = text[foundIndex - 1];
    if (previousChar !== '\\') return foundIndex;

    index = foundIndex + delimiter.length;
  }

  return -1;
}

function parseLatexText(value) {
  const text = String(value || '');
  const parts = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('$$', index)) {
      const end = findClosingDelimiter(text, index + 2, '$$');
      if (end !== -1) {
        parts.push({ type: 'math', display: true, value: text.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (text.startsWith('\\(', index)) {
      const end = findClosingDelimiter(text, index + 2, '\\)');
      if (end !== -1) {
        parts.push({ type: 'math', display: false, value: text.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (text[index] === '$' && text[index + 1] !== '$' && text[index - 1] !== '\\') {
      const end = findClosingDelimiter(text, index + 1, '$');
      if (end !== -1) {
        parts.push({ type: 'math', display: false, value: text.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    const nextDollar = text.indexOf('$', index + 1);
    const nextParen = text.indexOf('\\(', index + 1);
    const candidates = [nextDollar, nextParen].filter((item) => item !== -1);
    const next = candidates.length ? Math.min(...candidates) : text.length;
    parts.push({ type: 'text', value: text.slice(index, next) });
    index = next;
  }

  return parts;
}

function renderMathToHtml(content, displayMode) {
  try {
    return katex.renderToString(content, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'html',
    });
  } catch {
    return katex.renderToString(String(content || ''), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: 'html',
    });
  }
}

export default function LatexText({ text, className = '' }) {
  const parts = parseLatexText(text);

  return (
    <span className={`latex-text ${className}`.trim()}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={`text-${index}`} className="latex-plain-text">{part.value}</span>;
        }

        return (
          <span
            key={`math-${index}`}
            className={part.display ? 'latex-display-math' : 'latex-inline-math'}
            dangerouslySetInnerHTML={{ __html: renderMathToHtml(part.value, part.display) }}
          />
        );
      })}
    </span>
  );
}
