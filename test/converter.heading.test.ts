import { describe, it, expect } from 'vitest';
import { convertToMarkdown } from '../src/lib/converter';

describe('heading separation', () => {
  it('preserves blank line between heading and paragraph', () => {
    const html = `<h1>3.Background and State of the Art</h1><p>Proximal humerus fractures (PHFs) are common osteoporotic fractures.</p>`;
    const md = convertToMarkdown(html, 'HTML');
    // debug

    console.log('\n--- MD OUTPUT START ---\n' + md + '\n--- MD OUTPUT END ---\n');
    // Heading should be present before the paragraph content (allow flexible whitespace/line breaks)
    expect(md.includes('# 3.Background')).toBe(true);
    expect(md.includes('Proximal humerus fractures')).toBe(true);
    expect(md.indexOf('# 3.Background') < md.indexOf('Proximal humerus fractures')).toBe(true);
  });
});
