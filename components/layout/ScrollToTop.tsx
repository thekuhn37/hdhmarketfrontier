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

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold shadow-lg hover:bg-[#1E3A5F] active:scale-95 transition-all duration-200"
    >
      <ArrowUp size={14} />
      Top
    </button>
  )
}