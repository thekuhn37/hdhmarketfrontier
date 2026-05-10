'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F172A] text-white border border-[#0F172A] hover:bg-[#1E3A5F] hover:border-[#1E3A5F]',
  secondary:
    'bg-white text-[#0F172A] border border-[#0F172A] hover:bg-[#F8FAFC]',
  ghost:
    'bg-transparent text-[#0F172A] border border-transparent hover:bg-[#F8FAFC] hover:border-[#E5E7EB]',
  accent:
    'bg-[#38BDF8] text-[#0F172A] border border-[#38BDF8] hover:bg-[#0ea5e9] hover:border-[#0ea5e9]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2.5',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render as a different element, e.g. 'a' or a Next.js Link. */
  as?: React.ElementType
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      as: Tag = 'button',
      loading = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    const baseClass = cn(
      'inline-flex items-center justify-center font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
      variantStyles[variant],
      sizeStyles[size],
      className,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MotionTag = motion(Tag as any)

    return (
      <MotionTag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={baseClass}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...rest}
      >
        {loading ? (
          <>
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span className="sr-only">Loading…</span>
          </>
        ) : (
          children
        )}
      </MotionTag>
    )
  },
)

Button.displayName = 'Button'
