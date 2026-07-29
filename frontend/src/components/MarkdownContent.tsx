import { useMemo } from 'react';
import { markdownToHtml } from '../lib/markdown';

type Props = {
  markdown: string;
  className?: string;
};

export function MarkdownContent({ markdown, className = '' }: Props) {
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);
  if (!html) return null;

  return (
    <div
      className={`md-content markdown-rich-editor__content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
