/** Writes text to the system clipboard. Returns false when the browser refuses. */
export const copyText = async (text: string): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export type ClipboardPayload = { html?: string; text?: string };

/** Pulls html and plain text out of a DataTransfer (paste or drop event). */
export const payloadFromDataTransfer = (dt: DataTransfer | null | undefined): ClipboardPayload => {
  if (!dt) return {};
  const html = dt.getData('text/html') || undefined;
  const text = dt.getData('text/plain') || undefined;
  return { html, text };
};

/** Reads the clipboard on demand (the "Read clipboard" button). Prefers html over plain text. */
export const readClipboardPayload = async (): Promise<ClipboardPayload> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return {};
  try {
    if (navigator.clipboard.read) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('text/html')) {
          return { html: await (await item.getType('text/html')).text() };
        }
        if (item.types.includes('text/plain')) {
          return { text: await (await item.getType('text/plain')).text() };
        }
      }
    }
  } catch {
    // fall through to readText (Firefox, or permission for rich read denied)
  }
  try {
    const text = await navigator.clipboard.readText();
    return text ? { text } : {};
  } catch {
    return {};
  }
};

export const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
