'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-[20vh] right-8 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F172A] text-white dark:bg-[#1E2A3B] text-xs font-semibold shadow-lg hover:bg-[#1E3A5F] dark:hover:bg-[#0F172A] active:scale-95 border border-[#D1D5DB] dark:border-white/15 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp size={14} />
      Top
    </button>
  )
}
