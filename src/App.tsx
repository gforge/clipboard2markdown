import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import PasteArea from './components/PasteArea';
import Output from './components/Output';
import Settings from './components/Settings';
import useStore from './store/useStore';

export default function App() {
  const output = useStore((s) => s.output);
  const appendOrInsertMarkdown = (
    md: string,
    outputRef?: React.RefObject<import('./components/Output').OutputHandle | null>,
  ) => {
    // Insert converted markdown into the output at the current caret position if ref provided
    const out = outputRef?.current;
    if (out && typeof out.insert === 'function') {
      out.insert(md);
    } else {
      // Fallback: append using the store
      useStore.getState().appendOutput(md);
    }
  };

  const outputRef = React.useRef<import('./components/Output').OutputHandle | null>(null);

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Typography className="appTitle" variant="h4" component="h1" gutterBottom>
        Clipboard → Markdown
      </Typography>

      <Box sx={{ my: 1 }}>
        <Settings />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PasteArea
          saveText={(md: string) => appendOrInsertMarkdown(md, outputRef)}
          activeWhenEmpty={output.trim() === ''}
        />
        <Output ref={outputRef} />
      </Box>
    </Container>
  );
}
