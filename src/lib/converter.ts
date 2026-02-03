import TurndownService from 'turndown';
import { sanitizeHtml } from './sanitizeHtml';
import { normalizePunctuation } from './normalizePunctuation';
import { dePdfCleanup } from './dePdfCleanup';
import {
  preferOriginalH1Heading,
  toPandocHeadings,
  ensureNumberedHeadingParagraphBreak,
} from './headingUtils';

export type ConvertOptions = {
  dropImages?: boolean;
  dropBold?: boolean;
  dashToHyphen?: boolean;
  pandocHeadings?: boolean; // convert #/## to underlined h1/h2
  gfm?: boolean;
  dePdf?: boolean; // De-PDF: join hyphenation, collapse soft wraps, remove backslash escapes
};

export function convertToMarkdown(
  raw: string,
  type: 'PDF' | 'HTML',
  options: ConvertOptions = {},
): string {
  if (type === 'PDF') {
    // For PDF text, apply dePdf cleanup and minimal normalization
    let md = dePdfCleanup(raw);
    md = normalizePunctuation(md);
    // Dash normalization
    if (options.dashToHyphen) {
      md = md.replaceAll(/[\u2013\u2014]/g, '-');
    }
    // Remove control characters
    md = md.replaceAll(/\p{Cc}/gu, (c: string) =>
      c === '\n' || c === '\r' || c === '\t' ? c : '',
    );
    return md;
  }

  // For HTML, proceed with Turndown conversion
  // Fast-path: if no options and looks like Markdown, return as-is
  const hasHtmlTags = /<[^>]+>/.test(raw);
  const looksLikeMarkdown = /^(?:\s*#{1,6}\s+|\s*>\s+|^\s*```)/m.test(raw);
  const noOptionsSet =
    !options.dropImages &&
    !options.dropBold &&
    !options.dashToHyphen &&
    !options.pandocHeadings &&
    !options.gfm;
  if (!hasHtmlTags && looksLikeMarkdown && noOptionsSet) {
    return raw;
  }

  // Additional fast-path: if HTML is simple (just <p> tags), unwrap and check if it looks like Markdown
  if (hasHtmlTags && noOptionsSet) {
    const simpleHtml = /^(<p[^>]*>[\s\S]*?<\/p>\s*)+$/i.test(raw.trim());
    if (simpleHtml) {
      const unwrapped = raw
        .replaceAll(/<p[^>]*>/gi, '')
        .replaceAll(/<\/p>/gi, '\n\n')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .trim();
      if (/^(?:\s*#{1,6}\s+|\s*>\s+|^\s*```)/m.test(unwrapped)) {
        return unwrapped;
      }
    }
  }

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
  const cleaned = sanitizeHtml(raw);
  let md = svc.turndown(cleaned || '');

  // Prefer original heading text (conservative) when source HTML contained heading tags
  // This avoids Turndown/newline heuristics splitting a heading across the following paragraph.
  md = preferOriginalH1Heading(cleaned, md);

  // Optional: convert ATX headings to Pandoc-style underlines for h1 and h2
  if (options.pandocHeadings) {
    md = toPandocHeadings(md);
  }

  // Dash normalization: convert en/em dash to single hyphen
  if (options.dashToHyphen) {
    md = md.replaceAll(/[\u2013\u2014]/g, '-');
  }

  // Minimal punctuation/whitespace normalization
  md = normalizePunctuation(md);

  // Ensure numbered headings separated from following paragraph
  // Only apply this when the source HTML did NOT contain heading tags (tag-less concatenations)
  const hadHeadingTags = /<h[1-6]\b/i.test(cleaned);
  if (!hadHeadingTags) {
    md = ensureNumberedHeadingParagraphBreak(md);
  }

  // Remove any non-printable control characters introduced by pasted content, but keep common whitespace (\n, \r, \t)
  md = md.replaceAll(/\p{Cc}/gu, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));

  return md;
}

export default convertToMarkdown;
