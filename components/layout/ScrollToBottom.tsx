'use client'

import { useEffect, useState } from 'react'
import { ArrowDown } from 'lucide-react'

export default function ScrollToBottom() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const atBottom = window.innerHeight + scrolled >= document.documentElement.scrollHeight - 40
      setVisible(scrolled > 400 && !atBottom)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
      aria-label="Go to bottom"
      className={`fixed bottom-[12vh] right-8 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F172A] text-white dark:bg-[#1E2A3B] text-xs font-semibold shadow-lg hover:bg-[#1E3A5F] dark:hover:bg-[#0F172A] active:scale-95 border border-[#D1D5DB] dark:border-white/15 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowDown size={14} />
      Bottom
    </button>
  )
}
