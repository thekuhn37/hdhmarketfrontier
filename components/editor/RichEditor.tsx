'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import { Link as LinkExtension } from '@tiptap/extension-link'
import { Underline as UnderlineExtension } from '@tiptap/extension-underline'
import { Image as ImageExtension } from '@tiptap/extension-image'
import { Placeholder as PlaceholderExtension } from '@tiptap/extension-placeholder'
import { TextAlign as TextAlignExtension } from '@tiptap/extension-text-align'
import { Highlight as HighlightExtension } from '@tiptap/extension-highlight'
import { TableKit } from '@tiptap/extension-table'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { CharacterCount as CharacterCountExtension } from '@tiptap/extension-character-count'
import { Typography as TypographyExtension } from '@tiptap/extension-typography'
import { TaskList as TaskListExtension } from '@tiptap/extension-task-list'
import { TaskItem as TaskItemExtension } from '@tiptap/extension-task-item'
import { common, createLowlight } from 'lowlight'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import {
  Bold, Italic, Underline, Strikethrough, Code,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Quote, Link as LinkIcon, ImagePlus, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Minus, Undo2, Redo2,
  Loader2, X, Check,
} from 'lucide-react'

const lowlight = createLowlight(common)

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function ToolbarBtn({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-md text-sm transition-all flex-shrink-0',
        'focus:outline-none focus:ring-1 focus:ring-[#38BDF8]',
        active
          ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]'
          : 'text-[#4B5563] hover:bg-[#E5E7EB] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
        disabled && 'opacity-35 cursor-not-allowed pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-[#D1D5DB] dark:bg-white/15 mx-0.5 flex-shrink-0" />
}

function BubbleBtn({
  onClick, active = false, title, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-md transition-all',
        active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: 'editor-img' },
        allowBase64: false,
      }),
      PlaceholderExtension.configure({
        placeholder: placeholder ?? 'Start writing your article…',
      }),
      TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
      HighlightExtension.configure({ multicolor: false }),
      TableKit,
      CodeBlockLowlight.configure({ lowlight }),
      CharacterCountExtension,
      TypographyExtension,
      TaskListExtension,
      TaskItemExtension.configure({ nested: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'tiptap-prose',
        'data-gramm': 'false',
      },
    },
  })

  const uploadAndInsertImage = useCallback(async (file: File) => {
    if (!editor) return
    if (!file.type.startsWith('image/')) { toast.error('Only image files are supported'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return }

    setIsUploading(true)
    const toastId = toast.loading('Uploading image…')
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `posts/body/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
      editor.chain().focus().setImage({ src: publicUrl }).run()
      toast.success('Image inserted!', { id: toastId })
    } catch {
      toast.error('Image upload failed', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }, [editor])

  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    const onDrop = (e: DragEvent) => {
      const file = e.dataTransfer?.files?.[0]
      if (file?.type.startsWith('image/')) {
        e.preventDefault()
        e.stopPropagation()
        uploadAndInsertImage(file)
      }
    }
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0]
      if (file?.type.startsWith('image/')) {
        e.preventDefault()
        uploadAndInsertImage(file)
      }
    }
    container.addEventListener('drop', onDrop)
    container.addEventListener('paste', onPaste)
    return () => {
      container.removeEventListener('drop', onDrop)
      container.removeEventListener('paste', onPaste)
    }
  }, [uploadAndInsertImage])

  const applyLink = useCallback(() => {
    if (!editor) return
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().unsetLink().run()
    } else {
      const href = url.startsWith('http') ? url : `https://${url}`
      editor.chain().focus().setLink({ href, target: '_blank' }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const wordCount = editor ? editor.getText().split(/\s+/).filter(Boolean).length : 0
  const charCount = editor ? editor.getText().length : 0

  if (!editor) {
    return (
      <div className="border border-[#E5E7EB] dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#1E2A3B]">
        <div className="h-11 bg-[#F8FAFC] dark:bg-white/5 border-b border-[#E5E7EB] dark:border-white/10 animate-pulse" />
        <div className="h-[500px] animate-pulse bg-[#FAFAFA] dark:bg-[#0F172A]" />
      </div>
    )
  }

  return (
    <div className="border border-[#E5E7EB] dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#1E2A3B] shadow-sm">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0F172A] sticky top-0 z-10">

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
          <Undo2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
          <Redo2 size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)">
          <Underline size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task / Checklist">
          <ListChecks size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote size={14} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <span className="font-mono text-[10px] font-bold leading-none">{'{}'}</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Divider">
          <Minus size={14} />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              const prev = (editor.getAttributes('link').href as string) ?? ''
              setLinkUrl(prev)
              setShowLinkInput(v => !v)
            }
          }}
          active={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remove Link' : 'Insert Link'}
        >
          <LinkIcon size={14} />
        </ToolbarBtn>

        <ToolbarBtn onClick={() => imageInputRef.current?.click()} disabled={isUploading} title="Insert Image">
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon size={14} />
        </ToolbarBtn>
      </div>

      {/* ── Link URL input ────────────────────────────────────────────────── */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E5E7EB] dark:border-white/10 bg-[#FFFBEB] dark:bg-amber-500/10">
          <LinkIcon size={13} className="text-[#6B7280] dark:text-slate-400 flex-shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); applyLink() }
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('') }
            }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none text-[#111827] dark:text-slate-200 placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500"
          />
          <button type="button" onClick={applyLink} title="Apply link"
            className="p-1 rounded hover:bg-[#E5E7EB] dark:hover:bg-white/10 text-[#22C55E] dark:text-green-400 transition-colors">
            <Check size={13} />
          </button>
          <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl('') }} title="Cancel"
            className="p-1 rounded hover:bg-[#E5E7EB] dark:hover:bg-white/10 text-[#6B7280] dark:text-slate-400 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) uploadAndInsertImage(file)
          e.target.value = ''
        }}
      />

      {/* ── Bubble Menu (appears over text selection) ─────────────────────── */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-[#0F172A] shadow-2xl border border-white/10"
      >
        <BubbleBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={13} />
        </BubbleBtn>
        <BubbleBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={13} />
        </BubbleBtn>
        <BubbleBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <Underline size={13} />
        </BubbleBtn>
        <BubbleBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={13} />
        </BubbleBtn>
        <div className="w-px h-3.5 bg-white/20 mx-0.5" />
        <BubbleBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 size={13} />
        </BubbleBtn>
        <BubbleBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 size={13} />
        </BubbleBtn>
        <div className="w-px h-3.5 bg-white/20 mx-0.5" />
        <BubbleBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code size={13} />
        </BubbleBtn>
        <BubbleBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter size={13} />
        </BubbleBtn>
        <div className="w-px h-3.5 bg-white/20 mx-0.5" />
        <BubbleBtn
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run()
            } else {
              const prev = (editor.getAttributes('link').href as string) ?? ''
              setLinkUrl(prev)
              setShowLinkInput(true)
            }
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon size={13} />
        </BubbleBtn>
      </BubbleMenu>

      {/* ── Editor content area ───────────────────────────────────────────── */}
      <div ref={editorContainerRef} className="min-h-[540px]">
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer: word / char count ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#E5E7EB] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0F172A]">
        <span className="text-xs text-[#9CA3AF] dark:text-slate-500">
          {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
        </span>
        <span className="text-xs text-[#D1D5DB] dark:text-slate-600">Drop or paste images to upload</span>
      </div>
    </div>
  )
}
