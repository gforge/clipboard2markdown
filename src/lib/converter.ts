import TurndownService from 'turndown';
import { marked } from 'marked';
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
  dropCode?: boolean; // strip code formatting, keep content
  dropItalic?: boolean; // strip italic/emphasis formatting, keep content
  normalizePunctuation?: boolean; // replace smart punctuation (— “ ” ’ …) with ASCII
  pandocHeadings?: boolean; // convert #/## to underlined h1/h2
  headingsToBold?: boolean; // convert headings to bold/plain text
  gfm?: boolean; // currently unused (consider implementing or removing)
  dePdf?: boolean; // (currently implied by type === 'PDF')
  output?: 'markdown' | 'clean'; // 'clean' returns sanitized HTML instead of Markdown
};

type ConvertType = 'PDF' | 'HTML';

type Opt = Required<Pick<ConvertOptions, 'output'>> & ConvertOptions;

const normalizeOptions = (options: ConvertOptions): Opt => ({
  output: options.output ?? 'markdown',
  ...options,
});

const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/i;

const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const stripCodeFromMarkdown = (md: string): string => {
  md = md.replaceAll(/```([\s\S]*?)```/g, (_m, inner) => inner.trim());
  md = md.replaceAll(/`([^`]+)`/g, (_m, inner) => inner);
  return md;
};

const stripItalicFromMarkdown = (md: string): string => {
  // NOTE: regex approach is inherently imperfect for Markdown;
  // prefer stripping at HTML stage when possible.
  md = md.replaceAll(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, inner) => inner);
  md = md.replaceAll(/(?<!_)_([^_]+)_(?!_)/g, (_m, inner) => inner);
  return md;
};

const applyMarkdownTransforms = (md: string, options: Opt): string => {
  if (options.pandocHeadings) md = toPandocHeadings(md);

  if (options.headingsToBold) {
    md = md.replaceAll(/^[ \t]*#{1,6}\s+(.+?)\s*$/gm, (_m, p1) => `**${p1.trim()}**\n\n`);
    md = md.replaceAll(/^(.*)\n=+$/gm, (_m, p1) => `**${p1.trim()}**\n\n`);
    md = md.replaceAll(/^(.*)\n-+$/gm, (_m, p1) => `**${p1.trim()}**\n\n`);
  }

  if (options.dropCode) md = stripCodeFromMarkdown(md);
  if (options.dropItalic) md = stripItalicFromMarkdown(md);

  return md;
};

const finalizeText = (text: string, options: Opt): string => {
  let md = text;

  // Always: normalize whitespace-ish issues
  md = md.replaceAll(/\u00A0/, ' '); // NBSP
  md = md.replaceAll(/\n{3,}/g, '\n\n');
  md = md.replaceAll(/ +$/gm, '');

  if (options.normalizePunctuation) {
    md = normalizePunctuation(md);
    md = md.replaceAll(/[\u2013\u2014]/g, '-'); // en/em dash
  }

  // Remove control chars except common whitespace
  md = md.replaceAll(/\p{Cc}/gu, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));

  return md;
};

const toCleanHtmlFromMarkdown = (md: string): string => {
  const html = marked.parse(md) as string;
  // Strip common attributes (keep content)
  return html.replaceAll(/\s+(?:style|class|id|data-[a-z0-9-]+)="[^"]*"/gi, '');
};

const turndownCache = new Map<string, TurndownService>();

const getTurndown = (options: Opt): TurndownService => {
  // Only cache on knobs that affect rules
  const key = JSON.stringify({
    dropImages: !!options.dropImages,
    dropBold: !!options.dropBold,
    dropCode: !!options.dropCode,
    dropItalic: !!options.dropItalic,
  });

  const cached = turndownCache.get(key);
  if (cached) return cached;

  const svc = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  svc.addRule('sup', {
    filter: 'sup',
    replacement: (content) => `^${content}^`,
  });

  svc.addRule('sub', {
    filter: 'sub',
    replacement: (content) => `~${content}~`,
  });

  if (options.dropImages) {
    svc.addRule('dropImages', { filter: 'img', replacement: () => '' });
  }
  if (options.dropBold) {
    svc.addRule('stripBold', { filter: ['strong', 'b'], replacement: (content) => content });
  }
  if (options.dropCode) {
    svc.addRule('stripCode', { filter: ['code', 'pre'], replacement: (content) => content });
  }
  if (options.dropItalic) {
    svc.addRule('stripItalic', { filter: ['em', 'i'], replacement: (content) => content });
  }

  turndownCache.set(key, svc);
  return svc;
};

const convertPdf = (raw: string, options: Opt): string => {
  const md = finalizeText(dePdfCleanup(raw), options);

  if (options.output === 'clean') {
    const paragraphs = md
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('\n');
    return paragraphs;
  }

  return md;
};

const convertHtmlish = (raw: string, options: Opt): string => {
  const hasHtml = HTML_TAG_RE.test(raw);
  const looksLikeMarkdown = /^(?:\s*#{1,6}\s+|\s*>\s+|^\s*```)/m.test(raw);

  const hasAnyTransform =
    !!options.dropImages ||
    !!options.dropBold ||
    !!options.dropCode ||
    !!options.dropItalic ||
    !!options.normalizePunctuation ||
    !!options.pandocHeadings ||
    !!options.headingsToBold ||
    options.output !== 'markdown';

  // Fast path: already markdown and no transforms requested
  if (!hasHtml && looksLikeMarkdown && !hasAnyTransform) return raw;

  // Fast path: simple <p>...</p> HTML that unwraps into markdown-ish content
  if (hasHtml && !hasAnyTransform) {
    const simpleHtml = /^(<p[^>]*>[\s\S]*?<\/p>\s*)+$/i.test(raw.trim());
    if (simpleHtml) {
      const unwrapped = raw
        .replaceAll(/<p[^>]*>/gi, '')
        .replaceAll(/<\/p>/gi, '\n\n')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .trim();

      if (/^(?:\s*#{1,6}\s+|\s*>\s+|^\s*```)/m.test(unwrapped)) return unwrapped;
    }
  }

  const cleaned = sanitizeHtml(raw) || '';
  const svc = getTurndown(options);

  let md = svc.turndown(cleaned);
  md = preferOriginalH1Heading(cleaned, md);
  md = applyMarkdownTransforms(md, options);
  md = finalizeText(md, options);

  const hadHeadingTags = /<h[1-6]\b/i.test(cleaned);
  if (!hadHeadingTags) md = ensureNumberedHeadingParagraphBreak(md);

  if (options.output === 'clean') return toCleanHtmlFromMarkdown(md);
  return md;
};

export function convertToMarkdown(
  raw: string,
  type: ConvertType,
  options: ConvertOptions = {},
): string {
  const opt = normalizeOptions(options);
  return type === 'PDF' ? convertPdf(raw, opt) : convertHtmlish(raw, opt);
}

export default convertToMarkdown;
