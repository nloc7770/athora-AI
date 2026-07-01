'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Brain,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAdminAuthStore } from '@/stores/auth-store'
import { AdminProtectedRoute } from '@/components/auth/admin-protected-route'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'AI & Usage', href: '/ai-usage', icon: Brain },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'System', href: '/system', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAdminAuthStore()

  return (
    <AdminProtectedRoute>
      <div className="flex h-svh">
        {/* Sidebar */}
        <aside className="flex w-64 flex-col bg-zinc-900">
          <div className="flex h-14 items-center px-5">
            <span className="text-base font-semibold text-white">
              Athora Admin
            </span>
          </div>

          <nav className="flex-1 space-y-0.5 px-3 py-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-zinc-800 px-3 py-3">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 items-center justify-end border-b border-zinc-200 bg-white px-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600">
                {user?.email}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700">
                {user?.name?.charAt(0)?.toUpperCase() ??
                  user?.email?.charAt(0)?.toUpperCase() ??
                  'A'}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
