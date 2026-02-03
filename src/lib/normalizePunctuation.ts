export function normalizePunctuation(md: string): string {
  return (
    md
      .replaceAll(/[\u2018\u2019\u00b4]/g, "'")
      .replaceAll(/[\u201c\u201d\u2033]/g, '"')
      .replaceAll(/[\u2212\u2022\u00b7\u25aa]/g, '-')
      .replaceAll('\u2026', '...')
      // Normalize CRLF to LF
      .replaceAll(/\r\n?/g, '\n')
      // Unescape escaped leading '#' (Turndown may escape hashes inside paragraphs) so we can detect headings
      .replaceAll(/(^|\n)\\#\s+/g, '$1# ')
      // Ensure headings are surrounded by blank lines so they remain intact in Markdown
      .replaceAll(/([^\n])\n(#{1,6}\s+)/g, '$1\n\n$2')
      .replaceAll(/(#{1,6}[^\n]+)\n(?!\n)/g, '$1\n\n')

      // Normalize whitespace around newlines and collapse long gaps to paragraph breaks
      .replaceAll(/ +\n/g, '\n')
      .replaceAll(/\n{3,}/g, '\n\n')

      // Tidy spaces and punctuation
      .replaceAll('\u00A0', ' ')
      .replaceAll(/\s+([,.;:!?])/g, '$1')
      .replaceAll(/ {2,}/g, ' ')
      .replaceAll(/ +$/gm, '')
      .trim()
  );
}
