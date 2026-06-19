import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Reads the authenticated user and their role via the Supabase server client
// (request cookies). force-dynamic applies across the whole /admin route
// subtree, so no admin page is ever statically prerendered.
export const dynamic = 'force-dynamic'

export default async function AdminProtectedLayout({ children, params }: Props) {
  const { locale } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(`/${locale}`)

  return <>{children}</>
}
