'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, ChevronDown, User, LogOut, LayoutDashboard, FlaskConical } from 'lucide-react'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'


const NAV_LINKS = [
  { key: 'about', href: '/about' },
  { key: 'markets', href: '/markets' },
  { key: 'data', href: '/data' },
  { key: 'infrastructure', href: '/infrastructure' },
  { key: 'ai', href: '/ai' },
  { key: 'digitalAssets', href: '/digital-assets' },
]

interface AuthUser {
  id: string
  email?: string
  display_name?: string | null
  avatar_url?: string | null
  role?: string
}

export default function Header() {
  const t = useTranslations('nav')
  const tLang = useTranslations('lang')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, role')
        .eq('id', userId)
        .single()
      if (data) {
        setCurrentUser(data as AuthUser)
      } else {
        setCurrentUser({ id: userId, email: email ?? '' })
      }
    } catch {
      setCurrentUser({ id: userId, email: email ?? '' })
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id, session.user.email)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCurrentUser(null)
    setUserMenuOpen(false)
    router.push('/')
  }

  const displayName = currentUser
    ? (currentUser.display_name || currentUser.email?.split('@')[0] || 'User')
    : null

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as 'en' | 'ko' | 'zh' })
    setLangOpen(false)
  }

  const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
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
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#F1F5F9] dark:bg-[#0F172A]/95 dark:border-white/5'
          : 'bg-white/70 backdrop-blur-md border-b border-transparent dark:bg-[#0F172A]/70'
      )}
    >
      <div className="content-width">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => {
              if (pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                router.push('/')
              }
            }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg gradient-navy flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-[#0F172A] dark:text-white text-lg hidden sm:block tracking-tight">
              HDH<span className="text-[#38BDF8]"> Market</span> Frontier
            </span>
            <span className="font-bold text-[#0F172A] dark:text-white text-lg sm:hidden tracking-tight">
              HDH<span className="text-[#38BDF8]">MF</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  'text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC]',
                  'dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
                )}
              >
                {t(key as 'about' | 'markets' | 'data' | 'infrastructure' | 'ai' | 'digitalAssets')}
              </Link>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-all"
              aria-label={t('search')}
            >
              <Search size={18} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#4B5563] hover:text-[#0F172A] hover:bg-[#F8FAFC] dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-all"
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
                    className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 rounded-xl shadow-lg overflow-hidden min-w-[100px]"
                  >
                    {routing.locales.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors',
                          loc === locale ? 'text-[#0F172A] dark:text-white font-semibold' : 'text-[#4B5563] dark:text-slate-300'
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
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all"
                >
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full gradient-navy flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {(displayName || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-[#0F172A] dark:text-white max-w-[120px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown size={14} className={cn('text-[#6B7280] dark:text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 rounded-xl shadow-lg overflow-hidden min-w-[180px]"
                    >
                      <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-white/10">
                        <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{displayName}</p>
                        <p className="text-xs text-[#6B7280] dark:text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={15} /> {t('profile')}
                      </Link>
                      {currentUser.role === 'admin' && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard size={15} /> {t('admin')}
                          </Link>
                          <Link
                            href="/admin/pioneer-lab"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#38BDF8] hover:bg-[#F0F9FF] dark:hover:bg-[#38BDF8]/10 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FlaskConical size={15} /> Pioneer Lab
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={15} /> {t('logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-medium hover:bg-[#1E3A5F] dark:hover:bg-[#7DD3FC] transition-all"
              >
                {t('login')}
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all"
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
            className="md:hidden border-t border-[#E5E7EB] dark:border-white/5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="content-width py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-all"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(key as 'about' | 'markets' | 'data' | 'infrastructure' | 'ai' | 'digitalAssets')}
                </Link>
              ))}
              <div className="border-t border-[#E5E7EB] dark:border-white/5 mt-2 pt-2">
                {!currentUser && (
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-4 py-3 rounded-lg bg-[#0F172A] dark:bg-[#38BDF8] text-white dark:text-[#0B1120] text-sm font-medium"
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
                  className="w-full px-6 py-4 pr-14 rounded-2xl bg-white dark:bg-[#1E2A3B] border border-[#E5E7EB] dark:border-white/10 text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] dark:placeholder:text-slate-500 text-lg shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#4B5563] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white"
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
