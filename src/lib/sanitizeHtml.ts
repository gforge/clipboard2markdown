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
  return s.trim();
};
