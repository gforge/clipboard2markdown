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
});
