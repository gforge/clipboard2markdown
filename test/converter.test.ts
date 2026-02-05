import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';
import type { ConvertOptions } from '../src/lib/converter';
import TurndownService from 'turndown';

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

  it('normalizes em/en-dash to hyphen when normalizePunctuation is true', () => {
    const html = '<p>range — here and en–dash</p>';
    const md: string = convert(html, 'HTML', { normalizePunctuation: true });
    expect(md).toContain('range - here and en-dash');
  });

  it('strips code formatting when dropCode is true', () => {
    const html = '<p>Use <code>foo()</code> function</p><pre><code>const x = 1;</code></pre>';
    const md: string = convert(html, 'HTML', { dropCode: true });
    expect(md).toContain('Use foo() function');
    expect(md).toContain('const x = 1;');
    expect(md).not.toContain('`');
    expect(md).not.toContain('```');
  });

  it('strips italics when dropItalic is true', () => {
    const html = '<p>This is <em>emphasized</em> and <i>italics</i></p>';
    const md: string = convert(html, 'HTML', { dropItalic: true });
    expect(md).toContain('This is emphasized and italics');
    expect(md).not.toContain('*emphasized*');
    expect(md).not.toContain('_italics_');
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

  it('returns clean HTML when output=clean (strips style attributes)', () => {
    const html = '<p style="color: red">Hello <strong>World</strong></p>';
    const out = convert(html, 'HTML', { output: 'clean' });
    expect(out).toContain('<p>');
    expect(out).toContain('Hello');
    expect(out).not.toContain('style="');
  });

  it('when output=clean respects dropImages by removing images', () => {
    const html = '<p>Hi <img src="x.png" alt="x"> there</p>';
    const out = convert(html, 'HTML', { output: 'clean', dropImages: true });
    expect(out).toContain('Hi');
    expect(out).toContain('there');
    expect(out).not.toContain('<img');
  });

  it('converts headings to bold when headingsToBold is true (markdown)', () => {
    const html = '<h1>Title</h1><p>text</p>';
    const md = convert(html, 'HTML', { headingsToBold: true });
    expect(md).toContain('**Title**');
    expect(md).not.toContain('# Title');
    expect(md.indexOf('**Title**') < md.indexOf('text')).toBe(true);
  });

  it('converts headings to bold and outputs clean HTML when output=clean', () => {
    const html = '<h1>Title</h1><p>text</p>';
    const out = convert(html, 'HTML', { headingsToBold: true, output: 'clean' });
    expect(out.toLowerCase()).toContain('<p><strong>title</strong>');
    expect(out.toLowerCase()).toContain('<p>text');
  });

  it('preserves hard line breaks from <br/> as two-space + newline', () => {
    const html = '<h1>Demo</h1><p>ABC</p><p>asdasd<br />asda</p>';
    const md = convert(html, 'HTML', {});
    // Should be a hard line break represented by two spaces then newline
    expect(md).toContain('asdasd  \nasda');
  });

  it('shows how Turndown handles <br/> by default and with a custom rule', () => {
    const svcDefault = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const defaultOut = svcDefault.turndown('<p>asdasd<br/>asda</p>');

    const svcCustom = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    svcCustom.addRule('hardBreakTest', {
      filter: (node: { nodeName: string }) => node.nodeName === 'BR',
      replacement: () => '  \n',
    });
    const customOut = svcCustom.turndown('<p>asdasd<br/>asda</p>');

    // Default behaviour may or may not include two spaces; ensure our custom rule produces the expected hard break
    expect(customOut).toContain('asdasd  \nasda');
    // And if default doesn't already include hard break, show that adding the rule changes the result
    if (!defaultOut.includes('  \n')) {
      expect(defaultOut).not.toEqual(customOut);
    }
  });
});
