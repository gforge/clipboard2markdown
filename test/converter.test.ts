import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';
import type { ConvertOptions } from '../src/lib/converter';

// Cast the imported function to a well-typed signature to satisfy strict lint rules
const convert = convertToMarkdown as (
  raw: string,
  type: 'PDF' | 'HTML',
  options?: ConvertOptions,
) => string;

describe('convertHtmlToMarkdown', () => {
  it('drops images when dropImages is true', () => {
    const html = '<p>Hi <img src="a.png" alt="x"> there</p>';
    const md: string = convert(html, 'HTML', { dropImages: true });
    expect(md).toContain('Hi');
    expect(md).toContain('there');
    expect(md).not.toContain('![');
  });

  it('strips bold when dropBold is true', () => {
    const html = '<p>Foo <strong>Bold</strong> Bar</p>';
    const md: string = convert(html, 'HTML', { dropBold: true });
    expect(md).toContain('Foo Bold Bar');
    expect(md).not.toContain('**');
  });

  it('normalizes em/en-dash to hyphen when dashToHyphen is true', () => {
    const html = '<p>range — here and en–dash</p>';
    const md: string = convert(html, 'HTML', { dashToHyphen: true });
    expect(md).toContain('range - here and en-dash');
  });

  it('converts h1 to pandoc underline when pandocHeadings is true', () => {
    const html = '<h1>Title</h1>';
    const md: string = convert(html, 'HTML', { pandocHeadings: true });
    expect(/Title\n=+/.test(md)).toBe(true);
  });

  it('strips document head and style blocks from pasted html', () => {
    const html =
      '<html><head><style>@page{size:8.5in;}</style><meta></head><body><h1>Title</h1><p>text</p></body></html>';
    const md: string = convert(html, 'HTML', { pandocHeadings: true });
    expect(md).toContain('Title');
    expect(md).toContain('text');
    expect(md).not.toContain('@page');
    expect(md).not.toContain('size');
  });

  it('does not touch normal text when no options are set', () => {
    const rawText = `# Something

asdasda asdas

# Another thing

cccc

## A subheading

dddd`;
    const md = convert(rawText, 'HTML', {});
    expect(md).toBe(rawText);
  });
});
