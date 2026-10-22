import { useCallback, useEffect } from 'react';
import useStore from '../store/useStore';
import {
  copyText,
  payloadFromDataTransfer,
  readClipboardPayload,
  type ClipboardPayload,
} from '../lib/clipboard';

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLInputElement ||
    el.isContentEditable === true
  );
};

/**
 * Captures pastes anywhere on the page (outside text fields), converts them and
 * replaces the current output. Optionally copies the result straight back to
 * the clipboard. Also wires the Ctrl/⌘+Shift+C copy shortcut.
 */
export default function usePasteCapture() {
  const ingest = useCallback(async (payload: ClipboardPayload): Promise<boolean> => {
    const { html, text } = payload;
    const store = useStore.getState();
    if (html && html.trim()) store.replacePaste('HTML', html);
    else if (text && text.trim()) store.replacePaste('TEXT', text);
    else return false;

    const { output, prefs } = useStore.getState();
    if (prefs.autoCopy && output.trim()) {
      const ok = await copyText(output);
      if (ok) useStore.getState().markCopied(output);
    }
    return true;
  }, []);

  const copyOutput = useCallback(async (): Promise<boolean> => {
    const { output, markCopied } = useStore.getState();
    if (!output.trim()) return false;
    const ok = await copyText(output);
    if (ok) markCopied(output);
    return ok;
  }, []);

  const readClipboard = useCallback(
    async (): Promise<boolean> => ingest(await readClipboardPayload()),
    [ingest],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Text fields keep their native paste; the output editor handles its own.
      if (isEditable(e.target)) return;
      const payload = payloadFromDataTransfer(e.clipboardData);
      if (!payload.html && !payload.text) return;
      e.preventDefault();
      void ingest(payload);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (!useStore.getState().output.trim()) return;
        e.preventDefault();
        void copyOutput();
      }
    };
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ingest, copyOutput]);

  return { ingest, copyOutput, readClipboard };
}
