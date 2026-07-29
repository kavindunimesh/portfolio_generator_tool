import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

export function markdownToHtml(markdown: string): string {
  const trimmed = markdown.trim();
  if (!trimmed) return '';
  return marked.parse(trimmed, { async: false }) as string;
}

export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
