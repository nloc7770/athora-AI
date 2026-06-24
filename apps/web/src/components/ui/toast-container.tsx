'use client'

import { AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/stores/toast-store'
import { Toast } from './toast'

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
