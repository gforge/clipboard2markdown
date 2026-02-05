import { describe, it, expect, beforeEach } from 'vitest';
import useStore from '../src/store/useStore';

describe('zustand store', () => {
  beforeEach(() => {
    // reset store state to a clean baseline before each test
    useStore.setState({
      rawInputs: [],
      output: '',
      options: { normalizePunctuation: true, dropImages: true, dePdf: false, output: 'markdown' },
    });
  });

  it('adds a paste and produces converted markdown output', () => {
    useStore.getState().addPaste('HTML', '<p>Hi <strong>there</strong></p>');
    const out = useStore.getState().output;
    expect(out).toContain('Hi');
    expect(out).toContain('**there**');
  });

  it('recomputes output when options change', () => {
    useStore.getState().addPaste('HTML', '<p>range — en–dash</p>');
    // disable normalization
    useStore.getState().setOptions({ normalizePunctuation: false });
    const out1 = useStore.getState().output;
    expect(out1).toContain('—');

    // enable normalization
    useStore.getState().setOptions({ normalizePunctuation: true });
    const out2 = useStore.getState().output;
    expect(out2).toContain(' - ');
  });

  it('clears raw inputs when output is cleared', () => {
    useStore.getState().addPaste('HTML', '<p>Keep me</p>');
    expect(useStore.getState().rawInputs.length).toBe(1);

    // Simulate clearing the UI
    useStore.getState().setOutput('');
    expect(useStore.getState().output).toBe('');
    expect(useStore.getState().rawInputs.length).toBe(0);
  });

  it('replaces raw input with HTML converted from edited markdown on blur', async () => {
    // Simulate the user typing markdown into the output area
    const md = '# A heading\n\nasdasd';
    useStore.getState().setOutputManual(md);

    // Simulate blur which converts the markdown to HTML and stores it
    const { marked } = await import('marked');
    const html = await marked.parse(md as string);
    useStore.getState().setRawFromHtml((await html) as string);

    const raws = useStore.getState().rawInputs;
    expect(raws.length).toBe(1);
    expect(raws[0].type).toBe('HTML');
    expect(raws[0].text).toContain('<h1');
    expect(raws[0].text).toContain('<p>asdasd');

    // And the output should reflect the converted markdown
    const out = useStore.getState().output;
    expect(out).toContain('A heading');
    expect(out).toContain('asdasd');
  });
});
