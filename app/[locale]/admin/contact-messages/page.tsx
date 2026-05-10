import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/format'
import { Mail } from 'lucide-react'

interface Props { params: Promise<{ locale: string }> }

async function requireAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/')
  } catch { if (process.env.NODE_ENV === 'production') redirect('/login') }
}

export default async function AdminContactMessagesPage({ params }: Props) {
  const { locale } = await params
  await requireAdmin()
  const t = await getTranslations({ locale, namespace: 'admin' })

  let messages: { id: string; name: string; email: string; organization: string | null; subject: string; message: string; status: string; created_at: string }[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    messages = data || []
  } catch {}

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-8">{t('contactMessages')}</h1>
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-[#0F172A]">{msg.subject}</h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      From <strong>{msg.name}</strong>
                      {msg.organization && ` — ${msg.organization}`}
                      {' · '}<a href={`mailto:${msg.email}`} className="text-[#0EA5E9]">{msg.email}</a>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${msg.status === 'unread' ? 'bg-blue-50 text-blue-600' : 'bg-[#F8FAFC] text-[#6B7280]'}`}>
                      {msg.status}
                    </span>
                    <p className="text-xs text-[#6B7280] mt-1">{formatDate(msg.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-[#4B5563] leading-relaxed bg-[#F8FAFC] rounded-xl p-4 whitespace-pre-wrap">{msg.message}</p>
                <div className="mt-3 flex gap-2">
                  <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-[#0EA5E9] border border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors">
                    <Mail size={14} /> Reply
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] py-16 text-center text-[#6B7280]">
              {t('noMessages')}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
