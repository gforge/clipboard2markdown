import React from 'react';
import { Box, Container, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import useStore from '../store/useStore';
import LogoMark from './LogoMark';

type OutputFormat = 'markdown' | 'clean';

export default function Header({ ref }: Readonly<{ ref?: React.Ref<HTMLElement> }>) {
  const format = useStore((s) => s.options.output ?? 'markdown');
  const setOptions = useStore((s) => s.setOptions);

  return (
    <Box
      component="header"
      ref={ref}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <LogoMark size={20} />
          </Box>
          <Box>
            <Typography variant="h1">Clipboard → Markdown</Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              Runs locally in your browser
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={format}
          aria-label="Output format"
          onChange={(_e, value: OutputFormat | null) => {
            if (value) setOptions({ output: value });
          }}
          sx={(theme) => ({
            p: 0.5,
            gap: 0.5,
            border: `1px solid ${theme.vars.palette.divider}`,
            borderRadius: '8px',
            bgcolor: 'background.default',
            '& .MuiToggleButtonGroup-grouped': {
              border: 0,
              borderRadius: '6px !important',
              m: 0,
              px: 2,
              py: 1,
              lineHeight: 1.2,
              fontSize: 14,
              fontWeight: 500,
              color: 'text.secondary',
              '&.Mui-selected': {
                bgcolor: 'background.paper',
                color: 'primary.main',
                fontWeight: 600,
                boxShadow: '0 1px 2px rgba(0,0,0,.12)',
              },
              '&.Mui-selected:hover': { bgcolor: 'background.paper' },
            },
          })}
        >
          <ToggleButton value="markdown">Markdown</ToggleButton>
          <ToggleButton value="clean">Clean HTML</ToggleButton>
        </ToggleButtonGroup>
      </Container>
    </Box>
  );
}
