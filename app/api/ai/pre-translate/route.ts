import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { translatePost } from '@/lib/ai/translate'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { post_id?: string }
  if (!body.post_id) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: post } = await admin
    .from('posts')
    .select('id, title, summary, content, language')
    .eq('id', body.post_id)
    .single() as unknown as { data: { id: string; title: string; summary: string | null; content: string; language: string } | null }

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.language !== 'en') return NextResponse.json({ ok: true, skipped: true })

  const input = { title: post.title, summary: post.summary, content: post.content }

  const [ko, zh] = await Promise.all([
    translatePost(input, 'ko'),
    translatePost(input, 'zh'),
  ])

  await Promise.all([
    ko.isAI ? admin.from('post_translations').upsert(
      { post_id: post.id, locale: 'ko', title: ko.title, summary: ko.summary, content: ko.content },
      { onConflict: 'post_id,locale' }
    ) : Promise.resolve(),
    zh.isAI ? admin.from('post_translations').upsert(
      { post_id: post.id, locale: 'zh', title: zh.title, summary: zh.summary, content: zh.content },
      { onConflict: 'post_id,locale' }
    ) : Promise.resolve(),
  ])

  return NextResponse.json({ ok: true })
}
