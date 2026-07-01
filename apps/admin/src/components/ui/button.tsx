'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' && 'bg-zinc-900 text-white hover:bg-zinc-800',
          variant === 'outline' && 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
          variant === 'ghost' && 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'lg' && 'h-11 px-6',
          size === 'icon' && 'h-9 w-9',
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
