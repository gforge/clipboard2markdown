import { describe, it, expect } from 'vitest';
import { convertHtmlToMarkdown } from '../src/lib/converter';

describe('reference removal', () => {
  it('removes numeric superscripts when option enabled', () => {
    const html = '<p>This is a sentence<sup>22</sup>.</p>';
    const md = convertHtmlToMarkdown(html, { removeReferenceMarkers: true });
    expect(md).toContain('This is a sentence');
    expect(md).not.toContain('22');
  });

  it('removes bracketed numeric citations like [1, 2]', () => {
    const html = '<p>Sample text [1, 2] more text.</p>';
    const md = convertHtmlToMarkdown(html, { removeReferenceMarkers: true });
    expect(md).toContain('Sample text');
    expect(md).not.toContain('[1');
    expect(md).not.toContain('2]');
  });

  it('removes parenthetical numeric citations like (22)', () => {
    const html = '<p>See evidence (22) for details.</p>';
    const md = convertHtmlToMarkdown(html, { removeReferenceMarkers: true });
    expect(md).toContain('See evidence');
    expect(md).not.toContain('(22)');
  });

  it('strips control characters around citations', () => {
    // simulate pasted content with control characters surrounding parentheses
    const html = '<p>These models provide reliable... cohort \x07\x03(22)\x08.</p>';
    const mdNoStrip = convertHtmlToMarkdown(html, { removeReferenceMarkers: false });
    // Should not contain unwanted control characters (except \n, \r, \t)
    const hasBadControl = (s: string) =>
      Array.from(s).some((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return (code <= 31 && code !== 9 && code !== 10 && code !== 13) || code === 127;
      });
    expect(hasBadControl(mdNoStrip)).toBe(false);

    const mdStrip = convertHtmlToMarkdown(html, { removeReferenceMarkers: true });
    // With strip option, the (22) should also be removed and no control chars remain
    expect(mdStrip).not.toContain('(22)');
    expect(hasBadControl(mdStrip)).toBe(false);
  });
});
