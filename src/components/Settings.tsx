import React from 'react';
import {
  FormGroup,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import type { ConvertOptions } from '../lib/converter';

type Props = Readonly<{ options: ConvertOptions; onChange: (opts: ConvertOptions) => void }>;

export default function Settings({ options, onChange }: Props) {
  const set = (patch: Partial<ConvertOptions>) => onChange({ ...options, ...patch });

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
            <Typography component="span" sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
              <code>Drop images</code>
            </Typography>
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
            <Typography component="span" sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
              <code>Drop bold</code>
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={!!options.dashToHyphen}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set({ dashToHyphen: e.target.checked })
              }
            />
          }
          label={
            <Typography component="span" sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
              <code>Convert em-dash to -</code>
            </Typography>
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
            <Typography component="span" sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
              <code>De-PDF: join soft wraps, fix hyphenation, strip escapes</code>
            </Typography>
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
            <Typography component="span" sx={{ fontFamily: 'Consolas, "Courier New", monospace' }}>
              <code>Convert headings to bold</code>
            </Typography>
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
