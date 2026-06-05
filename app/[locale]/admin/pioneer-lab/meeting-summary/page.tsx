import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MeetingSummary from '@/components/admin/pioneer-lab/MeetingSummary'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function MeetingSummaryPage({ params }: Props) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${locale}`)

  return <MeetingSummary />
}
