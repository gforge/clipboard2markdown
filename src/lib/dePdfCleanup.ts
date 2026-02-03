export const dePdfCleanup = (s: string): string => {
  // Normalize CRLF to LF
  s = s.replaceAll(/\r\n?/g, '\n');

  const lines = s.split('\n');
  const outLines: string[] = [];
  let buf = '';

  const isBlockStart = (trimmed: string) => {
    // Headings, blockquotes, and list-like lines should be preserved as-is
    return /^(#{1,6}\s|[>*-]\s|\d+\.)/.test(trimmed);
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      if (buf) {
        outLines.push(buf.trim());
        buf = '';
      }
      outLines.push('');
      continue;
    }

    if (isBlockStart(trimmed)) {
      if (buf) {
        outLines.push(buf.trim());
        buf = '';
      }
      outLines.push(trimmed);
      continue;
    }

    // Normal paragraph line — join into buffer using conservative rules
    if (buf === '') {
      buf = trimmed;
      continue;
    }

    // Handle hyphenated line endings ("ulti-" at end of line)
    if (buf.endsWith('-')) {
      buf = buf.slice(0, -1) + trimmed;
      continue;
    }

    const lastChar = buf.slice(-1);
    const firstChar = trimmed.charAt(0);

    if (/[A-Za-z]/.test(lastChar) && /[a-z]/.test(firstChar)) {
      // mid-word split: join without space
      buf = buf + trimmed;
    } else if (/[a-z]/.test(lastChar) && /[A-Z]/.test(firstChar)) {
      // likely sentence boundary: preserve space
      buf = buf + ' ' + trimmed;
    } else if (/[A-Z]/.test(lastChar) && /[A-Z]/.test(firstChar)) {
      // uppercase -> uppercase: treat as word boundary, keep a space
      buf = buf + ' ' + trimmed;
    } else {
      // default: join with a space
      buf = buf + ' ' + trimmed;
    }
  }

  if (buf) outLines.push(buf.trim());

  let res = outLines.join('\n');

  // Remove runs of backslashes immediately before bracket/paren ("\\\[1\\\]" -> "[1]")
  res = res.replaceAll(/\\+(?=[\u005B\u005D\u0028\u0029])/g, '');

  // Collapse multiple spaces/newlines and tidy
  res = res.replaceAll(/ {2,}/g, ' ');
  res = res.replaceAll(/\n{3,}/g, '\n\n');

  return res.trim();
};
