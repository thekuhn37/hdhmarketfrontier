'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import {
  LayoutDashboard, FileText, MessageSquare, Users, BarChart2,
  Mail, BrainCircuit, Settings, ArrowLeft, Menu, X, FlaskConical, Briefcase, Scale
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const NAV = [
  { key: 'dashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'posts', href: '/admin/posts', icon: FileText },
  { key: 'comments', href: '/admin/comments', icon: MessageSquare },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'analytics', href: '/admin/analytics', icon: BarChart2 },
  { key: 'contactMessages', href: '/admin/contact-messages', icon: Mail },
  { key: 'aiDrafts', href: '/admin/ai-drafts', icon: BrainCircuit },
  { key: 'settings', href: '/admin/settings', icon: Settings },
]

const PIONEER_NAV = [
  { label: 'Job Market Today', href: '/admin/pioneer-lab/job-market-today', icon: Briefcase },
  { label: 'Data License Benchmark', href: '/admin/pioneer-lab/data-license-benchmark', icon: Scale },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin')
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin' || pathname === '/en/admin'
    return pathname.includes(href.replace('/admin', ''))
  }

  const SidebarContent = () => (
    <>
      <div className="px-6 py-5 border-b border-[#E5E7EB] dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-navy flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <span className="font-bold text-[#0F172A] dark:text-white text-sm">Admin Panel</span>
        </div>
      </div>
      <nav className="px-3 py-4 flex-1">
        {NAV.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all',
              isActive(href)
                ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]'
                : 'text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
            )}
          >
            <Icon size={16} />
            {t(key as keyof typeof t)}
          </Link>
        ))}
        {/* Pioneer Lab section */}
        <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-white/10">
          <Link
            href="/admin/pioneer-lab"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider mb-1 transition-all',
              pathname.includes('/admin/pioneer-lab')
                ? 'text-[#38BDF8]'
                : 'text-[#6B7280] dark:text-slate-500 hover:text-[#0F172A] dark:hover:text-white'
            )}
          >
            <FlaskConical size={13} /> Pioneer Lab
          </Link>
          {PIONEER_NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium mb-0.5 ml-1 transition-all',
                isActive(href)
                  ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]'
                  : 'text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
              )}
            >
              <Icon size={15} /> {label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="px-3 py-4 border-t border-[#E5E7EB] dark:border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#4B5563] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white transition-all"
        >
          <ArrowLeft size={16} /> Back to Site
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-[#0F172A] border-r border-[#E5E7EB] dark:border-white/10 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Mobile sidebar */}
      <aside className={cn(
        'lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-[#0F172A] border-r border-[#E5E7EB] dark:border-white/10 z-50 flex flex-col transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E7EB] dark:border-white/10">
          <span className="font-bold text-[#0F172A] dark:text-white text-sm">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 text-[#4B5563] dark:text-slate-300">
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-56">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-[#E5E7EB] dark:border-white/10 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-white/5 text-[#4B5563] dark:text-slate-300">
            <Menu size={18} />
          </button>
          <span className="font-bold text-[#0F172A] dark:text-white text-sm">Admin Panel</span>
        </div>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
