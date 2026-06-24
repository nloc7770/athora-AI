'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToastStore } from '@/stores/toast-store'

const DISMISS_DELAY = 5000

const variantStyles: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
}

interface ToastProps {
  id: string
  message: string
  variant: 'success' | 'error' | 'info'
}

export function Toast({ id, message, variant }: ToastProps) {
  const removeToast = useToastStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), DISMISS_DELAY)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${variantStyles[variant]}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="flex-1">{message}</span>
        <button
          onClick={() => removeToast(id)}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
