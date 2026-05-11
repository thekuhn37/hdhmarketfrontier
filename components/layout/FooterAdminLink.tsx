'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FooterAdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const checkAdmin = async (userId: string | undefined) => {
      if (!userId) { setIsAdmin(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      setIsAdmin(data?.role === 'admin')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdmin(session?.user?.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdmin(session?.user?.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!isAdmin) return null

  return (
    <li>
      <Link
        href="/admin"
        className="text-white/60 hover:text-white text-sm transition-colors"
      >
        Admin Dashboard
      </Link>
    </li>
  )
}
