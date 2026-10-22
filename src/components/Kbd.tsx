import React from 'react';
import { Box } from '@mui/material';
import { monoFont } from '../theme';

type Props = Readonly<{ children: React.ReactNode; onDark?: boolean }>;

/** Keyboard key chip. `onDark` renders the translucent variant used inside the primary button. */
export default function Kbd({ children, onDark = false }: Props) {
  return (
    <Box
      component="kbd"
      sx={(theme) => ({
        fontFamily: monoFont,
        fontWeight: 500,
        fontSize: onDark ? 11 : 13,
        lineHeight: 1.4,
        px: 0.75,
        py: 0.25,
        borderRadius: '4px',
        whiteSpace: 'nowrap',
        ...(onDark
          ? { bgcolor: 'rgba(255,255,255,.18)', color: 'inherit' }
          : {
              border: `1px solid ${theme.vars.palette.divider}`,
              borderBottomWidth: 2,
              bgcolor: '#fafafa',
              color: theme.vars.palette.text.primary,
              ...theme.applyStyles('dark', { bgcolor: theme.vars.palette.background.default }),
            }),
      })}
    >
      {children}
    </Box>
  );
}
