import type TurndownService from 'turndown';

type Elem = HTMLElement;

const isCell = (n: Node) => n.nodeName === 'TD' || n.nodeName === 'TH';
const isSection = (n: Node) =>
  n.nodeName === 'THEAD' || n.nodeName === 'TBODY' || n.nodeName === 'TFOOT';

const closestTable = (node: Node): Elem | null => {
  let cur: Node | null = node.parentNode;
  while (cur) {
    if (cur.nodeName === 'TABLE') return cur as Elem;
    cur = cur.parentNode;
  }
  return null;
};

/** Rows that belong to this table (directly or via thead/tbody/tfoot), not to nested tables. */
const rowsOf = (table: Elem): Elem[] => {
  const rows: Elem[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (child.nodeName === 'TR') rows.push(child as Elem);
      else if (isSection(child)) walk(child);
    }
  };
  walk(table);
  return rows;
};

const cellsOf = (row: Elem): Elem[] => Array.from(row.children).filter(isCell) as Elem[];

const spanOf = (cell: Elem): number => {
  const n = Number.parseInt(cell.getAttribute('colspan') ?? '1', 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const rowWidth = (row: Elem): number => cellsOf(row).reduce((n, c) => n + spanOf(c), 0);

type TableInfo = {
  /** True when the table should become a Markdown pipe table; false for layout tables. */
  data: boolean;
  cols: number;
  header: Elem | null;
};

const tableInfoCache = new WeakMap<Elem, TableInfo>();

const tableInfo = (table: Elem): TableInfo => {
  const cached = tableInfoCache.get(table);
  if (cached) return cached;
  const rows = rowsOf(table);
  const cols = rows.reduce((max, r) => Math.max(max, rowWidth(r)), 0);
  const nested = table.getElementsByTagName('table').length > 0;
  // Single-column or single-row tables and tables wrapping other tables are
  // almost always layout scaffolding (email signatures, Word page layout).
  const info: TableInfo = {
    data: !nested && rows.length >= 2 && cols >= 2,
    cols,
    header: rows[0] ?? null,
  };
  tableInfoCache.set(table, info);
  return info;
};

const infoFor = (node: Node): TableInfo | null => {
  const table = closestTable(node);
  return table ? tableInfo(table) : null;
};

/** Markdown table cells are single-line: fold paragraph/line breaks into <br>. */
const cellText = (content: string): string =>
  content
    .trim()
    .replaceAll(/[ \t]*\n[\s]*/g, '<br>')
    .replaceAll('|', '\\|');

const block = (content: string) => `\n\n${content}\n\n`;

/**
 * GitHub-flavoured pipe tables. The first row is always used as the header
 * (GFM requires one); ragged rows are padded and colspans expanded so the
 * table stays well-formed.
 */
export const addTableRules = (svc: TurndownService): void => {
  svc.addRule('tableSection', {
    filter: ['thead', 'tbody', 'tfoot', 'colgroup'],
    replacement: (content) => content,
  });

  svc.addRule('tableCaption', {
    filter: 'caption',
    replacement: (content) => block(content.trim()),
  });

  svc.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content, node) => {
      const cell = node as Elem;
      const info = infoFor(cell);
      if (!info?.data) return block(content);
      let text = cellText(content);
      // The header row renders bold anyway; drop redundant emphasis markers.
      if (cell.parentNode === info.header) {
        text = text.replace(/^\*\*(.+)\*\*$/s, '$1');
      }
      return ` ${text} |${'  |'.repeat(spanOf(cell) - 1)}`;
    },
  });

  svc.addRule('tableRow', {
    filter: 'tr',
    replacement: (content, node) => {
      const row = node as Elem;
      const info = infoFor(row);
      if (!info?.data) return content;
      let line = `|${content}${'  |'.repeat(Math.max(0, info.cols - rowWidth(row)))}`;
      if (row === info.header) line += `\n|${' --- |'.repeat(info.cols)}`;
      return `\n${line}`;
    },
  });

  svc.addRule('table', {
    filter: 'table',
    replacement: (content, node) => {
      const info = tableInfo(node as Elem);
      return block(info.data ? content.replace(/^\n+/, '') : content);
    },
  });
};

/**
 * Tight lists. Turndown emits a blank line after every <li> whose text is
 * wrapped in <p> (Word, Outlook, Google Docs and Teams all do this), which
 * turns every list into a loose list. We trim each item instead and only
 * keep blank lines that separate real paragraphs inside one item.
 */
export const addListRules = (svc: TurndownService): void => {
  svc.addRule('tightListItem', {
    filter: 'li',
    replacement: (content, node, options) => {
      const li = node as Elem;
      const parent = li.parentNode as Elem | null;
      let prefix = `${options.bulletListMarker} `;
      if (parent?.nodeName === 'OL') {
        const start = parent.getAttribute('start');
        const index = Array.prototype.indexOf.call(parent.children, li);
        prefix = `${start ? Number(start) + index : index + 1}. `;
      }
      const indent = ' '.repeat(prefix.length);
      const body = content
        .replace(/^\n+/, '')
        .replace(/\n+$/, '')
        // A nested list directly after the item text should not be preceded by a blank line.
        .replaceAll(/\n{2,}(?=[ \t]*(?:[*+-]|\d+\.) )/g, '\n')
        .split('\n')
        .map((line, i) => (i === 0 || line === '' ? line : indent + line))
        .join('\n');
      return prefix + body + (li.nextSibling ? '\n' : '');
    },
  });
};
