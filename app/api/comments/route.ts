import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('comments')
      .select('*, user:profiles(display_name, avatar_url)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .eq('is_private', false)
      .order('created_at', { ascending: true })
    return NextResponse.json({ comments: data || [] })
  } catch (err) {
    console.error('Error fetching comments:', err)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { post_id, content, is_private, parent_id } = body as {
    post_id?: string; content?: string; is_private?: boolean; parent_id?: string | null
  }

  if (!post_id || !content) {
    return NextResponse.json({ error: 'post_id and content are required' }, { status: 400 })
  }
  if (!UUID_RE.test(post_id)) {
    return NextResponse.json({ error: 'Comments are only available on published posts.' }, { status: 400 })
  }
  if (typeof content !== 'string' || content.trim().length < 1) {
    return NextResponse.json({ error: 'Comment is too short' }, { status: 400 })
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 })
  }

  const trimmed = content.trim().slice(0, 2000)
  // Public comments are auto-approved; private ones stay pending for admin review
  const status = is_private ? 'pending' : 'approved'

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('comments').insert({
      post_id,
      user_id: user.id,
      content: trimmed,
      status,
      is_private: is_private === true,
      parent_id: parent_id || null,
    }).select('*, user:profiles(display_name, avatar_url)').single()

    if (error) throw error
    return NextResponse.json({ success: true, comment: data })
  } catch (err) {
    console.error('Error inserting comment:', err)
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { id?: string; status?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const valid = ['approved', 'pending', 'hidden', 'deleted']
  if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  try {
    const admin = createAdminClient()
    const { error } = await admin.from('comments').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating comment:', err)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}
