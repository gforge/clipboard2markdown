import { createTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';

export const sansFont = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const monoFont =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1565c0', dark: '#0d47a1', light: '#90caf9' },
        success: { main: '#2e7d32', dark: '#1b5e20', light: '#e8f5e9' },
        background: { default: '#f4f6f9', paper: '#ffffff' },
        text: { primary: '#212121', secondary: '#616161' },
        divider: '#e0e0e0',
        action: { active: '#616161' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#64b5f6', dark: '#42a5f5', light: '#1e3a5f' },
        success: { main: '#66bb6a', dark: '#a5d6a7', light: '#1b3a22' },
        background: { default: '#111417', paper: '#1a1e23' },
        divider: '#2c3238',
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: sansFont,
    h1: { fontSize: 18, fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: 24, fontWeight: 700, lineHeight: 1.25 },
    subtitle2: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    body2: { fontSize: 14 },
    caption: { fontSize: 12, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: 14 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, paddingInline: 14, borderRadius: 8 },
        sizeLarge: { minHeight: 44, paddingInline: 18 },
      },
    },
    MuiPaper: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiTooltip: { defaultProps: { arrow: true, enterDelay: 400 } },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 36, height: 20, padding: 0, flex: 'none', overflow: 'visible' },
        switchBase: ({ theme: t }) => ({
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: (t.vars || t).palette.primary.main,
            },
          },
          '&.Mui-focusVisible + .MuiSwitch-track': {
            outline: `2px solid ${(t.vars || t).palette.primary.main}`,
            outlineOffset: 2,
          },
        }),
        thumb: { width: 16, height: 16, boxShadow: '0 1px 2px rgba(0,0,0,.3)' },
        track: ({ theme: t }) => ({
          borderRadius: 10,
          opacity: 1,
          backgroundColor: '#bdbdbd',
          transition: t.transitions.create('background-color', { duration: 150 }),
          ...t.applyStyles('dark', { backgroundColor: '#4a5058' }),
        }),
      },
    },
  },
});

export default theme;
