import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TurndownService from 'turndown';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Link as LinkIcon,
  Code,
  Undo,
  Redo,
  Strikethrough,
} from 'lucide-react';
import { markdownToHtml } from '../lib/markdown';

type EditorMode = 'wysiwyg' | 'markdown';

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: number;
};

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

function htmlToMarkdown(html: string) {
  if (!html || html === '<p></p>') return '';
  return turndown.turndown(html).trim();
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      className={`mre-btn${active ? ' active' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MarkdownRichEditor({
  value,
  onChange,
  placeholder = 'Write a description…',
  minHeight = 160,
}: Props) {
  const [mode, setMode] = useState<EditorMode>('wysiwyg');
  const [markdownDraft, setMarkdownDraft] = useState(value);
  const lastEmitted = useRef(value);
  const syncingFromProp = useRef(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'mre-link' },
      }),
    ],
    [placeholder]
  );

  const editor = useEditor({
    extensions,
    content: markdownToHtml(value),
    editorProps: {
      attributes: {
        class: 'markdown-rich-editor__content mre-surface',
        style: `min-height:${minHeight}px`,
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      if (syncingFromProp.current) return;
      const markdown = htmlToMarkdown(current.getHTML());
      lastEmitted.current = markdown;
      onChange(markdown);
      setMarkdownDraft(markdown);
    },
  });

  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    setMarkdownDraft(value);

    if (!editor || mode !== 'wysiwyg') return;

    if (htmlToMarkdown(editor.getHTML()) === value.trim()) return;

    syncingFromProp.current = true;
    editor.commands.setContent(markdownToHtml(value) || '', { emitUpdate: false });
    syncingFromProp.current = false;
  }, [value, editor, mode]);

  const switchToMarkdown = () => {
    if (!editor) {
      setMode('markdown');
      return;
    }
    const markdown = htmlToMarkdown(editor.getHTML());
    setMarkdownDraft(markdown);
    lastEmitted.current = markdown;
    onChange(markdown);
    setMode('markdown');
  };

  const switchToWysiwyg = () => {
    const markdown = markdownDraft;
    lastEmitted.current = markdown;
    onChange(markdown);
    if (editor) {
      syncingFromProp.current = true;
      editor.commands.setContent(markdownToHtml(markdown) || '', { emitUpdate: false });
      syncingFromProp.current = false;
    }
    setMode('wysiwyg');
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  return (
    <div className="mre">
      <div className="mre-toolbar">
        <div className="mre-toolbar-left">
          {mode === 'wysiwyg' && editor ? (
            <>
              <ToolbarButton
                title="Bold"
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Italic"
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Strikethrough"
                active={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
              >
                <Strikethrough size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Heading"
                active={editor.isActive('heading', { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Bullet list"
                active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Numbered list"
                active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Quote"
                active={editor.isActive('blockquote')}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Inline code"
                active={editor.isActive('code')}
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code size={14} />
              </ToolbarButton>
              <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
                <LinkIcon size={14} />
              </ToolbarButton>
              <span className="mre-sep" />
              <ToolbarButton
                title="Undo"
                disabled={!editor.can().undo()}
                onClick={() => editor.chain().focus().undo().run()}
              >
                <Undo size={14} />
              </ToolbarButton>
              <ToolbarButton
                title="Redo"
                disabled={!editor.can().redo()}
                onClick={() => editor.chain().focus().redo().run()}
              >
                <Redo size={14} />
              </ToolbarButton>
            </>
          ) : (
            <span className="mre-hint">Markdown source</span>
          )}
        </div>

        <div className="mre-mode">
          <button
            type="button"
            className={mode === 'wysiwyg' ? 'active' : ''}
            onClick={switchToWysiwyg}
          >
            Editor
          </button>
          <button
            type="button"
            className={mode === 'markdown' ? 'active' : ''}
            onClick={switchToMarkdown}
          >
            Markdown
          </button>
        </div>
      </div>

      {mode === 'wysiwyg' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          className="mre-markdown"
          style={{ minHeight: Math.max(minHeight + 40, 200) }}
          value={markdownDraft}
          onChange={(e) => {
            const next = e.target.value;
            setMarkdownDraft(next);
            lastEmitted.current = next;
            onChange(next);
          }}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
