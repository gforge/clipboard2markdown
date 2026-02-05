import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Paper, TextField, Button, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useStore from '../store/useStore';

type Props = Readonly<{ onClear?: () => void }>;

export type OutputHandle = {
  insert: (text: string) => void;
  getValue: () => string;
  clear: () => void;
};

const Output = forwardRef<OutputHandle, Props>(function Output({ onClear }: Props, ref) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cleanBoxRef = useRef<HTMLDivElement | null>(null);
  const output = useStore((s) => s.output);
  const setOutput = useStore((s) => s.setOutput);
  const [content, setContent] = useState<string>(output);
  const [focused, setFocused] = useState<boolean>(false);
  const outputMode = useStore((s) => s.options.output ?? 'markdown');

  // Keep in sync if store changes value
  React.useEffect(() => {
    setContent(output);
  }, [output]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      const newVal = content ? content + '\n\n' + text : text;
      setContent(newVal);
      setOutput(newVal);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const newValue = before + text + after;
    setContent(newValue);
    setOutput(newValue);

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
    clear: () => {
      setContent('');
      setOutput('');
      // Also clear the saved raw inputs so conversion doesn't revert
      useStore.getState().clearPastes();

      // Blur any focused element and ensure instruction UI shows
      const el = textareaRef.current as HTMLTextAreaElement | null;
      if (el) {
        el.blur();
      } else {
        cleanBoxRef.current?.blur?.();
      }
      setFocused(false);
      onClear?.();
    },
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

  const clearContent = () => {
    setContent('');
    setOutput('');
    // Also clear saved raw inputs to prevent reversion
    useStore.getState().clearPastes();

    // Blur any focused element so the instruction UI reappears
    const el = textareaRef.current as HTMLTextAreaElement | null;
    if (el) {
      el.blur();
    } else {
      cleanBoxRef.current?.blur?.();
    }
    setFocused(false);
    onClear?.();
  }; 

  const showHelp = !focused && content.trim() === '';

  // Use images from the `public/` folder so bundling doesn't inline raw SVG markup.
  // Add `public/images/background-light.svg` and `public/images/background-dark.svg` and they will be
  // served at `/images/background-light.svg` and `/images/background-dark.svg` respectively.
  const theme = useTheme();
  const mode = (theme?.palette?.mode as 'light' | 'dark') ?? 'light';
  // Respect Vite's base (set from package.json 'homepage' or VITE_BASE) so paths work in dev & production
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  const bgUrl = `${base}images/background-${mode}.svg`;
  const bgImage = `url(${bgUrl})`;

  return (
    <Paper
      className="docPaper"
      sx={{
        flex: 1,
        p: 2,
        position: 'relative',
        backgroundImage: bgImage,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right calc(100% - 10px)',
        backgroundSize: '220px',
      }}
    >
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
          {outputMode === 'clean' ? (
            <Box
              ref={cleanBoxRef}
              sx={{
                border: '1px solid rgba(0,0,0,0.23)',
                borderRadius: 1,
                p: 2,
                minHeight: '12em',
                overflow: 'auto',
                '&:focus': {
                  outline: 'none',
                  boxShadow: (theme) => `0 0 0 2px ${theme.palette.action.focus}`,
                },
              }}
              tabIndex={0}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <TextField
              inputRef={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                // Manual user edits should clear raw inputs to avoid later reversion
                useStore.getState().setOutputManual(e.target.value);
              }}
              onFocus={() => setFocused(true)}
              onBlur={async () => {
                setFocused(false);
                // On blur, persist user edits: if empty, clear store; otherwise convert markdown to HTML and save as new HTML paste
                const val = content;
                if (val.trim() === '') {
                  useStore.getState().clearPastes();
                } else {
                  // Convert markdown to HTML and replace raw inputs
                  const { marked } = await import('marked');
                  const html = marked.parse(val) as string;
                  useStore.getState().setRawFromHtml(html);
                }
              }}
              multiline
              minRows={12}
              fullWidth
              variant="outlined"
            />
          )}

          <Button sx={{ mt: 1 }} variant="contained" onClick={copy}>
            Copy
          </Button>

          {outputMode === 'clean' && (
            <Button
              sx={{ mt: 1, ml: 1 }}
              variant="outlined"
              color="secondary"
              onClick={clearContent}
            >
              Clear
            </Button>
          )}
        </>
      )}
    </Paper>
  );
});

export default Output;
