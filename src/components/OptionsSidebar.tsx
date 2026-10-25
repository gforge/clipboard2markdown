import React from 'react';
import { Box, FormControlLabel, Paper, Switch, Tooltip, Typography } from '@mui/material';
import type { ConvertOptions } from '../lib/converter';
import useStore from '../store/useStore';

type BoolOption = {
  [K in keyof ConvertOptions]-?: ConvertOptions[K] extends boolean | undefined ? K : never;
}[keyof ConvertOptions];

type Row = { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void };

function OptionRow({ label, hint, checked, onChange }: Readonly<Row>) {
  return (
    <Tooltip title={hint} placement="left">
      <FormControlLabel
        labelPlacement="start"
        control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
        label={label}
        slotProps={{ typography: { variant: 'body2' } }}
        sx={{ m: 0, minHeight: 40, justifyContent: 'space-between', gap: 1.5 }}
      />
    </Tooltip>
  );
}

function OptionCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <Paper component="section" sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" component="h2" color="text.secondary" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export default function OptionsSidebar() {
  const options = useStore((s) => s.options);
  const setOptions = useStore((s) => s.setOptions);
  const autoCopy = useStore((s) => s.prefs.autoCopy);
  const setPrefs = useStore((s) => s.setPrefs);

  const row = (key: BoolOption, label: string, hint: string) => (
    <OptionRow
      label={label}
      hint={hint}
      checked={!!options[key]}
      onChange={(v) => setOptions({ [key]: v })}
    />
  );

  return (
    <Box component="aside" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <OptionCard title="Remove">
        {row('dropImages', 'Images', 'Drop images instead of embedding image markdown')}
        {row('dropBold', 'Bold', 'Strip bold/strong formatting but keep the text')}
        {row('dropItalic', 'Italics', 'Strip italics/emphasis formatting but keep the text')}
        {row('dropCode', 'Code', 'Strip inline backticks and fenced blocks but keep the content')}
      </OptionCard>

      <OptionCard title="Clean up">
        {row(
          'normalizePunctuation',
          'Normalize punctuation',
          'Replace smart punctuation (— “ ” ’ …) with ASCII',
        )}
        {row(
          'dePdf',
          'De-PDF line breaks',
          'Join soft wraps, fix hyphenation and strip backslash escapes from PDF text',
        )}
        {row(
          'headingsToBold',
          'Headings → bold',
          'Turn headings into bold paragraphs (for rich form fields that mangle # headings)',
        )}
        {row(
          'alignTables',
          'Align table columns',
          'Pad Markdown table cells so the columns line up in the source',
        )}
      </OptionCard>

      <OptionCard title="After paste">
        <OptionRow
          label="Copy result automatically"
          hint="Write the converted text back to the clipboard as soon as you paste"
          checked={autoCopy}
          onChange={(v) => setPrefs({ autoCopy: v })}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Paste, and the converted text is already on your clipboard.
        </Typography>
      </OptionCard>
    </Box>
  );
}
