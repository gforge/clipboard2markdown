import React, { useRef, useEffect } from 'react';
import { Paper } from '@mui/material';
import convertToMarkdown from '../lib/converter';
import useStore from '../store/useStore';

type Props = Readonly<{
  saveText: (text: string) => void;
  activeWhenEmpty?: boolean;
}>;

const looksPdfLike = (text: string): boolean => {
  // Check for common PDF artifacts: soft hyphens, non-breaking spaces, etc.
  return /[\u00AD\u00A0]/.test(text);
};

export default function PasteArea({ saveText, activeWhenEmpty = true }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const options = useStore((s) => s.options);
  const addPaste = useStore((s) => s.addPaste);

  const focusPaste = () => ref.current?.focus();

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const htmlFromClipboard = e.clipboardData?.getData('text/html');
    const textFromClipboard = e.clipboardData?.getData('text/plain');

    const processNonHtmlTextAndConvert = (text?: string): boolean => {
      if (!text) return false;

      if (text.trim() === '') return false;

      if (options.dePdf === true || looksPdfLike(text)) {
        const md = convertToMarkdown(text, 'PDF', options);
        // persist raw input for re-conversion on settings change
        addPaste('PDF', text);
        saveText(md);
        return true;
      }

      // Keep as is
      addPaste('TEXT', text);
      saveText(text);
      return true;
    };

    if (htmlFromClipboard) {
      const md = convertToMarkdown(htmlFromClipboard, 'HTML', options);
      addPaste('HTML', htmlFromClipboard);
      saveText(md);
      return;
    }

    if (textFromClipboard) {
      if (processNonHtmlTextAndConvert(textFromClipboard)) return;
    }

    // Try to extract string data from DataTransfer items (covers some PDF viewers / RTF)
    const items = e.clipboardData?.items;
    if (items && items.length) {
      for (const it of Array.from(items)) {
        if (it.kind === 'string' && it.type.startsWith('text/')) {
          const text = await new Promise<string | null>((resolve) => {
            it.getAsString((s: string | null) => resolve(s ?? null));
          });
          if (text) {
            if (processNonHtmlTextAndConvert(text)) return;
          }
        }
      }
    }

    // As a last resort, try navigator.clipboard.readText() which may succeed in capturing PDF text content
    await navigator.clipboard
      .readText()
      .then((txt) => {
        if (txt) {
          processNonHtmlTextAndConvert(txt);
        }
      })
      .catch(() => {
        /* ignore - permission may not be granted */
      });

    // Final fallback: use the hidden textarea's value (older browsers)
    setTimeout(() => {
      const text = ref.current?.value ?? '';
      processNonHtmlTextAndConvert(text);
    }, 0);
  };

  // Listen for global paste and focus hidden paste target when active
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'v' && activeWhenEmpty) {
        focusPaste();
      }
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [activeWhenEmpty]);

  // Hidden textarea receives paste events; keeps UI focused on Output only
  return (
    <Paper sx={{ position: 'absolute', left: -99999, width: 1, height: 1, overflow: 'hidden' }}>
      <textarea
        ref={ref}
        aria-hidden
        tabIndex={-1}
        onPaste={handlePaste}
        style={{ position: 'absolute', left: -99999, top: -99999, width: 1, height: 1, opacity: 0 }}
      />
    </Paper>
  );
}
