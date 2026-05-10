import { cn } from '@/lib/utils/cn'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg'

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

interface SpinnerProps {
  size?: SpinnerSize
  /** Colour of the visible arc. Defaults to current text colour. */
  color?: string
  className?: string
  label?: string
}

export function Spinner({
  size = 'md',
  color,
  className,
  label = 'Loading…',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent',
          sizeMap[size],
        )}
        style={color ? { borderColor: color, borderTopColor: 'transparent' } : undefined}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
