import type { ReactNode } from 'react';
import architectureDoc from '../../../docs/architecture.md?raw';

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer">
          {match[1]}
        </a>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<code key={key++}>{match[4]}</code>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderMarkdown(source: string): ReactNode[] {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre key={key++}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
      blocks.push(<Tag key={key++}>{renderInline(headingMatch[2])}</Tag>);
      i++;
      continue;
    }

    if (line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((row) => !/^\|[\s-|]+\|$/.test(row.trim()))
        .map((row) =>
          row
            .trim()
            .slice(1, -1)
            .split('|')
            .map((cell) => cell.trim()),
        );
      const [headerRow, ...bodyRows] = rows;
      blocks.push(
        <table key={key++}>
          <thead>
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx}>{renderInline(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{renderInline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    const listMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (listMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^\d+\.\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push(
        <ol key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const bulletMatch = /^[-*]\s+(.*)$/.exec(line);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^[-*]\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```')) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++}>{renderInline(paraLines.join(' '))}</p>);
  }

  return blocks;
}

// DEMO-ONLY START — このコンポーネントは fork 後に不要なら src/components/about/ を削除するだけで消せる
export function AboutPage() {
  return <article className="about-page">{renderMarkdown(architectureDoc)}</article>;
}
// DEMO-ONLY END
