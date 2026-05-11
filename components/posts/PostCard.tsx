import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Clock, Eye, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { Post } from '@/lib/supabase/types'

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  markets: { bg: 'rgba(15,23,42,0.06)', text: '#0F172A' },
  data: { bg: 'rgba(30,58,95,0.06)', text: '#1E3A5F' },
  infrastructure: { bg: 'rgba(3,105,161,0.06)', text: '#0369A1' },
  ai: { bg: 'rgba(124,58,237,0.06)', text: '#7C3AED' },
  'digital-assets': { bg: 'rgba(5,150,105,0.06)', text: '#059669' },
}

interface PostCardProps {
  post: Post
  variant?: 'default' | 'compact' | 'featured'
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const t = useTranslations('posts')
  const catKey = post.category.toLowerCase().replace(/\s+/g, '-')
  const catStyle = CATEGORY_STYLES[catKey] || { bg: 'rgba(107,114,128,0.08)', text: '#4B5563' }

  if (variant === 'compact') {
    return (
      <Link href={`/posts/${post.slug}`} className="group flex gap-4 py-4 border-b border-[#E5E7EB] last:border-0">
        {post.thumbnail_url && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold capitalize" style={{ color: catStyle.text }}>
            {post.category}
          </span>
          <h3 className="text-sm font-semibold text-[#0F172A] leading-snug mt-0.5 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {t('readingTime', { minutes: post.reading_time })}
            </span>
            {post.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} />
                {post.view_count}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={`/posts/${post.slug}`} className="group relative block rounded-3xl overflow-hidden h-96 cursor-pointer">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/20 via-[#0F172A]/65 to-[#0F172A]/95"
          style={{ zIndex: 1 }}
        />
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 gradient-navy" />
        )}
        <div className="absolute inset-0 p-8 flex flex-col justify-end" style={{ zIndex: 2 }}>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 self-start capitalize"
            style={{ background: catStyle.bg, color: catStyle.text, backdropFilter: 'blur(8px)' }}
          >
            {post.category}
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight mb-2 group-hover:text-[#38BDF8] transition-colors">
            {post.title}
          </h2>
          {post.summary && (
            <p className="text-white/80 text-sm line-clamp-2 mb-4">{post.summary}</p>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-white/60 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {post.published_at ? formatDate(post.published_at) : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {t('readingTime', { minutes: post.reading_time })}
              </span>
            </div>
            <span className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold group-hover:bg-[#38BDF8] group-hover:border-[#38BDF8] transition-all duration-300">
              {t('readMore')}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Default card
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col rounded-2xl border border-[#E5E7EB] bg-white hover:border-[#38BDF8]/40 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="h-48 overflow-hidden bg-[#F8FAFC] flex-shrink-0">
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full gradient-navy opacity-80 flex items-center justify-center">
            <span className="text-white/30 text-4xl font-bold">
              {post.category[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Category */}
        <span
          className="inline-block self-start px-3 py-1 rounded-full text-xs font-semibold capitalize mb-3"
          style={{ background: catStyle.bg, color: catStyle.text }}
        >
          {post.category}
        </span>

        {/* Title */}
        <h3 className="text-base font-bold text-[#0F172A] leading-snug mb-2 group-hover:text-[#1E3A5F] transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Summary */}
        {post.summary && (
          <p className="text-sm text-[#4B5563] leading-relaxed line-clamp-3 mb-4 flex-1">
            {post.summary}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-0.5 rounded-full text-xs bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280]"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {post.published_at ? formatDate(post.published_at) : 'Draft'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {t('readingTime', { minutes: post.reading_time })}
          </span>
          {post.view_count > 0 && (
            <span className="flex items-center gap-1.5 ml-auto">
              <Eye size={12} />
              {post.view_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
