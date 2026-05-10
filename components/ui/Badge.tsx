import { cn } from '@/lib/utils/cn'

// ── Category colours ──────────────────────────────────────────────
type Category =
  | 'Markets'
  | 'Data'
  | 'Infrastructure'
  | 'AI'
  | 'Digital Assets'

const categoryStyles: Record<Category, string> = {
  Markets: 'bg-[#0F172A] text-white',
  Data: 'bg-[#1E3A5F] text-white',
  Infrastructure: 'bg-[#38BDF8] text-[#0F172A]',
  AI: 'bg-purple-600 text-white',
  'Digital Assets': 'bg-emerald-600 text-white',
}

// ── Variant types ─────────────────────────────────────────────────
type BadgeVariant = 'category' | 'tag'

interface BadgeCategoryProps {
  variant: 'category'
  category: Category
  className?: string
  children?: React.ReactNode
}

interface BadgeTagProps {
  variant?: 'tag'
  category?: never
  className?: string
  children?: React.ReactNode
}

type BadgeProps = BadgeCategoryProps | BadgeTagProps

export function Badge({ variant = 'tag', className, children, ...rest }: BadgeProps) {
  const baseClass =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-none whitespace-nowrap'

  if (variant === 'category') {
    const { category } = rest as BadgeCategoryProps
    return (
      <span
        className={cn(
          baseClass,
          categoryStyles[category],
          className,
        )}
      >
        {children ?? category}
      </span>
    )
  }

  // tag variant
  return (
    <span
      className={cn(
        baseClass,
        'bg-[#E5E7EB] text-[#4B5563]',
        className,
      )}
    >
      {children}
    </span>
  )
}
