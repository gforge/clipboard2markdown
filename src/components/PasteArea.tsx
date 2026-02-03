import React, { useRef, useEffect } from 'react';
import { Paper } from '@mui/material';
import convertHtmlToMarkdown from '../lib/converter';
import type { ConvertOptions } from '../lib/converter';

type Props = Readonly<{
  onConvert: (markdown: string) => void;
  options?: ConvertOptions;
  activeWhenEmpty?: boolean;
}>;

export default function PasteArea({ onConvert, options = {}, activeWhenEmpty = true }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const focusPaste = () => ref.current?.focus();

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const htmlFromClipboard = e.clipboardData?.getData('text/html');
    const textFromClipboard = e.clipboardData?.getData('text/plain');

    if (htmlFromClipboard) {
      const md = convertHtmlToMarkdown(htmlFromClipboard, options);
      onConvert(md);
      return;
    }

    // Fallback: use plain text
    setTimeout(() => {
      const text = ref.current?.value ?? textFromClipboard ?? '';
      const md = convertHtmlToMarkdown(`<p>${escapeHtml(text)}</p>`, options);
      onConvert(md);
    }, 0);
  };

  const escapeHtml = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

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
