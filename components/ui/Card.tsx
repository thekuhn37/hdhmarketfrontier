'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  /** Enable the lift-on-hover animation */
  hoverable?: boolean
  children?: React.ReactNode
  className?: string
}

/**
 * Glass-effect card wrapper.
 *
 * Design tokens applied:
 *   background  : rgba(255,255,255,0.65)
 *   backdrop    : blur(18px)
 *   border      : rgba(255,255,255,0.25)
 *   shadow      : 0 8px 32px rgba(15,23,42,0.08)
 */
export function Card({ hoverable = false, className, children, ...rest }: CardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border p-6',
        // Glass effect via inline style below; Tailwind arbitraries kept minimal
        className,
      )}
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
        ...rest.style,
      }}
      whileHover={
        hoverable
          ? { y: -4, boxShadow: '0 16px 48px rgba(15,23,42,0.14)' }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
