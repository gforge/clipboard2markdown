import React from 'react';
import {
  FormGroup,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  Tooltip,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import { useStore } from '../store/useStore';

export default function Settings() {
  const options = useStore((s) => s.options);
  const setOptions = useStore((s) => s.setOptions);
  const set = (patch: Partial<import('../lib/converter').ConvertOptions>) => setOptions(patch);

  return (
    <Paper
      sx={{ p: 2, fontFamily: 'Consolas, "Courier New", monospace', backgroundColor: '#f5f5f5' }}
    >
      <Typography variant="subtitle1">Options</Typography>
      <FormGroup row>
        <FormControlLabel
          control={
            <Switch
              checked={!!options.dropImages}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dropImages: e.target.checked })
              }
            />
          }
          label={
            <Tooltip title="Remove images from output and avoid embedding image markdown" arrow>
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Drop images</code>
              </Typography>
            </Tooltip>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!options.dropBold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dropBold: e.target.checked })
              }
            />
          }
          label={
            <Tooltip title="Strip bold/strong formatting but keep the text" arrow>
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Drop bold</code>
              </Typography>
            </Tooltip>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={!!options.dropItalic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dropItalic: e.target.checked })
              }
            />
          }
          label={
            <Tooltip
              title="Strip italics/emphasis formatting (*, _, <em>/<i>) but keep the text"
              arrow
            >
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Drop italics</code>
              </Typography>
            </Tooltip>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={!!options.dropCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dropCode: e.target.checked })
              }
            />
          }
          label={
            <Tooltip
              title="Strip code formatting (inline backticks and fenced blocks) but keep the content"
              arrow
            >
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Drop code</code>
              </Typography>
            </Tooltip>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!options.normalizePunctuation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ normalizePunctuation: e.target.checked })
              }
            />
          }
          label={
            <Tooltip title="Replace smart punctuation (— “ ” ’ …) with ASCII" arrow>
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Normalize punctuation</code>
              </Typography>
            </Tooltip>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={!!options.dePdf}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dePdf: e.target.checked })
              }
            />
          }
          label={
            <Tooltip
              title="Join soft wraps, fix hyphenation, strip backslash escapes from PDFs"
              arrow
            >
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>De-PDF</code>
              </Typography>
            </Tooltip>
          }
        />

        <FormControlLabel
          control={
            <Switch
              checked={!!options.headingsToBold}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ headingsToBold: e.target.checked })
              }
            />
          }
          label={
            <Tooltip
              title="Convert headings to bold text (useful when pasting into rich form fields that then convert to poor PDFs)"
              arrow
            >
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Headings to bold</code>
              </Typography>
            </Tooltip>
          }
        />
      </FormGroup>

      <FormControl component="fieldset" sx={{ mt: 1 }}>
        <FormLabel component="legend">Output</FormLabel>
        <RadioGroup
          row
          value={options.output ?? 'markdown'}
          onChange={(e) => set({ output: e.target.value as 'markdown' | 'clean' })}
        >
          <FormControlLabel
            value="markdown"
            control={<Radio />}
            label={
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Markdown</code>
              </Typography>
            }
          />
          <FormControlLabel
            value="clean"
            control={<Radio />}
            label={
              <Typography
                component="span"
                sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              >
                <code>Clean HTML</code>
              </Typography>
            }
          />
        </RadioGroup>
      </FormControl>
    </Paper>
  );
}
