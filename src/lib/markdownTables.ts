/**
 * Pads every column of a Markdown pipe table to its widest cell so the source
 * reads like a table too. Pure text transform; non-table lines pass through.
 */

type Align = 'left' | 'right' | 'center' | 'none';

const SEPARATOR_RE = /^\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
const UNESCAPED_PIPE = /(?<!\\)\|/;

const isTableLine = (line: string) => UNESCAPED_PIPE.test(line.trim());

const splitRow = (line: string): string[] => {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(UNESCAPED_PIPE).map((c) => c.trim());
};

const alignOf = (sep: string): Align => {
  const left = sep.startsWith(':');
  const right = sep.endsWith(':');
  if (left && right) return 'center';
  if (left) return 'left';
  if (right) return 'right';
  return 'none';
};

const width = (s: string) => Array.from(s).length;

const pad = (s: string, w: number, align: Align): string => {
  const extra = w - width(s);
  if (extra <= 0) return s;
  if (align === 'right') return ' '.repeat(extra) + s;
  if (align === 'center') {
    const left = Math.floor(extra / 2);
    return ' '.repeat(left) + s + ' '.repeat(extra - left);
  }
  return s + ' '.repeat(extra);
};

const separator = (w: number, align: Align): string => {
  if (align === 'center') return `:${'-'.repeat(w - 2)}:`;
  if (align === 'left') return `:${'-'.repeat(w - 1)}`;
  if (align === 'right') return `${'-'.repeat(w - 1)}:`;
  return '-'.repeat(w);
};

const formatTable = (lines: string[]): string[] => {
  const rows = lines.map(splitRow);
  const aligns = rows[1].map(alignOf);
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(3, ...rows.map((r, i) => (i === 1 ? 0 : width(r[c] ?? '')))),
  );
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return rows.map((r, i) =>
    line(
      widths.map((w, c) => {
        const align = aligns[c] ?? 'none';
        return i === 1 ? separator(w, align) : pad(r[c] ?? '', w, align);
      }),
    ),
  );
};

export const alignMarkdownTables = (md: string): string => {
  const lines = md.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const next = lines[i + 1];
    if (
      isTableLine(lines[i]) &&
      next !== undefined &&
      SEPARATOR_RE.test(next) &&
      isTableLine(next)
    ) {
      let end = i + 2;
      while (end < lines.length && isTableLine(lines[end])) end++;
      out.push(...formatTable(lines.slice(i, end)));
      i = end;
    } else {
      out.push(lines[i]);
      i++;
    }
  }
  return out.join('\n');
};
