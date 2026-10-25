import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';

const convert = (html: string) => convertToMarkdown(html, 'HTML', {});

describe('lists stay tight', () => {
  it('does not put blank lines between <li><p> items (Word/Outlook style)', () => {
    const html =
      '<ul><li><p>d1dcol01.ki.se</p></li><li><p>d1dcol02.ki.se</p></li><li><p>d1nnxcompute01.user.ki.se</p></li></ul>';
    expect(convert(html)).toBe('* d1dcol01.ki.se\n* d1dcol02.ki.se\n* d1nnxcompute01.user.ki.se');
  });

  it('keeps numbered lists tight and numbered', () => {
    const html = '<ol><li><p>Vilken kryptering</p></li><li><p>Om krypteringen</p></li></ol>';
    expect(convert(html)).toBe('1. Vilken kryptering\n2. Om krypteringen');
  });

  it('honours the start attribute', () => {
    expect(convert('<ol start="4"><li>four</li><li>five</li></ol>')).toBe('4. four\n5. five');
  });

  it('indents nested lists without a blank line before them', () => {
    const html =
      '<ul><li><p>a</p><ul><li><p>b</p></li><li><p>c</p></li></ul></li><li><p>d</p></li></ul>';
    expect(convert(html)).toBe('* a\n  * b\n  * c\n* d');
  });

  it('keeps a blank line between real paragraphs inside one item', () => {
    const html = '<ul><li><p>first</p><p>second</p></li><li><p>other</p></li></ul>';
    expect(convert(html)).toBe('* first\n\n  second\n* other');
  });

  it('merges consecutive <ul> blocks into one list', () => {
    const html = '<ul><li><p>a</p></li></ul><ul><li><p>b</p></li></ul>';
    expect(convert(html)).toBe('* a\n* b');
  });

  it('merges a continued <ol start> but leaves a fresh <ol> separate', () => {
    expect(convert('<ol><li>a</li></ol><ol start="2"><li>b</li></ol>')).toBe('1. a\n2. b');
    expect(convert('<ol><li>a</li></ol><ol><li>b</li></ol>')).toBe('1. a\n\n1. b');
  });

  it('keeps a paragraph between lists separate', () => {
    const html = '<p>Intro:</p><ul><li>a</li><li>b</li></ul><p>Outro</p>';
    expect(convert(html)).toBe('Intro:\n\n* a\n* b\n\nOutro');
  });

  it('keeps nested-list indentation with the default normalizePunctuation option', () => {
    const html =
      '<ul><li>Punkt två<ol><li>sub 1</li><li>sub 2</li></ol></li><li>Punkt tre</li></ul>';
    expect(convertToMarkdown(html, 'HTML', { normalizePunctuation: true })).toBe(
      '* Punkt två\n  1. sub 1\n  2. sub 2\n* Punkt tre',
    );
  });

  it('keeps list markers when dropItalic is on', () => {
    const html =
      '<p>To do:</p><ul><li>KI-affiliering</li><li>Lokal <em>handledare</em></li><li>Ansöka</li><li>Mål</li></ul>';
    expect(convertToMarkdown(html, 'HTML', { dropItalic: true, normalizePunctuation: true })).toBe(
      'To do:\n\n* KI-affiliering\n* Lokal handledare\n* Ansöka\n* Mål',
    );
  });

  it('strips italics from pasted Markdown without touching list markers or snake_case', () => {
    const md = '* one *emph* here\n* two _also_ my_var_name\n* three';
    expect(convertToMarkdown(md, 'HTML', { dropItalic: true })).toBe(
      '* one emph here\n* two also my_var_name\n* three',
    );
  });
});
