import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import JobMarketToday from '@/components/admin/pioneer-lab/JobMarketToday'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function JobMarketTodayPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${locale}`)

  return <JobMarketToday />
}
