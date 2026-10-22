import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ContentPasteOutlinedIcon from '@mui/icons-material/ContentPasteOutlined';
import Kbd from './Kbd';
import LogoMark from './LogoMark';

type Props = Readonly<{ onReadClipboard: () => Promise<boolean> }>;

export default function EmptyState({ onReadClipboard }: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  const read = async () => {
    setNotice(null);
    const ok = await onReadClipboard();
    if (!ok) setNotice('Nothing readable on the clipboard, or access was blocked. Paste instead.');
  };

  return (
    <Box
      component="section"
      aria-label="Paste target"
      sx={(theme) => ({
        minHeight: 600,
        border: `2px dashed ${theme.vars.palette.primary.light}`,
        borderRadius: '8px',
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2.5,
        px: 3,
        py: 6,
        textAlign: 'center',
      })}
    >
      <Box
        sx={(theme) => ({
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: '#e3f2fd',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.applyStyles('dark', { bgcolor: theme.vars.palette.primary.light }),
        })}
      >
        <LogoMark size={36} strokeWidth={1.75} />
      </Box>

      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          Paste anywhere on this page
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ fontSize: 15, lineHeight: 1.6, maxWidth: 440, mx: 'auto' }}
        >
          Copy text from a web page, Word, Google Docs or a PDF, then press <Kbd>Ctrl V</Kbd> or{' '}
          <Kbd>⌘ V</Kbd>.
        </Typography>
      </Box>

      <Button
        variant="outlined"
        size="large"
        startIcon={<ContentPasteOutlinedIcon />}
        onClick={() => void read()}
      >
        Read clipboard
      </Button>

      <Typography variant="caption" color={notice ? 'error' : 'text.secondary'} role="status">
        {notice ?? 'The result is copied back automatically — no scrolling to find the button.'}
      </Typography>
    </Box>
  );
}
