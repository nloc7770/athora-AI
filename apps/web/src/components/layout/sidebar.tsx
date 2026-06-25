'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Library,
  MessageSquare,
  Layers,
  GraduationCap,
  Settings,
  BookOpen,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: BookOpen },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'AI Tutor', href: '/tutor', icon: MessageSquare },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Exam Mode', href: '/exam', icon: GraduationCap },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-stone-200 bg-background transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-stone-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-stone-900">
              Athora
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 shadow-sm'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User info & Logout */}
        <div className="border-t border-stone-100 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 rounded-lg px-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-xs font-medium text-white">
                {user.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">
                  {user.name ?? 'Student'}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-stone-500 hover:text-stone-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {/* Plan info */}
        <div className="border-t border-stone-100 px-4 py-3">
          <p className="text-xs font-medium text-stone-400">Free plan</p>
        </div>
      </aside>
    </>
  )
}

export function MobileHeader() {
  const { setSidebarOpen } = useAppStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-stone-200 bg-background px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="min-h-10 min-w-10"
        aria-label="Open menu"
        data-testid="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="ml-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600">
          <BookOpen className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-stone-900">Athora</span>
      </div>
    </header>
  )
}
