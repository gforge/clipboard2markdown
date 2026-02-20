import React from 'react';
import { Box, Button } from '@mui/material';

type Props = {
  onCopy: () => void;
  onClear: () => void;
  showClear?: boolean;
};

export default function OutputControls({ onCopy, onClear, showClear = true }: Readonly<Props>) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      {showClear && (
        <Button variant="outlined" onClick={onClear}>
          Clear
        </Button>
      )}
      <Button variant="contained" onClick={onCopy}>
        Copy
      </Button>
    </Box>
  );
}
