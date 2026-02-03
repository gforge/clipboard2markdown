import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Paper, TextField, Button, Box, Typography } from '@mui/material';
import bg from '../assets/background.svg';

type Props = Readonly<{ value?: string }>;

export type OutputHandle = {
  insert: (text: string) => void;
  getValue: () => string;
};

const Output = forwardRef<OutputHandle, Props>(function Output({ value = '' }: Props, ref) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState<string>(value);
  const [focused, setFocused] = useState<boolean>(false);

  // Keep in sync if parent changes value
  React.useEffect(() => {
    setContent(value);
  }, [value]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev ? prev + '\n\n' + text : text));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const newValue = before + text + after;
    setContent(newValue);

    // set focus and move caret after inserted text
    setTimeout(() => {
      el.focus();
      const pos = before.length + text.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  useImperativeHandle(ref, () => ({
    insert: insertAtCursor,
    getValue: () => content,
  }));

  const copy = async () => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(content);
        const el = textareaRef.current as HTMLTextAreaElement | null;
        el?.focus();
        el?.select();
      } catch (err) {
        // Log error and continue gracefully
        console.error('Copy failed', err);
      }
    }
  };

  const showHelp = !focused && content.trim() === '';

  return (
    <Paper className="docPaper" sx={{ flex: 1, p: 2, position: 'relative' }}>
      {/* When empty show the original instruction UI, hide the textarea until first content */}
      {showHelp ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontStyle: 'italic' }}>
            Instructions
          </Typography>
          <ol>
            <li>
              <Typography component="span">
                Find the text to convert to Markdown (e.g., in another browser tab)
              </Typography>
            </li>
            <li>
              <Typography component="span">
                Copy it to the clipboard (<kbd>Ctrl+C</kbd>, or <kbd>⌘+C</kbd> on Mac)
              </Typography>
            </li>
            <li>
              <Typography component="span">
                Paste it into this page (<kbd>Ctrl+V</kbd>, or <kbd>⌘+V</kbd> on Mac)
              </Typography>
            </li>
            <li>
              <Typography component="span">The converted Markdown will appear!</Typography>
            </li>
          </ol>
          <Typography variant="body2" sx={{ mt: 2 }}>
            The conversion is carried out by a local HTML → Markdown converter running in your
            browser.
          </Typography>
        </Box>
      ) : (
        <>
          <TextField
            inputRef={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline
            minRows={12}
            fullWidth
            variant="outlined"
          />
          <Button sx={{ mt: 1 }} variant="contained" onClick={copy}>
            Copy
          </Button>
        </>
      )}
    </Paper>
  );
});

export default Output;
