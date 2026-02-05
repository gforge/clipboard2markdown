import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConvertOptions } from '../lib/converter';
import convertToMarkdown from '../lib/converter';

type RawEntryType = 'HTML' | 'PDF' | 'TEXT';

type RawEntry = {
  id: string;
  type: RawEntryType;
  text: string;
};

type Store = {
  options: ConvertOptions;
  rawInputs: RawEntry[];
  output: string;
  // actions
  setOptions: (patch: Partial<ConvertOptions>) => void;
  addPaste: (type: RawEntryType, text: string) => void;
  clearPastes: () => void;
  setOutput: (out: string) => void;
  appendOutput: (out: string) => void;
  // user editing helpers
  setOutputManual: (out: string) => void;
  setRawFromHtml: (html: string) => void;
};

const looksPdfLike = (text: string) => /[\u00AD\u00A0]/.test(text);

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
      rawInputs: [],
      output: '',
      setOptions: (patch: Partial<ConvertOptions>) => {
        set((state: Store) => {
          const newOpts = { ...state.options, ...patch };
          const newOutput = computeOutputFromRaw(state.rawInputs, newOpts);
          return { options: newOpts, output: newOutput } as Partial<Store> as Store;
        });
      },
      addPaste: (type: RawEntryType, text: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((state: Store) => {
          const rawInputs = state.rawInputs.concat({ id, type, text });
          const output = computeOutputFromRaw(rawInputs, state.options);
          return { rawInputs, output } as Partial<Store> as Store;
        });
      },
      clearPastes: () => set({ rawInputs: [], output: '' }),
      setOutput: (out: string) =>
        set(() => {
          if (out === '') {
            return { output: out, rawInputs: [] } as Partial<Store> as Store;
          }
          return { output: out } as Partial<Store> as Store;
        }),
      // Set output manually (user editing) and clear raw inputs to avoid later reversion
      setOutputManual: (out: string) =>
        set(() => ({ output: out, rawInputs: [] }) as Partial<Store> as Store),
      appendOutput: (out: string) =>
        set((s: Store) => ({ output: s.output ? s.output + '\n\n' + out : out })),
      // Replace current raw inputs with a single HTML paste (used when user edits markdown)
      setRawFromHtml: (html: string) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((state: Store) => {
          const rawInputs = [{ id, type: 'HTML' as RawEntryType, text: html }];
          const output = computeOutputFromRaw(rawInputs, state.options);
          return { rawInputs, output } as Partial<Store> as Store;
        });
      },
    }),
    {
      name: 'clipboard2markdown:options',
      partialize: (state: Store) => ({ options: state.options }),
    },
  ),
);

export default useStore;
