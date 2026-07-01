import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; isPositive: boolean }
  className?: string
}

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-zinc-200 bg-white p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-zinc-400">{description}</p>
          )}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="rounded-lg bg-zinc-100 p-2.5">
          <Icon className="h-5 w-5 text-zinc-600" />
        </div>
      </div>
    </div>
  )
}
