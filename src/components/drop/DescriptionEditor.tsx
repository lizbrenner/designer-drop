import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils'

interface DescriptionEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  'aria-label'?: string
}

/** WYSIWYG rich text editor (TipTap). Bold, italic, underline, lists, link, blockquote, code, strikethrough. */
export function DescriptionEditor({
  value,
  onChange,
  placeholder = 'Add a description…',
  className,
  'aria-label': ariaLabel = 'Description',
}: DescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        'aria-label': ariaLabel,
        class: 'min-h-[120px] w-full px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none dark:prose-invert',
      },
    },
  })

  const updateFromValue = useCallback(() => {
    if (!editor) return
    const current = editor.getHTML()
    const normalized = value?.trim() || ''
    if (normalized && current !== normalized) {
      editor.commands.setContent(normalized, false)
    } else if (!normalized && current !== '<p></p>') {
      editor.commands.setContent('', false)
    }
  }, [editor, value])

  useEffect(() => {
    updateFromValue()
  }, [value, updateFromValue])

  useEffect(() => {
    if (!editor) return
    const onUpdate = () => {
      const html = editor.getHTML()
      const normalized = html === '<p></p>' || html === '<p><br></p>' ? '' : html
      onChange(normalized)
    }
    editor.on('update', onUpdate)
    return () => editor.off('update', onUpdate)
  }, [editor, onChange])

  const setLink = useCallback(() => {
    if (!editor) return
    const previous = editor.getAttributes('link').href
    const url = window.prompt('URL', previous ?? 'https://')
    if (url == null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const href = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }, [editor])

  if (!editor) return null

  const toolbarBtn = (active: boolean) =>
    cn(
      'rounded px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400',
      active && 'bg-zinc-200 dark:bg-zinc-700'
    )

  return (
    <div
      className={cn(
        'rounded-md border border-zinc-300 dark:border-zinc-600 overflow-hidden',
        'bg-white dark:bg-zinc-800',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800/50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(toolbarBtn(editor.isActive('bold')), 'font-bold')}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(toolbarBtn(editor.isActive('italic')), 'italic')}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(toolbarBtn(editor.isActive('underline')), 'underline')}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          U
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(toolbarBtn(editor.isActive('strike')), 'line-through')}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          S
        </button>
        <span className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-600" aria-hidden />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive('bulletList'))}
          title="Bullet list"
          aria-label="Bullet list"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive('orderedList'))}
          title="Numbered list"
          aria-label="Numbered list"
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toolbarBtn(editor.isActive('blockquote'))}
          title="Quote"
          aria-label="Quote"
        >
          “
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn(toolbarBtn(editor.isActive('code')), 'font-mono text-xs')}
          title="Inline code"
          aria-label="Code"
        >
          {'</>'}
        </button>
        <button
          type="button"
          onClick={setLink}
          className={toolbarBtn(editor.isActive('link'))}
          title="Insert link"
          aria-label="Insert link"
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          float: left;
          color: #a1a1aa;
          pointer-events: none;
          height: 0;
        }
        .dark .ProseMirror p.is-editor-empty:first-child::before {
          color: #71717a;
        }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; }
        .ProseMirror ul li, .ProseMirror ol li { margin: 0.25rem 0; }
        .ProseMirror blockquote {
          border-left: 3px solid #d4d4d8;
          padding-left: 0.75rem;
          margin: 0.5rem 0;
          color: #52525b;
        }
        .dark .ProseMirror blockquote { border-left-color: #52525b; color: #a1a1aa; }
        .ProseMirror code { background: #f4f4f5; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875em; }
        .dark .ProseMirror code { background: #27272a; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .dark .ProseMirror a { color: #60a5fa; }
      `}</style>
    </div>
  )
}
