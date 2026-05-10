'use client'

import { useState, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils/format'
import { calculateReadingTime } from '@/lib/utils/reading-time'
import { cn } from '@/lib/utils/cn'
import toast from 'react-hot-toast'
import { Save, Send, Wand2, Upload, X, ImagePlus, Sparkles, Loader2 } from 'lucide-react'

const CATEGORIES = ['Markets', 'Data', 'Infrastructure', 'AI', 'Digital Assets']
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
]

export default function NewPostPage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track whether SEO fields were manually edited so auto-fill doesn't overwrite them
  const [seoEdited, setSeoEdited] = useState({ title: false, description: false })
  // Per-field AI generation loading state
  const [generating, setGenerating] = useState({
    title: false, slug: false, seo_title: false, seo_description: false,
  })

  const [form, setForm] = useState({
    title: '', slug: '', category: 'Markets', language: 'en',
    status: 'draft' as 'draft' | 'published',
    summary: '', content: '', seo_title: '', seo_description: '',
    thumbnail_url: '', source_url: '', tags: '',
    is_featured: false, is_popular: false,
  })

  const update = (key: string, value: string | boolean) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }

      // Auto-generate slug from title
      if (key === 'title' && !prev.slug) next.slug = slugify(value as string)

      // Auto-fill SEO title from post title
      if (key === 'title' && !seoEdited.title) next.seo_title = value as string

      // Auto-fill SEO description from summary (preferred source)
      if (key === 'summary' && !seoEdited.description) {
        next.seo_description = (value as string).slice(0, 160)
      }

      // Auto-fill SEO description from content if no summary yet
      if (key === 'content' && !prev.summary && !seoEdited.description) {
        const plainText = (value as string)
          .replace(/<[^>]+>/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/\*\*/g, '')
          .trim()
        next.seo_description = plainText.slice(0, 160)
      }

      return next
    })
  }

  // Separate handler for SEO fields so editing them marks them as manually set
  const updateSeo = (key: 'seo_title' | 'seo_description', value: string) => {
    setSeoEdited(prev => ({
      ...prev,
      [key === 'seo_title' ? 'title' : 'description']: true,
    }))
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    await uploadThumbnail(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) await uploadThumbnail(file)
  }

  const uploadThumbnail = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(path)
      setForm(prev => ({ ...prev, thumbnail_url: publicUrl }))
      toast.success('Image uploaded!')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Upload failed — make sure the "thumbnails" bucket exists in Supabase Storage and is set to public.'
      )
    } finally {
      setUploading(false)
    }
  }

  const generateSummary = async () => {
    if (!form.content) { toast.error('Add content first'); return }
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })
      const { summary } = await res.json()
      if (summary) {
        update('summary', summary)
        toast.success('Summary generated!')
      }
    } catch {
      toast.error('Summary generation failed. Please write manually.')
    }
  }

  // Generate a specific field (or all fields) from content via AI
  const generateField = async (field: 'title' | 'slug' | 'seo_title' | 'seo_description' | 'all') => {
    if (!form.content) { toast.error('Write some content first'); return }
    const fields = field === 'all'
      ? ['title', 'slug', 'seo_title', 'seo_description'] as const
      : [field] as const
    setGenerating(prev => Object.fromEntries(fields.map(f => [f, true])) as typeof prev)
    try {
      const res = await fetch('/api/ai/generate-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: form.content }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json() as Record<string, string>
      setForm(prev => {
        const next = { ...prev }
        if (fields.includes('title') && data.title) {
          next.title = data.title
          if (!prev.slug) next.slug = data.slug || prev.slug
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
      const reading_time = calculateReadingTime(form.content)

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
        view_count: 0,
        author_id: user?.id || '00000000-0000-0000-0000-000000000000',
        published_at: publish ? new Date().toISOString() : null,
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single() as unknown as { data: { id: string } | null; error: Error | null }
      if (error) throw error

      if (tags.length > 0 && post) {
        for (const tagName of tags) {
          const tagSlug = slugify(tagName)
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', tagSlug)
            .single() as unknown as { data: { id: string } | null; error: unknown }
          let tagId = existingTag?.id
          if (!tagId) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName, slug: tagSlug })
              .select()
              .single() as unknown as { data: { id: string } | null; error: unknown }
            tagId = newTag?.id
          }
          if (tagId) {
            await supabase.from('post_tags').insert({ post_id: post.id, tag_id: tagId })
          }
        }
      }

      toast.success(publish ? 'Post published!' : 'Draft saved!')
      router.push('/admin/posts')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]'
  const labelClass = 'block text-sm font-medium text-[#111827] mb-1.5'

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('newPost')}</h1>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-[#0F172A] text-sm font-semibold hover:bg-[#F8FAFC] transition-all disabled:opacity-50"
            >
              <Save size={15} /> {t('saveDraft')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-navy text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={15} /> {t('publish')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Title + Slug */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postTitle')} *</label>
                <button
                  type="button"
                  onClick={() => generateField('title')}
                  disabled={generating.title}
                  className="flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:text-[#0F172A] disabled:opacity-50 transition-colors"
                >
                  {generating.title
                    ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                    : <><Sparkles size={12} /> Generate with AI</>}
                </button>
              </div>
              <input
                value={form.title}
                onChange={e => update('title', e.target.value)}
                className={inputClass}
                placeholder="Enter post title..."
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postSlug')} *</label>
                <button
                  type="button"
                  onClick={() => generateField('slug')}
                  disabled={generating.slug}
                  className="flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:text-[#0F172A] disabled:opacity-50 transition-colors"
                >
                  {generating.slug
                    ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                    : <><Sparkles size={12} /> Generate with AI</>}
                </button>
              </div>
              <input
                value={form.slug}
                onChange={e => update('slug', e.target.value)}
                className={inputClass}
                placeholder="post-slug-here"
              />
            </div>
          </div>

          {/* Category, Language, Status */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <select value={form.status} onChange={e => update('status', e.target.value)} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => update('is_featured', e.target.checked)} className="accent-[#0F172A]" />
                {t('postFeatured')}
              </label>
              <label className="flex items-center gap-2 text-sm text-[#4B5563] cursor-pointer">
                <input type="checkbox" checked={form.is_popular} onChange={e => update('is_popular', e.target.checked)} className="accent-[#0F172A]" />
                {t('postPopular')}
              </label>
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <label className={labelClass}>Thumbnail Image</label>

            {form.thumbnail_url ? (
              /* Preview */
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[#F8FAFC]">
                <img
                  src={form.thumbnail_url}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur text-xs font-medium text-[#0F172A] flex items-center gap-1.5 hover:bg-white transition-colors shadow-sm"
                  >
                    <Upload size={13} /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, thumbnail_url: '' }))}
                    className="p-1.5 rounded-lg bg-white/90 backdrop-blur text-[#6B7280] hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-10 text-center cursor-pointer hover:border-[#38BDF8] hover:bg-[#F8FAFC] transition-all"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-[#6B7280]">
                    <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#6B7280]">
                    <ImagePlus size={32} className="text-[#CBD5E1]" />
                    <p className="text-sm font-medium text-[#4B5563]">Click or drag & drop an image</p>
                    <p className="text-xs text-[#9CA3AF]">PNG, JPG, WebP · Max 5 MB</p>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Manual URL fallback */}
            <div className="mt-3">
              <p className="text-xs text-[#9CA3AF] mb-1.5">Or paste an image URL directly:</p>
              <input
                value={form.thumbnail_url}
                onChange={e => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className={cn(inputClass, 'text-xs')}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>{t('postSummary')}</label>
              <button
                type="button"
                onClick={generateSummary}
                className="flex items-center gap-1.5 text-xs text-[#0EA5E9] hover:text-[#0F172A] transition-colors"
              >
                <Wand2 size={13} /> {t('generateSummary')}
              </button>
            </div>
            <textarea
              value={form.summary}
              onChange={e => update('summary', e.target.value)}
              className={cn(inputClass, 'resize-y')}
              rows={3}
              placeholder="Brief summary of the post..."
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
            <label className={labelClass}>{t('postContent')} * (Markdown supported)</label>
            <textarea
              value={form.content}
              onChange={e => update('content', e.target.value)}
              className={cn(inputClass, 'resize-y font-mono text-xs')}
              rows={20}
              placeholder="Write your content in Markdown or HTML..."
            />
          </div>

          {/* Tags + Source */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
            <div>
              <label className={labelClass}>{t('postTags')} (comma-separated)</label>
              <input
                value={form.tags}
                onChange={e => update('tags', e.target.value)}
                className={inputClass}
                placeholder="market-structure, data-strategy, ai"
              />
            </div>
            <div>
              <label className={labelClass}>Source URL (optional)</label>
              <input
                value={form.source_url}
                onChange={e => update('source_url', e.target.value)}
                className={inputClass}
                placeholder="https://original-source.com/article"
              />
            </div>
          </div>

          {/* SEO — auto-filled, manually overridable */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#0F172A]">SEO Settings</h3>
              <button
                type="button"
                onClick={() => generateField('all')}
                disabled={generating.seo_title || generating.seo_description}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#0F172A] hover:bg-[#1E3A5F] disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {(generating.seo_title || generating.seo_description)
                  ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={12} /> Generate All with AI</>}
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postSeoTitle')}</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => generateField('seo_title')}
                    disabled={generating.seo_title}
                    className="flex items-center gap-1 text-xs text-[#0EA5E9] hover:text-[#0F172A] disabled:opacity-50 transition-colors"
                  >
                    {generating.seo_title
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Sparkles size={11} />}
                    Generate
                  </button>
                  <span className="text-xs text-[#9CA3AF]">{form.seo_title.length}/60</span>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t('postSeoDesc')}</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => generateField('seo_description')}
                    disabled={generating.seo_description}
                    className="flex items-center gap-1 text-xs text-[#0EA5E9] hover:text-[#0F172A] disabled:opacity-50 transition-colors"
                  >
                    {generating.seo_description
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Sparkles size={11} />}
                    Generate
                  </button>
                  <span className={cn('text-xs', form.seo_description.length > 160 ? 'text-amber-500' : 'text-[#9CA3AF]')}>
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
                <button
                  type="button"
                  onClick={() => {
                    setSeoEdited({ title: false, description: false })
                    setForm(prev => ({
                      ...prev,
                      seo_title: prev.title,
                      seo_description: prev.summary.slice(0, 160) || prev.content.replace(/<[^>]+>/g, '').slice(0, 160),
                    }))
                  }}
                  className="text-xs text-[#9CA3AF] hover:text-[#0F172A] mt-1.5 transition-colors"
                >
                  ↺ Reset to auto-fill
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}