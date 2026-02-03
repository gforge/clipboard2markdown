export const decodeHtmlEntities = (s: string) =>
  s
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/&nbsp;/gi, ' ')
    .replaceAll(/&ndash;/gi, '-')
    .replaceAll(/&mdash;/gi, '-')
    .replaceAll(/&amp;/gi, '&')
    .replaceAll(/&lt;/gi, '<')
    .replaceAll(/&gt;/gi, '>')
    .replaceAll(/\s+/g, ' ')
    .trim();

// Prefer the original <h1> content when the source HTML contained heading tags.
// This avoids cases where Turndown/newline normalization splits a heading across
// lines and merges part of it into the following paragraph. The replacement
// is conservative: it only joins if the concatenation of the first and second
// converted lines matches the original <h1> text (after normalization).
export function preferOriginalH1Heading(cleanedHtml: string, md: string): string {
  const h1m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(cleanedHtml);
  if (!h1m || !h1m[1]) return md;
  const h1text = decodeHtmlEntities(h1m[1]);
  const normalize = (s: string) => s.replaceAll(/\s+/g, ' ').trim();

  return md.replace(
    /^(#{1,6})\s*([^\n]+)(?:\n\s*)*([^\n]+)?/m,
    (match, hashes, firstLine, secondLine) => {
      if (secondLine && normalize(`${firstLine} ${secondLine}`) === normalize(h1text)) {
        return `${hashes} ${h1text}`;
      }
      if (
        !secondLine &&
        (normalize(firstLine) === normalize(h1text) ||
          normalize(firstLine).startsWith(normalize(h1text).slice(0, 20)))
      ) {
        return `${hashes} ${h1text}`;
      }
      return match;
    },
  );
}

// Convert ATX headings to Pandoc underline style for h1/h2
export function toPandocHeadings(md: string): string {
  md = md.replaceAll(
    /\s*##\s+(.+)$/gm,
    (_match: string, title: string) => `\n\n${title}\n${'-'.repeat(title.length)}\n\n`,
  );
  md = md.replaceAll(
    /\s*#\s+(.+)$/gm,
    (_match: string, title: string) => `\n\n${title}\n${'='.repeat(title.length)}\n\n`,
  );
  return md;
}

// Insert a paragraph break after numbered section headings that got merged with the paragraph
export function ensureNumberedHeadingParagraphBreak(md: string): string {
  return md.replaceAll(/(^|\n)(#\s*\d+\.[^\n]*?)\s+([A-Z][A-Za-z0-9])/g, '$1$2\n\n$3');
}
