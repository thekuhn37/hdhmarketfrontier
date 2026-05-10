'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils/cn'

const NAV_LINKS = [
  { key: 'markets', href: '/markets' },
  { key: 'data', href: '/data' },
  { key: 'ai', href: '/ai' },
  { key: 'digitalAssets', href: '/digital-assets' },
]

interface User {
  id: string
  email?: string
  display_name?: string
  avatar_url?: string
  role?: string
}

interface HeaderProps {
  user?: User | null
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations('nav')
  const tLang = useTranslations('lang')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as 'en' | 'ko' | 'zh' })
    setLangOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm'
          : 'bg-white/70 backdrop-blur-md'
      )}
    >
      <div className="content-width">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg gradient-navy flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-[#0F172A] text-lg hidden sm:block tracking-tight">
              HDH<span className="text-[#38BDF8]"> Market</span> Frontier
            </span>
            <span className="font-bold text-[#0F172A] text-lg sm:hidden tracking-tight">
              HDH<span className="text-[#38BDF8]">MF</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  'text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                )}
              >
                {t(key as 'markets' | 'data' | 'ai' | 'digitalAssets')}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              aria-label={t('search')}
            >
              <Search size={18} />
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              >
                {tLang(locale as 'en' | 'ko' | 'zh')}
                <ChevronDown size={14} className={cn('transition-transform', langOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden min-w-[100px]"
                  >
                    {routing.locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left hover:bg-[#F8FAFC] transition-colors',
                          loc === locale ? 'text-[#0F172A] font-semibold' : 'text-[#4B5563]'
                        )}
                      >
                        {tLang(loc as 'en' | 'ko' | 'zh')}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F8FAFC] transition-all"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full gradient-navy flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(user.display_name || user.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <ChevronDown size={14} className={cn('text-[#6B7280] transition-transform', userMenuOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-[#E5E7EB] rounded-xl shadow-lg overflow-hidden min-w-[180px]"
                    >
                      <div className="px-4 py-3 border-b border-[#E5E7EB]">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{user.display_name || 'User'}</p>
                        <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} /> {t('profile')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard size={15} /> {t('admin')}
                        </Link>
                      )}
                      <form action="/api/auth/logout" method="POST">
                        <button
                          type="submit"
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} /> {t('logout')}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E3A5F] transition-all"
              >
                {t('login')}
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="content-width py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(key as 'markets' | 'data' | 'ai' | 'digitalAssets')}
                </Link>
              ))}
              <div className="border-t border-[#E5E7EB] mt-2 pt-2">
                {!user && (
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-4 py-3 rounded-lg bg-[#0F172A] text-white text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('login')}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xl"
            >
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, topics, tags..."
                  className="w-full px-6 py-4 pr-14 rounded-2xl bg-white border border-[#E5E7EB] text-[#0F172A] text-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#4B5563] hover:text-[#0F172A]"
                >
                  <Search size={20} />
                </button>
              </form>
              <button
                onClick={() => setSearchOpen(false)}
                className="mt-4 mx-auto block text-white/70 hover:text-white text-sm transition-colors"
              >
                Press ESC to close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close dropdowns on outside click */}
      {(langOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setLangOpen(false); setUserMenuOpen(false) }}
        />
      )}
    </header>
  )
}
