"use client"

import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Undo2,
  Wrench,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function decodeDoubleEncoded(html: string): string {
  if (!/&lt;|&gt;|&amp;/.test(html)) return html
  return html
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-pine/10 text-pine")}
    >
      {children}
    </Button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article…",
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceHtml, setSourceHtml] = useState(value)
  const [formatting, setFormatting] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[280px] px-4 py-3 focus:outline-none prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-p:text-ink prose-a:text-pine",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || sourceMode) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [editor, sourceMode, value])

  useEffect(() => {
    if (sourceMode) setSourceHtml(value)
  }, [sourceMode, value])

  const applyHtml = useCallback(
    (html: string) => {
      if (!editor) return
      editor.commands.setContent(html, { emitUpdate: false })
      onChange(html)
    },
    [editor, onChange],
  )

  async function handleAiFormat() {
    if (!editor) return
    setFormatting(true)
    try {
      const res = await fetch("/api/cms/blog/format-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.getHTML() }),
      })
      const body = (await res.json()) as { html?: string; error?: string }
      if (!res.ok) throw new Error(body.error ?? "Format failed")
      const html = body.html ?? ""
      applyHtml(html)
      toast.success("Content formatted")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setFormatting(false)
    }
  }

  function handleFixHtml() {
    const fixed = decodeDoubleEncoded(sourceMode ? sourceHtml : editor?.getHTML() ?? "")
    if (sourceMode) {
      setSourceHtml(fixed)
    } else {
      applyHtml(fixed)
    }
    toast.success("HTML decoded")
  }

  function toggleSource() {
    if (!editor) return
    if (!sourceMode) {
      setSourceHtml(editor.getHTML())
      setSourceMode(true)
    } else {
      applyHtml(sourceHtml)
      setSourceMode(false)
    }
  }

  function setLink() {
    if (!editor) return
    const prev = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL", prev ?? "https://")
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  function insertImage() {
    if (!editor) return
    const url = window.prompt("Image URL (HTTPS)")
    if (!url?.trim()) return
    editor.chain().focus().setImage({ src: url.trim() }).run()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sage-line/70 bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-sage-line/60 bg-paper-deep/50 p-1.5">
        <ToolbarButton
          onClick={toggleSource}
          active={sourceMode}
          title="Toggle source"
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => void handleAiFormat()}
          disabled={sourceMode || formatting || !editor}
          title="AI Format"
        >
          <Sparkles className="size-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleFixHtml} title="Fix HTML" disabled={!editor}>
          <Wrench className="size-4" />
        </ToolbarButton>

        {!sourceMode && editor ? (
          <>
            <span className="mx-1 h-5 w-px bg-sage-line/70" aria-hidden />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strikethrough"
            >
              <Strikethrough className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              title="Inline code"
            >
              <Code className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet list"
            >
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Numbered list"
            >
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <Quote className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal rule"
            >
              <Minus className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
              <Link2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton onClick={insertImage} title="Image">
              <ImageIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo2 className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo2 className="size-4" />
            </ToolbarButton>
          </>
        ) : null}
      </div>

      {sourceMode ? (
        <Textarea
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
          className="min-h-[320px] resize-y rounded-none border-0 font-mono text-xs focus-visible:ring-0"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}
