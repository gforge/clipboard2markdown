export const sanitizeHtml = (input: string = ''): string => {
  let s = input;
  s = s.replaceAll(/<head[\s\S]*?>[\s\S]*?<\/head>/gi, '');
  s = s.replaceAll(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
  s = s.replaceAll(/<meta[\s\S]*?>/gi, '');
  s = s.replaceAll(/<link[\s\S]*?>/gi, '');
  s = s.replaceAll(/<xml[\s\S]*?>[\s\S]*?<\/xml>/gi, '');
  s = s.replaceAll(/<!--([\s\S]*?)-->/g, '');
  // Remove stray @page or CSS rules if present as text nodes
  s = s.replaceAll(/@page[\s\S]*?\}/gi, '');
  // Remove inline style attributes that often carry MS Office artifacts
  s = s.replaceAll(/\sstyle="[^"]*"/gi, '');
  // Remove Microsoft-specific tags like <o:p>
  s = s.replaceAll(/<o:p>[\s\S]*?<\/o:p>/gi, '');
  // Word/Outlook often split one list into consecutive <ul> blocks (one per item
  // or per formatting run). Merge them so they convert to a single tight list;
  // for <ol> only when the next block explicitly continues the numbering.
  s = s.replaceAll(/<\/ul>\s*<ul(?:\s[^>]*)?>/gi, '');
  s = s.replaceAll(/<\/ol>\s*<ol\s[^>]*\bstart=["']?\d+["']?[^>]*>/gi, '');
  return s.trim();
};
