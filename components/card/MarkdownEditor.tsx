'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import type { Editor } from '@tiptap/react'

interface Props {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

// tiptap-markdown augments editor.storage at runtime but not in the type defs.
function getMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown?: { getMarkdown(): string } }
  return storage.markdown?.getMarkdown() ?? ''
}

/**
 * Single-mode, live-rendered Markdown editor (Notion-style).
 * - No edit/preview toggle, no visible Markdown markers.
 * - Not a block editor: just inline Markdown formatting that renders as you type.
 * - Persists clean Markdown back to the card body.
 *
 * Mount one instance per card (key={card.id}) so switching cards resets cleanly.
 */
export function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { spellcheck: 'false' } },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start writing…' }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
        linkify: true,
        breaks: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'ban-editor prose-dark focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(getMarkdown(editor))
    },
  })

  return <EditorContent editor={editor} className="flex-1 min-h-0 overflow-y-auto px-5 py-4" />
}
