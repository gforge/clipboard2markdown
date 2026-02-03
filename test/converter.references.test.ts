import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';

describe('reference handling and sanitization', () => {
  it('preserves numeric superscripts and converts to caret notation', () => {
    const html = '<p>This is a sentence<sup>22</sup>.</p>';
    const md = convertToMarkdown(html, 'HTML');
    expect(md).toContain('This is a sentence');
    expect(md).toContain('^22^');
  });

  it('preserves bracketed numeric citations like [1, 2]', () => {
    const html = '<p>Sample text [1, 2] more text.</p>';
    const md = convertToMarkdown(html, 'HTML');
    // Turndown may escape brackets, ensure the citation text remains
    expect(md).toContain('Sample text');
    expect(md).toMatch(/\[?1,\s*2\]?/);
  });

  it('preserves parenthetical numeric citations like (22)', () => {
    const html = '<p>See evidence (22) for details.</p>';
    const md = convertToMarkdown(html, 'HTML');
    expect(md).toContain('(22)');
  });

  it('strips control characters and preserves citations', () => {
    // simulate pasted content with control characters surrounding parentheses
    const html = '<p>These models provide reliable... cohort \x07\x03(22)\x08.</p>';
    const md = convertToMarkdown(html, 'HTML');
    // Should not contain unwanted control characters (except \n, \r, \t)
    const hasBadControl = (s: string) =>
      Array.from(s).some((ch) => {
        const code = ch.codePointAt(0) ?? 0;
        return (code <= 31 && code !== 9 && code !== 10 && code !== 13) || code === 127;
      });
    expect(hasBadControl(md)).toBe(false);
    expect(md).toContain('(22)');
  });

  it('handles non-breaking spaces around citations', () => {
    const html = '<p>Sample\u00A0text(1).</p>';
    const md = convertToMarkdown(html, 'HTML');
    expect(md).not.toContain('\u00A0');
    expect(md).toContain('Sample text(1)');
  });

  it('keeps citations in-place and does not leave stray spaces', () => {
    const html = '<p>Proximal humerus fractures (1), with incidence increasing.</p>';
    const md = convertToMarkdown(html, 'HTML');
    expect(md).toContain('(1), with incidence increasing');
    expect(md).not.toContain(' ,');
  });
});
