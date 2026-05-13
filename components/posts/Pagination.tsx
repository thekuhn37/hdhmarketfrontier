import Link from 'next/link'

interface Props {
  currentPage: number
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null

  function href(page: number) {
    return page === 1 ? basePath : `${basePath}?page=${page}`
  }

  // Show at most 5 page numbers centred around currentPage
  const delta = 2
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const navLinkClass =
    'px-4 py-2 rounded-lg border border-[#E5E7EB] dark:border-white/10 text-sm text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white transition-colors'

  const pageBtnClass =
    'w-10 h-10 rounded-lg flex items-center justify-center text-sm border border-[#E5E7EB] dark:border-white/10 text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white transition-colors'

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
      {currentPage > 1 && (
        <Link href={href(currentPage - 1)} className={navLinkClass}>
          Previous
        </Link>
      )}

      {start > 1 && (
        <>
          <Link href={href(1)} className={pageBtnClass}>1</Link>
          {start > 2 && <span className="text-[#9CA3AF] dark:text-slate-500 text-sm px-1">…</span>}
        </>
      )}

      {pages.map(page => (
        <Link
          key={page}
          href={href(page)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-[#0F172A] text-white dark:bg-[#38BDF8] dark:text-[#0B1120]'
              : 'border border-[#E5E7EB] dark:border-white/10 text-[#4B5563] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-white/5 hover:text-[#0F172A] dark:hover:text-white'
          }`}
        >
          {page}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-[#9CA3AF] dark:text-slate-500 text-sm px-1">…</span>}
          <Link href={href(totalPages)} className={pageBtnClass}>{totalPages}</Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link href={href(currentPage + 1)} className={navLinkClass}>
          Next
        </Link>
      )}
    </nav>
  )
}
