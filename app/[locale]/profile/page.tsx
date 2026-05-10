'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'

interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

export default function ProfilePage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data as Profile)
        setDisplayName(data.display_name || '')
      }
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', profile.id)
    if (error) toast.error('Failed to update profile')
    else toast.success('Profile updated!')
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#6B7280]">Loading...</div>
  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-8">{t('profile')}</h1>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-navy flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">{profile.display_name || 'User'}</p>
              <p className="text-sm text-[#6B7280]">{profile.email}</p>
              <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-1', profile.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-[#F8FAFC] text-[#6B7280]')}>
                {profile.role}
              </span>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5 flex items-center gap-1.5">
              <User size={14} /> {t('displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5 flex items-center gap-1.5">
              <Mail size={14} /> {t('email')}
            </label>
            <input value={profile.email} readOnly className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm bg-[#F8FAFC] text-[#6B7280]" />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-navy text-white font-semibold text-sm hover:opacity-90 transition-all"
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#6B7280] hover:text-[#0F172A] transition-colors">← Back to site</Link>
        </div>
      </div>
    </div>
  )
}
