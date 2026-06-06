'use client'

import { useState, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import AdminLayout from '@/components/admin/AdminLayout'
import RichEditor from '@/components/editor/RichEditor'
import { createClient } from '@/lib/supabase/client'
import { slugify, formatDate } from '@/lib/utils/format'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import {
  Save, Send, Wand2, Upload, X, ImagePlus,
  Sparkles, Loader2, ArrowLeft, Trash2, Eye,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'

const CATEGORIES = ['Markets', 'Data', 'Infrastructure', 'AI', 'Digital Assets']
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

interface PostFormData {
  title: string
  slug: string
  category: string
  language: string
  status: 'draft' | 'published'
  summary: string
  content: string
  seo_title: string
  seo_description: string
  thumbnail_url: string
  source_url: string
  tags: string
  is_featured: boolean
  is_popular: boolean
}

interface PostEditorProps {
  mode: 'create' | 'edit'
  initialData?: Partial<PostFormData> & { published_at?: string | null; view_count?: number }
  postId?: string
}

const DEFAULT_FORM: PostFormData = {
  title: '', slug: '', category: 'Markets', language: 'en',
  status: 'draft', summary: '', content: '', seo_title: '',
  seo_description: '', thumbnail_url: '', source_url: '', tags: '',
  is_featured: false, is_popular: false,
}

export default function PostEditor({ mode, initialData, postId }: PostEditorProps) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [seoEdited, setSeoEdited] = useState({ title: false, description: false })
  const [generating, setGenerating] = useState({
    title: false, slug: false, seo_title: false, seo_description: false,
  })

  const [form, setForm] = useState<PostFormData>({
    ...DEFAULT_FORM,
    ...initialData,
  })

  const update = (key: keyof PostFormData, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !prev.slug) next.slug = slugify(value as string)
      if (key === 'title' && !seoEdited.title) next.seo_title = value as string
      if (key === 'summary' && !seoEdited.description) {
        next.seo_description = (value as string).slice(0, 160)
      }
      if (key === 'content' && !prev.summary && !seoEdited.description) {
        const plain = (value as string).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        next.seo_description = plain.slice(0, 160)
      }
      return next
    })
  }

  const updateSeo = (key: 'seo_title' | 'seo_description', value: string) => {
    setSeoEdited(prev => ({
      ...prev,
      [key === 'seo_title' ? 'title' : 'description']: true,
    }))
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    await uploadThumbnail(file)
    e.target.value = ''
  }

  const handleThumbnailDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) await uploadThumbnail(file)
  }

  const uploadThumbnail = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
      setForm(prev => ({ ...prev, thumbnail_url: publicUrl }))
      toast.success('Thumbnail uploaded!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed — check the thumbnails bucket exists.')
    } finally {
      setUploading(false)
    }
  }

  const generateSummary = async () => {
    if (!form.content) { toast.error('Add content first'); return }
    try {
      const plain = form.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plain }),
      })
      const { summary } = await res.json()
      if (summary) { update('summary', summary); toast.success('Summary generated!') }
    } catch {
      toast.error('Summary generation failed')
    }
  }

  const generateField = async (field: 'title' | 'slug' | 'seo_title' | 'seo_description' | 'all') => {
    if (!form.content) { toast.error('Write some content first'); return }
    const fields = field === 'all'
      ? ['title', 'slug', 'seo_title', 'seo_description'] as const
      : [field] as const
    setGenerating(prev => Object.fromEntries(fields.map(f => [f, true])) as typeof prev)
    try {
      const plain = form.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const res = await fetch('/api/ai/generate-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plain }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as Record<string, string>
      setForm(prev => {
        const next = { ...prev }
        if (fields.includes('title') && data.title) {
          next.title = data.title
          if (!prev.slug) next.slug = data.slug ?? prev.slug
        }
        if (fields.includes('slug') && data.slug) next.slug = data.slug
        if (fields.includes('seo_title') && data.seo_title) {
          next.seo_title = data.seo_title
          setSeoEdited(s => ({ ...s, title: true }))
        }
        if (fields.includes('seo_description') && data.seo_description) {
          next.seo_description = data.seo_description
          setSeoEdited(s => ({ ...s, description: true }))
        }
        return next
      })
      toast.success(field === 'all' ? 'All fields generated!' : 'Generated!')
    } catch {
      toast.error('AI generation failed')
    } finally {
      setGenerating(prev => Object.fromEntries(fields.map(f => [f, false])) as typeof prev)
    }
  }

  const handleSave = async (publish = false) => {
    if (!form.title || !form.slug || !form.content) {
      toast.error('Title, slug, and content are required')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean)
      const plain = form.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const reading_time = calculateReadingTime(plain)

      const postData = {
        title: form.title,
        slug: form.slug,
        category: form.category,
        language: form.language,
        status: publish ? 'published' : form.status,
        summary: form.summary || null,
        content: form.content,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        thumbnail_url: form.thumbnail_url || null,
        source_url: form.source_url || null,
        is_featured: form.is_featured,
        is_popular: form.is_popular,
        reading_time,
        author_id: user?.id ?? '00000000-0000-0000-0000-000000000000',
        ...(publish && mode === 'create' ? { view_count: 0, published_at: new Date().toISOString() } : {}),
        ...(publish && mode === 'edit' && !initialData?.published_at ? { published_at: new Date().toISOString() } : {}),
      }

      let savedPostId = postId

      if (mode === 'create') {
        const { data: post, error } = await supabase
          .from('posts')
          .insert({ ...postData, view_count: 0 })
          .select('id')
          .single() as unknown as { data: { id: string } | null; error: Error | null }
        if (error) throw error
        savedPostId = post?.id
      } else {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId!)
        if (error) throw error
      }

      // Sync tags (delete existing, re-insert)
      if (savedPostId && mode === 'edit') {
        await supabase.from('post_tags').delete().eq('post_id', savedPostId)
      }
      if (tags.length > 0 && savedPostId) {
        for (const tagName of tags) {
          const tagSlug = slugify(tagName)
          const { data: existing } = await supabase
            .from('tags').select('id').eq('slug', tagSlug).single() as unknown as { data: { id: string } | null; error: unknown }
          let tagId = existing?.id
          if (!tagId) {
            const { data: newTag } = await supabase
              .from('tags').insert({ name: tagName, slug: tagSlug }).select('id').single() as unknown as { data: { id: string } | null; error: unknown }
            tagId = newTag?.id
          }
          if (tagId) await supabase.from('post_tags').insert({ post_id: savedPostId, tag_id: tagId })
        }
      }

      toast.success(publish ? 'Post published!' : 'Draft saved!')

      // Pre-generate Korean and Chinese translations in background — no await, no blocking
      if (form.language === 'en' && savedPostId) {
        void fetch('/api/ai/pre-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: savedPostId }),
        })
      }

      router.push('/admin/posts')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!postId) return
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('post_tags').delete().eq('post_id', postId)
      const { error } = await supabase.from('posts').delete().eq('id', postId)
      if (error) throw error
      toast.success('Post deleted')
      router.push('/admin/posts')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-[#111827] dark:text-slate-200 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white dark:bg-[#0F172A] transition-shadow'
  const labelClass = 'block text-xs font-semibold text-[#374151] dark:text-slate-300 uppercase tracking-wide mb-2'

  return (
    <AdminLayout>
      <div className="max-w-4xl">

        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/posts"
              className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={15} /> Posts
            </Link>
            <span className="text-[#D1D5DB] dark:text-white/20">/</span>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
              {mode === 'create' ? t('newPost') : 'Edit Post'}
            </h1>
            {mode === 'edit' && initialData?.status && (
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium',
                initialData.status === 'published'
                  ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
              )}>
                {initialData.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {mode === 'edit' && postId && (
              <Link
                href={`/posts/${form.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-sm text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all"
              >
                <Eye size={14} /> Preview
              </Link>
            )}
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-sm text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl border border-[#E5E7EB] dark:border-white/15 text-[#0F172A] dark:text-slate-200 text-sm font-semibold hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {t('saveDraft')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {t('publish')}
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-between gap-4">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              Delete &ldquo;{form.title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-1.5 rounded-lg text-sm text-[#4B5563] dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        {mode === 'edit' && initialData?.published_at && (
          <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mb-6">
            Published {formatDate(initialData.published_at)} · {initialData.view_count ?? 0} views
          </p>
        )}

        <div className="space-y-5">

          {/* ── Title + Slug ─────────────────────────────────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>{t('postTitle')} *</label>
                <button type="button" onClick={() => generateField('title')} disabled={generating.title}
                  className="flex items-center gap-1 text-xs text-[#0EA5E9] dark:text-[#7DD3FC] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-50 transition-colors">
                  {generating.title ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> AI</>}
                </button>
              </div>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className={inputClass}
                placeholder="Enter post title…"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>{t('postSlug')} *</label>
                <button type="button" onClick={() => generateField('slug')} disabled={generating.slug}
                  className="flex items-center gap-1 text-xs text-[#0EA5E9] dark:text-[#7DD3FC] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-50 transition-colors">
                  {generating.slug ? <><Loader2 size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> AI</>}
                </button>
              </div>
              <input
                value={form.slug}
                onChange={e => update('slug', e.target.value)}
                className={cn(inputClass, 'font-mono text-xs')}
                placeholder="post-slug-here"
              />
            </div>
          </section>

          {/* ── Meta: Category / Language / Status / Flags ────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>{t('postCategory')}</label>
                <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('postLanguage')}</label>
                <select value={form.language} onChange={e => update('language', e.target.value)} className={inputClass}>
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('postStatus')}</label>
                <select value={form.status} onChange={e => update('status', e.target.value as 'draft' | 'published')} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => update('is_featured', e.target.checked)} className="accent-[#0F172A] w-4 h-4" />
                {t('postFeatured')}
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => update('is_popular', e.target.checked)} className="accent-[#0F172A] w-4 h-4" />
                {t('postPopular')}
              </label>
            </div>
          </section>

          {/* ── Thumbnail ─────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <label className={labelClass}>Thumbnail Image</label>
            {form.thumbnail_url ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[#F8FAFC] dark:bg-[#0F172A]">
                <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#1E2A3B]/90 backdrop-blur text-xs font-medium text-[#0F172A] dark:text-slate-100 flex items-center gap-1.5 hover:bg-white dark:hover:bg-[#1E2A3B] shadow-sm transition-colors">
                    <Upload size={12} /> Replace
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, thumbnail_url: '' }))}
                    className="p-1.5 rounded-lg bg-white/90 dark:bg-[#1E2A3B]/90 backdrop-blur text-[#6B7280] dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-[#1E2A3B] shadow-sm transition-colors">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleThumbnailDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E7EB] dark:border-white/15 rounded-xl p-10 text-center cursor-pointer hover:border-[#38BDF8] dark:hover:border-[#38BDF8] hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-[#6B7280] dark:text-slate-400">
                    <div className="w-7 h-7 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#6B7280] dark:text-slate-400">
                    <ImagePlus size={28} className="text-[#CBD5E1] dark:text-white/20" />
                    <p className="text-sm font-medium text-[#4B5563] dark:text-slate-300">Click or drag & drop an image</p>
                    <p className="text-xs text-[#9CA3AF] dark:text-slate-500">PNG, JPG, WebP · Max 5 MB</p>
                  </div>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
            <div className="mt-3">
              <p className="text-xs text-[#9CA3AF] dark:text-slate-500 mb-1.5">Or paste an image URL directly:</p>
              <input
                value={form.thumbnail_url}
                onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                className={cn(inputClass, 'text-xs')}
                placeholder="https://…"
              />
            </div>
          </section>

          {/* ── Summary ───────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>{t('postSummary')}</label>
              <button type="button" onClick={generateSummary}
                className="flex items-center gap-1 text-xs text-[#0EA5E9] dark:text-[#7DD3FC] hover:text-[#0F172A] dark:hover:text-white transition-colors">
                <Wand2 size={12} /> {t('generateSummary')}
              </button>
            </div>
            <textarea
              value={form.summary}
              onChange={e => update('summary', e.target.value)}
              className={cn(inputClass, 'resize-y leading-relaxed')}
              rows={3}
              placeholder="Brief summary shown on cards and as the article lead…"
            />
          </section>

          {/* ── Rich Text Content Editor ──────────────────────── */}
          <section>
            <label className={cn(labelClass, 'mb-3')}>
              {t('postContent')} *
            </label>
            <RichEditor
              value={form.content}
              onChange={html => update('content', html)}
              placeholder="Write your article here. Use the toolbar above to format headings, lists, code blocks, and more. Drag & drop images directly into the editor."
            />
          </section>

          {/* ── Tags + Source ─────────────────────────────────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-4">
            <div>
              <label className={labelClass}>{t('postTags')} <span className="normal-case font-normal text-[#9CA3AF] dark:text-slate-500">(comma-separated)</span></label>
              <input
                value={form.tags}
                onChange={e => update('tags', e.target.value)}
                className={inputClass}
                placeholder="market-structure, data-strategy, ai"
              />
            </div>
            <div>
              <label className={labelClass}>Source URL <span className="normal-case font-normal text-[#9CA3AF] dark:text-slate-500">(optional)</span></label>
              <input
                value={form.source_url}
                onChange={e => update('source_url', e.target.value)}
                className={inputClass}
                placeholder="https://original-source.com/article"
              />
            </div>
          </section>

          {/* ── SEO ───────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#1E2A3B] rounded-2xl border border-[#E5E7EB] dark:border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#0F172A] dark:text-white uppercase tracking-wide">SEO Settings</h3>
              <button type="button" onClick={() => generateField('all')}
                disabled={generating.seo_title || generating.seo_description}
                className="flex items-center gap-1.5 text-xs font-medium text-white dark:text-[#0B1120] bg-[#0F172A] dark:bg-[#38BDF8] hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                {(generating.seo_title || generating.seo_description)
                  ? <><Loader2 size={11} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={11} /> Generate All with AI</>}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postSeoTitle')}</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => generateField('seo_title')} disabled={generating.seo_title}
                    className="flex items-center gap-1 text-xs text-[#0EA5E9] dark:text-[#7DD3FC] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-50 transition-colors">
                    {generating.seo_title ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate
                  </button>
                  <span className={cn('text-xs', form.seo_title.length > 60 ? 'text-amber-500' : 'text-[#9CA3AF] dark:text-slate-500')}>
                    {form.seo_title.length}/60
                  </span>
                </div>
              </div>
              <input
                value={form.seo_title}
                onChange={e => updateSeo('seo_title', e.target.value)}
                className={cn(inputClass, form.seo_title.length > 60 ? 'border-amber-400 focus:ring-amber-400' : '')}
                placeholder="SEO title (defaults to post title)"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postSeoDesc')}</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => generateField('seo_description')} disabled={generating.seo_description}
                    className="flex items-center gap-1 text-xs text-[#0EA5E9] dark:text-[#7DD3FC] hover:text-[#0F172A] dark:hover:text-white disabled:opacity-50 transition-colors">
                    {generating.seo_description ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate
                  </button>
                  <span className={cn('text-xs', form.seo_description.length > 160 ? 'text-amber-500' : 'text-[#9CA3AF] dark:text-slate-500')}>
                    {form.seo_description.length}/160
                  </span>
                </div>
              </div>
              <textarea
                value={form.seo_description}
                onChange={e => updateSeo('seo_description', e.target.value)}
                className={cn(inputClass, 'resize-y', form.seo_description.length > 160 ? 'border-amber-400 focus:ring-amber-400' : '')}
                rows={2}
                placeholder="SEO description (max 160 chars)"
              />
              {(seoEdited.title || seoEdited.description) && (
                <button type="button"
                  onClick={() => {
                    setSeoEdited({ title: false, description: false })
                    setForm(prev => ({
                      ...prev,
                      seo_title: prev.title,
                      seo_description: prev.summary.slice(0, 160) || prev.content.replace(/<[^>]+>/g, '').slice(0, 160),
                    }))
                  }}
                  className="text-xs text-[#9CA3AF] dark:text-slate-500 hover:text-[#0F172A] dark:hover:text-white mt-1.5 transition-colors">
                  ↺ Reset to auto-fill
                </button>
              )}
            </div>
          </section>

        </div>

        {/* Bottom save bar */}
        <div className="mt-8 flex justify-end gap-3 pb-8">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#E5E7EB] text-[#0F172A] text-sm font-semibold hover:bg-[#F8FAFC] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {t('saveDraft')}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {t('publish')}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}