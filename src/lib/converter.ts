import TurndownService from 'turndown';

export type ConvertOptions = {
  dropImages?: boolean;
  dropBold?: boolean;
  dashToHyphen?: boolean;
  pandocHeadings?: boolean; // convert #/## to underlined h1/h2
  gfm?: boolean;
  removeReferenceMarkers?: boolean; // strip bracketed and superscript numeric references
};

function normalizePunctuation(md: string): string {
  return md
    .replaceAll(/[\u2018\u2019\u00b4]/g, "'")
    .replaceAll(/[\u201c\u201d\u2033]/g, '"')
    .replaceAll(/[\u2212\u2022\u00b7\u25aa]/g, '-')
    .replaceAll('\u2026', '...')
    .replaceAll(/ +\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .replaceAll(/ +$/gm, '')
    .trim();
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
    replacement: (content: string) => {
      // If requested, treat numeric superscripts as reference markers and drop them
      if (options.removeReferenceMarkers && /^\s*\d+(?:[\s,]*\d+)*\s*$/.test(content)) {
        return '';
      }
      return `^${content}^`;
    },
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

  // Remove reference markers (e.g., [22], [1,2], and numeric superscripts converted to ^22^) if enabled
  if (options.removeReferenceMarkers) {
    // Remove bracketed numeric citations like [22], [1, 2], or escaped brackets like \[1, 2\]
    md = md.replaceAll(/\s*\\?\[\s*\d+(?:[\s,]*\d+)*\s*\\?\]/g, '');
    // Remove isolated numeric parenthetical citations like (22)
    md = md.replaceAll(/\s*\(\s*\d+(?:[\s,]*\d+)*\s*\)/g, '');
    // Remove numeric superscript markers converted as ^22^
    md = md.replaceAll(/\^\d+(?:[\s,]*\d+)*\^/g, '');
    // Trim any resulting extra whitespace/newlines
    md = md.replaceAll(/\n{3,}/g, '\n\n').trim();
  }

  // Remove any non-printable control characters introduced by pasted content, but keep common whitespace (\n, \r, \t)
  md = md.replaceAll(/\p{Cc}/gu, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));

  return md;
}

export default convertHtmlToMarkdown;
