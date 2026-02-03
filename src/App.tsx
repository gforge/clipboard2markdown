import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import PasteArea from './components/PasteArea';
import Output from './components/Output';
import Settings from './components/Settings';
import type { ConvertOptions } from './lib/converter';

export default function App() {
  const [markdown, setMarkdown] = useState<string>('');
  const [options, setOptions] = useState<ConvertOptions>({
    dashToHyphen: true,
    dropImages: true,
    dePdf: false,
    output: 'markdown',
  });
  const outputRef = React.useRef<import('./components/Output').OutputHandle | null>(null);

  const appendOrInsertMarkdown = (md: string) => {
    // Insert converted markdown into the output at the current caret position
    const out = outputRef.current;
    if (out && typeof out.insert === 'function') {
      out.insert(md);
    } else {
      // Fallback: append
      setMarkdown((prev) => (prev ? prev + '\n\n' + md : md));
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Typography className="appTitle" variant="h4" component="h1" gutterBottom>
        Clipboard → Markdown
      </Typography>

      <Box sx={{ my: 1 }}>
        <Settings options={options} onChange={setOptions} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PasteArea
          saveText={appendOrInsertMarkdown}
          options={options}
          activeWhenEmpty={markdown.trim() === ''}
        />
        <Output ref={outputRef} value={markdown} output={options.output} />
      </Box>
    </Container>
  );
}
