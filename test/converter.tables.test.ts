import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';

const convert = (html: string) => convertToMarkdown(html, 'HTML', {});

describe('tables', () => {
  it('converts an Outlook-style table (td cells, bold first row) to a pipe table', () => {
    const html = `
      <table>
        <tr><td></td><td><b>Utfall</b></td><td><b>Träning</b></td><td><b>Validering</b></td><td><b>Test</b></td></tr>
        <tr><td></td><td><p>Apgar 5 &lt; 7</p></td><td><p>536 / 46 088 (1,16 %)</p></td><td><p>104 / 7 927 (1,31 %)</p></td><td><p>213 / 16 467 (1,29 %)</p></td></tr>
        <tr><td></td><td><p>Apgar 10 &lt; 7</p></td><td><p>151 / 46 076 (0,33 %)</p></td><td><p>27 / 7 926 (0,34 %)</p></td><td><p>55 / 16 461 (0,33 %)</p></td></tr>
      </table>`;
    expect(convert(html)).toBe(
      [
        '|  | Utfall | Träning | Validering | Test |',
        '| --- | --- | --- | --- | --- |',
        '|  | Apgar 5 < 7 | 536 / 46 088 (1,16 %) | 104 / 7 927 (1,31 %) | 213 / 16 467 (1,29 %) |',
        '|  | Apgar 10 < 7 | 151 / 46 076 (0,33 %) | 27 / 7 926 (0,34 %) | 55 / 16 461 (0,33 %) |',
      ].join('\n'),
    );
  });

  it('handles thead/tbody with th cells', () => {
    const html =
      '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></tbody></table>';
    expect(convert(html)).toBe('| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |');
  });

  it('pads ragged rows and expands colspan', () => {
    const html =
      '<table><tr><th>A</th><th>B</th><th>C</th></tr><tr><td colspan="2">wide</td><td>c</td></tr><tr><td>only</td></tr></table>';
    expect(convert(html)).toBe(
      '| A | B | C |\n| --- | --- | --- |\n| wide |  | c |\n| only |  |  |',
    );
  });

  it('escapes pipes and folds multi-paragraph cells with <br>', () => {
    const html =
      '<table><tr><th>K</th><th>V</th></tr><tr><td>a | b</td><td><p>line one</p><p>line two</p></td></tr></table>';
    expect(convert(html)).toBe('| K | V |\n| --- | --- |\n| a \\| b | line one<br>line two |');
  });

  it('puts the caption before the table and keeps surrounding paragraphs separate', () => {
    const html =
      '<p>Before</p><table><caption>Cap</caption><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><p>After</p>';
    expect(convert(html)).toBe('Before\n\nCap\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nAfter');
  });

  it('unwraps single-column layout tables into plain paragraphs', () => {
    const html = '<table><tr><td><p>Hello</p></td></tr><tr><td><p>World</p></td></tr></table>';
    expect(convert(html)).toBe('Hello\n\nWorld');
  });

  it('unwraps an outer layout table but converts the inner data table', () => {
    const html =
      '<table><tr><td><p>Intro</p><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table></td></tr></table>';
    expect(convert(html)).toBe('Intro\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
  });

  it('renders a real <table> when output=clean', () => {
    const html = '<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>';
    const out = convert(html);
    const clean = convertToMarkdown(html, 'HTML', { output: 'clean' });
    expect(out).toContain('| --- |');
    expect(clean).toMatch(/<table>[\s\S]*<th>A<\/th>[\s\S]*<td>2<\/td>[\s\S]*<\/table>/);
  });

  it('keeps empty-cell padding and strips &nbsp; cells with normalizePunctuation on', () => {
    const html =
      '<table><tr><td><b>&nbsp;</b></td><td><b>Utfall</b></td></tr><tr><td>&nbsp;</td><td>536 / 46&nbsp;088</td></tr></table>';
    expect(convertToMarkdown(html, 'HTML', { normalizePunctuation: true })).toBe(
      '|  | Utfall |\n| --- | --- |\n|  | 536 / 46 088 |',
    );
  });

  describe('alignTables', () => {
    it('pads columns to the widest cell', () => {
      const html =
        '<table><tr><th>Utfall</th><th>Test</th></tr><tr><td>Apgar 5 &lt; 7</td><td>213 / 16 467 (1,29 %)</td></tr><tr><td>Navelsträngs-pH &lt; 7,00</td><td>93</td></tr></table>';
      expect(
        convertToMarkdown(html, 'HTML', { alignTables: true, normalizePunctuation: true }),
      ).toBe(
        [
          '| Utfall                 | Test                  |',
          '| ---------------------- | --------------------- |',
          '| Apgar 5 < 7            | 213 / 16 467 (1,29 %) |',
          '| Navelsträngs-pH < 7,00 | 93                    |',
        ].join('\n'),
      );
    });

    it('aligns pasted Markdown tables too and leaves other lines alone', () => {
      const md = 'Intro\n\n| a | bbb |\n| --- | ---: |\n| cc \\| x | 1 |\n\nAfter | not a table';
      expect(convertToMarkdown(md, 'HTML', { alignTables: true })).toBe(
        'Intro\n\n| a       | bbb |\n| ------- | --: |\n| cc \\| x |   1 |\n\nAfter | not a table',
      );
    });

    it('leaves tables compact when alignTables is off', () => {
      const html = '<table><tr><th>A</th><th>Bbb</th></tr><tr><td>1</td><td>2</td></tr></table>';
      expect(convertToMarkdown(html, 'HTML', { alignTables: false })).toBe(
        '| A | Bbb |\n| --- | --- |\n| 1 | 2 |',
      );
    });
  });
});
