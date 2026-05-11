import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostEditor from '@/components/admin/PostEditor'

interface Props {
  params: Promise<{ locale: string; id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data } = await supabase
    .from('posts')
    .select('*, tags:post_tags(tag:tags(*))')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const post = data as unknown as {
    title: string; slug: string; category: string; language: string
    status: string; summary: string | null; content: string
    seo_title: string | null; seo_description: string | null
    thumbnail_url: string | null; source_url: string | null
    is_featured: boolean; is_popular: boolean
    published_at: string | null; view_count: number
    tags: { tag: { name: string } }[]
  }

  const tagNames = (post.tags ?? []).map(t => t.tag.name).join(', ')

  const initialData = {
    title: post.title,
    slug: post.slug,
    category: post.category,
    language: post.language,
    status: post.status as 'draft' | 'published',
    summary: post.summary ?? '',
    content: post.content,
    seo_title: post.seo_title ?? '',
    seo_description: post.seo_description ?? '',
    thumbnail_url: post.thumbnail_url ?? '',
    source_url: post.source_url ?? '',
    tags: tagNames,
    is_featured: post.is_featured,
    is_popular: post.is_popular,
    published_at: post.published_at,
    view_count: post.view_count,
  }

  return <PostEditor mode="edit" initialData={initialData} postId={id} />
}
