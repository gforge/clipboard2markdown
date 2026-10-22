import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConvertOptions } from '../lib/converter';
import convertToMarkdown from '../lib/converter';

export type RawEntryType = 'HTML' | 'PDF' | 'TEXT';

type RawEntry = {
  id: string;
  type: RawEntryType;
  text: string;
};

export type Prefs = {
  /** Copy the converted result to the clipboard right after a paste. */
  autoCopy: boolean;
};

type Store = {
  options: ConvertOptions;
  prefs: Prefs;
  rawInputs: RawEntry[];
  output: string;
  /** The text most recently written to the clipboard, or null when the clipboard is stale. */
  copiedText: string | null;
  // actions
  setOptions: (patch: Partial<ConvertOptions>) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  addPaste: (type: RawEntryType, text: string) => void;
  replacePaste: (type: RawEntryType, text: string) => void;
  clearPastes: () => void;
  setOutput: (out: string) => void;
  appendOutput: (out: string) => void;
  markCopied: (text: string) => void;
  // user editing helpers
  setOutputManual: (out: string) => void;
  setRawFromHtml: (html: string) => void;
};

const looksPdfLike = (text: string) => /[\u00AD\u00A0]/.test(text);

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const computeOutputFromRaw = (rawInputs: RawEntry[], options: ConvertOptions) => {
  if (!rawInputs || rawInputs.length === 0) return '';
  const parts: string[] = rawInputs.map((e) => {
    if (e.type === 'TEXT') {
      if (options.dePdf === true || looksPdfLike(e.text)) {
        return convertToMarkdown(e.text, 'PDF', options);
      }
      return e.text;
    }
    return convertToMarkdown(e.text, e.type === 'PDF' ? 'PDF' : 'HTML', options);
  });
  return parts.join('\n\n');
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      options: {
        normalizePunctuation: true,
        dropImages: true,
        dropCode: false,
        dropItalic: false,
        dePdf: false,
        output: 'markdown',
      },
      prefs: { autoCopy: true },
      rawInputs: [],
      output: '',
      copiedText: null,
      setOptions: (patch) => {
        set((state) => {
          const options = { ...state.options, ...patch };
          return { options, output: computeOutputFromRaw(state.rawInputs, options) };
        });
      },
      setPrefs: (patch) => set((state) => ({ prefs: { ...state.prefs, ...patch } })),
      addPaste: (type, text) => {
        set((state) => {
          const rawInputs = state.rawInputs.concat({ id: newId(), type, text });
          return { rawInputs, output: computeOutputFromRaw(rawInputs, state.options) };
        });
      },
      replacePaste: (type, text) => {
        set((state) => {
          const rawInputs = [{ id: newId(), type, text }];
          return { rawInputs, output: computeOutputFromRaw(rawInputs, state.options) };
        });
      },
      clearPastes: () => set({ rawInputs: [], output: '', copiedText: null }),
      setOutput: (out) => (out === '' ? set({ output: '', rawInputs: [] }) : set({ output: out })),
      // Set output manually (user editing) and clear raw inputs to avoid later reversion
      setOutputManual: (out) => set({ output: out, rawInputs: [] }),
      appendOutput: (out) => set((s) => ({ output: s.output ? s.output + '\n\n' + out : out })),
      markCopied: (text) => set({ copiedText: text }),
      // Replace current raw inputs with a single HTML paste (used when user edits markdown)
      setRawFromHtml: (html) => {
        set((state) => {
          const rawInputs = [{ id: newId(), type: 'HTML' as RawEntryType, text: html }];
          return { rawInputs, output: computeOutputFromRaw(rawInputs, state.options) };
        });
      },
    }),
    {
      name: 'clipboard2markdown:options',
      partialize: (state) => ({ options: state.options, prefs: state.prefs }),
    },
  ),
);

export default useStore;
