import TurndownService from 'turndown';

export type ConvertOptions = {
  dropImages?: boolean;
  dropBold?: boolean;
  dashToHyphen?: boolean;
  pandocHeadings?: boolean; // convert #/## to underlined h1/h2
  gfm?: boolean;
  dePdf?: boolean; // De-PDF: join hyphenation, collapse soft wraps, remove backslash escapes
};

function normalizePunctuation(md: string): string {
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
      // Join letter fragments split across lines with safer rules:
      // - lowercase -> uppercase: likely sentence boundary, replace with space
      .replaceAll(/([a-z])(?:[ \t]*\n[ \t]*)+([A-Z])/g, '$1 $2')
      // - letter -> lowercase: likely mid-word split, join without space
      .replaceAll(/([A-Za-z])(?:[ \t]*\n[ \t]*)+([a-z])/g, '$1$2')
      // - uppercase -> uppercase: treat as word boundary, keep a space
      .replaceAll(/([A-Z])(?:[ \t]*\n[ \t]*)+([A-Z])/g, '$1 $2')

      // Collapse multiple newlines to paragraph breaks
      .replaceAll(/\n{3,}/g, '\n\n')

      .replaceAll(/ +\n/g, '\n')
      .replaceAll(/ +$/gm, '')
      .trim()
  );
}

export function convertHtmlToMarkdown(html: string, options: ConvertOptions = {}): string {
  // Remove MS Word / Office cruft and style blocks commonly pasted into the top of documents
  const sanitizeHtml = (input: string = '') => {
    // Remove <head> blocks, styles, xml blocks and comments
    let s = input;
    s = s.replaceAll(/<head[\s\S]*?>[\s\S]*?<\/head>/gi, '');
    s = s.replaceAll(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    s = s.replaceAll(/<meta[\s\S]*?>/gi, '');
    s = s.replaceAll(/<link[\s\S]*?>/gi, '');
    s = s.replaceAll(/<xml[\s\S]*?>[\s\S]*?<\/xml>/gi, '');
    s = s.replaceAll(/<!--([\s\S]*?)-->/g, '');
    // Remove stray @page or CSS rules if present as text nodes
    s = s.replaceAll(/@page[\s\S]*?\}/gi, '');
    // Remove inline style attributes that often carry MS Office artifacts
    s = s.replaceAll(/\sstyle="[^"]*"/gi, '');
    // Remove Microsoft-specific tags like <o:p>
    s = s.replaceAll(/<o:p>[\s\S]*?<\/o:p>/gi, '');
    // Trim leading/trailing whitespace
    return s.trim();
  };

  type TurndownLike = {
    addRule: (
      name: string,
      rule: {
        filter: string | string[] | ((node: unknown) => boolean);
        replacement: (content: string, node?: unknown) => string;
      },
    ) => void;
    turndown: (html: string) => string;
  };

  // Turndown doesn't provide fully compatible typings here; cast to a local interface.
  const svc = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  }) as unknown as TurndownLike;

  // Superscript/subscript rules (mimic pandoc behavior)
  svc.addRule('sup', {
    filter: 'sup',
    replacement: (content: string) => `^${content}^`,
  });

  svc.addRule('sub', {
    filter: 'sub',
    replacement: (content: string) => `~${content}~`,
  });

  // Option: drop images
  if (options.dropImages) {
    svc.addRule('dropImages', {
      filter: 'img',
      replacement: () => '',
    });
  }

  // Option: strip bold formatting but keep content
  if (options.dropBold) {
    svc.addRule('stripBold', {
      filter: ['strong', 'b'],
      replacement: (content: string) => content,
    });
  }

  // Keep default image behavior otherwise (Turndown default will emit ![alt](src))

  // Sanitize incoming HTML to remove top-of-document style cruft
  const cleaned = sanitizeHtml(html);
  let md = svc.turndown(cleaned || '');

  // If the original HTML contained heading tags, prefer the original heading text for those headings
  const hadHeadingTags = /<h[1-6]\b/i.test(cleaned);
  if (hadHeadingTags) {
    const decodeHtml = (s: string) =>
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

    // Replace the first converted ATX heading with the original <h1> text if present
    const h1m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(cleaned);
    if (h1m && h1m[1]) {
      const h1text = decodeHtml(h1m[1]);
      md = md.replace(/^(#+)\s.*$/m, (line, hashes) => `${hashes} ${h1text}`);
    }
  }

  // Optional: convert ATX headings to Pandoc-style underlines for h1 and h2
  if (options.pandocHeadings) {
    // h2 (## ) -> underline with '-'
    md = md.replaceAll(
      /^\s*##\s+(.+)$/gm,
      (_match: string, title: string) => `\n\n${title}\n${'-'.repeat(title.length)}\n\n`,
    );
    // h1 (# ) -> underline with '='
    md = md.replaceAll(
      /^\s*#\s+(.+)$/gm,
      (_match: string, title: string) => `\n\n${title}\n${'='.repeat(title.length)}\n\n`,
    );
  }

  // Dash normalization: convert en/em dash to single hyphen
  if (options.dashToHyphen) {
    md = md.replaceAll(/[\u2013\u2014]/g, '-');
  }

  // Minimal punctuation normalization
  md = normalizePunctuation(md);
  // If a numbered section heading (e.g. "# 3.Title") ends up inline with content, insert a paragraph break
  // between the heading and the following paragraph (handles tag-less concatenations from some paste sources).
  md = md.replaceAll(/(^|\n)(#\s*\d+\.[^\n]*?)\s+([A-Z][A-Za-z0-9])/g, '$1$2\n\n$3');

  // General cleanup: normalize non-breaking spaces and tidy punctuation/spacing
  md = md.replaceAll('\u00A0', ' ');
  // Remove any spaces that appear before punctuation (e.g., "word ," -> "word,")
  md = md.replaceAll(/\s+([,.;:!?])/g, '$1');
  // Remove spaces left before newlines
  md = md.replaceAll(/ +\n/g, '\n');
  // Collapse multiple spaces into single spaces
  md = md.replaceAll(/ {2,}/g, ' ');

  // Normalize repeated newlines
  md = md.replaceAll(/\n{3,}/g, '\n\n').trim();

  // De-PDF: optional PDF clean-up suite — join hyphenated words, collapse soft wraps, and remove backslash-escapes
  const dePdfCleanup = (s: string) =>
    s
      // Normalize CRLF to LF
      .replaceAll(/\r\n?/g, '\n')
      // Join letter fragments split across lines ("expens\n    es" -> "expenses")
      .replaceAll(/([A-Za-z])(?:[ \t]*\n[ \t]*)+([A-Za-z])/g, '$1$2')
      // Join hyphenated words split across lines ("ulti-\n   mately" -> "ultimately")
      .replaceAll(/-(?:[ \t]*\n[ \t]*)+/g, '')
      // Remove dangling hyphen + space that can remain after soft wrapping ("ulti- mately" -> "ultimately")
      .replaceAll(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
      // Replace single newlines (possibly surrounded by spaces/tabs) with a space, but preserve newlines followed by an underline (=== or ---) or another newline
      .replaceAll(/[ \t]*\n(?!\n|[=-]+\n)[ \t]*/g, ' ')
      // Remove runs of backslashes immediately before bracket/paren ("\\\[1\\\]" -> "[1]")
      .replaceAll(/\\+(?=[\u005B\u005D\u0028\u0029])/g, '')
      // Collapse multiple spaces/newlines and trim
      .replaceAll(/ {2,}/g, ' ')
      .replaceAll(/\n{3,}/g, '\n\n')
      .trim();

  // Backwards-compat: accept older `stripBackslashEscapes` option by treating it as `dePdf`
  const legacyStrip = (options as unknown as { stripBackslashEscapes?: boolean })
    .stripBackslashEscapes;
  if (options.dePdf || legacyStrip) {
    md = dePdfCleanup(md);
  }

  // Remove any non-printable control characters introduced by pasted content, but keep common whitespace (\n, \r, \t)
  md = md.replaceAll(/\p{Cc}/gu, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));

  return md;
}

export default convertHtmlToMarkdown;
