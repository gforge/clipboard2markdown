import React, { useLayoutEffect, useRef } from 'react';
import { Box, Container } from '@mui/material';
import Header from './components/Header';
import OptionsSidebar from './components/OptionsSidebar';
import OutputPanel from './components/OutputPanel';
import EmptyState from './components/EmptyState';
import usePasteCapture from './hooks/usePasteCapture';
import useStore from './store/useStore';

export default function App() {
  const hasOutput = useStore((s) => s.output.trim() !== '');
  const { copyOutput, readClipboard } = usePasteCapture();
  const headerRef = useRef<HTMLElement | null>(null);

  // Expose the header height so the output toolbar can stick right below it.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const apply = () =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', color: 'text.primary' }}>
      <Header ref={headerRef} />
      <Container
        component="main"
        maxWidth="lg"
        sx={{ py: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}
      >
        <Box sx={{ flex: '1 1 260px', maxWidth: { sm: 300 } }}>
          <OptionsSidebar />
        </Box>
        <Box sx={{ flex: '999 1 480px', minWidth: 0 }}>
          {hasOutput ? (
            <OutputPanel onCopy={copyOutput} />
          ) : (
            <EmptyState onReadClipboard={readClipboard} />
          )}
        </Box>
      </Container>
    </Box>
  );
}
