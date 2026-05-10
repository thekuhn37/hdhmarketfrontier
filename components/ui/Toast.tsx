'use client'

import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast'
import type { ToasterProps } from 'react-hot-toast'

/**
 * Drop this into the root layout (or any layout) once.
 * It renders the react-hot-toast portal with HDH Market Frontier brand styling.
 */
export function Toaster(props: Partial<ToasterProps>) {
  return (
    <HotToaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 32px rgba(15,23,42,0.10)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#111827',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '380px',
        },
        success: {
          iconTheme: {
            primary: '#38BDF8',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
          duration: 5000,
        },
      }}
      {...props}
    />
  )
}

/**
 * Pre-configured toast helpers that match brand conventions.
 *
 * Usage:
 *   toast.success('Post published.')
 *   toast.error('Something went wrong.')
 *   toast.info('Loading your data…')
 */
export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  info: (message: string) =>
    hotToast(message, {
      icon: '💡',
    }),
  loading: (message: string) => hotToast.loading(message),
  dismiss: (id?: string) => hotToast.dismiss(id),
  promise: hotToast.promise,
}

// Re-export the raw toast for advanced use-cases
export { hotToast }
