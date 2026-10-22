import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { marked } from 'marked';
import convertToMarkdown, { toCleanHtmlFromMarkdown } from '../lib/converter';
import { isMac } from '../lib/clipboard';
import useStore from '../store/useStore';
import { monoFont } from '../theme';
import Kbd from './Kbd';

type Props = Readonly<{ onCopy: () => Promise<boolean> }>;

type View = 'source' | 'preview';

const numberFormat = new Intl.NumberFormat();

const stats = (text: string) => {
  const trimmed = text.trim();
  return {
    lines: trimmed ? text.split('\n').length : 0,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
  };
};

function CopiedBadge() {
  return (
    <Box
      component="span"
      role="status"
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: '16px',
        fontSize: 13,
        fontWeight: 600,
        bgcolor: theme.vars.palette.success.light,
        color: theme.vars.palette.success.dark,
      })}
    >
      <CheckRoundedIcon sx={{ fontSize: 14 }} />
      Copied to clipboard
    </Box>
  );
}

export default function OutputPanel({ onCopy }: Props) {
  const output = useStore((s) => s.output);
  const options = useStore((s) => s.options);
  const copiedText = useStore((s) => s.copiedText);
  const format = options.output ?? 'markdown';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [view, setView] = useState<View>(format === 'clean' ? 'preview' : 'source');

  // Clean HTML opens rendered, Markdown opens as editable source.
  useEffect(() => {
    setView(format === 'clean' ? 'preview' : 'source');
  }, [format]);

  const counts = useMemo(() => stats(output), [output]);
  const previewHtml = useMemo(
    () =>
      view === 'preview' ? (format === 'clean' ? output : toCleanHtmlFromMarkdown(output)) : '',
    [view, format, output],
  );

  const commitEdit = (value: string) => {
    const store = useStore.getState();
    if (value.trim() === '') {
      store.clearPastes();
      return;
    }
    // Re-seed the raw input so option changes keep re-converting the edited text.
    store.setRawFromHtml(format === 'clean' ? value : (marked.parse(value) as string));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (!html.trim()) return; // plain text: native paste
    e.preventDefault();
    const el = e.currentTarget;
    const converted = convertToMarkdown(html, 'HTML', options);
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + converted + el.value.slice(end);
    useStore.getState().setOutputManual(next);
    const caret = start + converted.length;
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  const clear = () => {
    useStore.getState().clearPastes();
  };

  const formatLabel = format === 'clean' ? 'HTML' : 'Markdown';

  return (
    <Paper component="section" aria-label="Converted output" sx={{ overflow: 'clip' }}>
      <Box
        sx={{
          position: 'sticky',
          top: 'var(--header-h, 61px)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {copiedText === output && <CopiedBadge />}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
            {numberFormat.format(counts.lines)} lines · {numberFormat.format(counts.words)} words ·{' '}
            {numberFormat.format(counts.chars)} chars
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="text"
            color="inherit"
            sx={{ color: 'text.secondary', fontWeight: 500 }}
            onClick={clear}
          >
            Clear
          </Button>
          <Button
            variant="outlined"
            onClick={() => setView(view === 'source' ? 'preview' : 'source')}
            aria-pressed={view === 'preview'}
          >
            {view === 'source' ? 'Show preview' : 'Show source'}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<ContentCopyOutlinedIcon />}
            onClick={() => void onCopy()}
          >
            Copy {formatLabel}
            <Box component="span" sx={{ ml: 1, display: 'inline-flex' }}>
              <Kbd onDark>{isMac ? '⌘⇧C' : 'Ctrl⇧C'}</Kbd>
            </Box>
          </Button>
        </Box>
      </Box>

      {view === 'source' ? (
        <>
          <Box
            component="label"
            htmlFor="output-source"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
            }}
          >
            Converted {formatLabel}
          </Box>
          <Box
            component="textarea"
            id="output-source"
            ref={textareaRef}
            spellCheck={false}
            value={output}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              useStore.getState().setOutputManual(e.target.value)
            }
            onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => commitEdit(e.target.value)}
            onPaste={handlePaste}
            sx={(theme) => ({
              display: 'block',
              boxSizing: 'border-box',
              width: '100%',
              height: 560,
              m: 0,
              px: 3,
              py: 2.5,
              border: 0,
              resize: 'vertical',
              font: `400 13.5px/1.7 ${monoFont}`,
              color: theme.vars.palette.text.primary,
              bgcolor: theme.vars.palette.background.paper,
              outline: 'none',
            })}
          />
        </>
      ) : (
        <Box
          tabIndex={0}
          aria-label={`Rendered ${formatLabel} preview`}
          sx={(theme) => ({
            boxSizing: 'border-box',
            height: 560,
            overflow: 'auto',
            px: 3,
            py: 2.5,
            fontSize: 15,
            lineHeight: 1.6,
            '& > :first-of-type': { mt: 0 },
            '& h1, & h2, & h3, & h4': { lineHeight: 1.25, mt: 3, mb: 1 },
            '& h1': { fontSize: 24 },
            '& h2': { fontSize: 20 },
            '& h3': { fontSize: 17 },
            '& p, & ul, & ol, & pre, & blockquote, & table': { mt: 0, mb: 1.5 },
            '& pre': {
              p: 2,
              borderRadius: '8px',
              overflow: 'auto',
              bgcolor: theme.vars.palette.background.default,
            },
            '& code': { fontFamily: monoFont, fontSize: '0.9em' },
            '& blockquote': {
              m: 0,
              mb: 1.5,
              pl: 2,
              borderLeft: `3px solid ${theme.vars.palette.divider}`,
              color: theme.vars.palette.text.secondary,
            },
            '& table': { borderCollapse: 'collapse', display: 'block', overflow: 'auto' },
            '& th, & td': { border: `1px solid ${theme.vars.palette.divider}`, px: 1.5, py: 0.75 },
            '& img': { maxWidth: '100%' },
            '& a': { color: theme.vars.palette.primary.main },
          })}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          px: 2,
          py: 1.25,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Paste again anywhere on the page to replace (Ctrl+V / ⌘V)
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Output scrolls inside the box — the copy bar stays put
        </Typography>
      </Box>
    </Paper>
  );
}
