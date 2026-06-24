'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'AI Tutor', href: '/tutor', icon: MessageSquare },
  { name: 'Flashcards', href: '/flashcards', icon: Layers },
  { name: 'Exam Mode', href: '/exam', icon: GraduationCap },
  { name: 'Settings', href: '/dashboard', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
              Athora
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-zinc-100 to-zinc-50 text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Usage card */}
        <div className="border-t border-zinc-100 p-4">
          <div className="rounded-lg bg-zinc-50 p-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>AI Credits</span>
              <span>847 / 1,000</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Resets in 8 days
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileHeader() {
  const { setSidebarOpen } = useAppStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-zinc-200 bg-white px-4 lg:hidden">
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
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
          <BookOpen className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-zinc-900">Athora</span>
      </div>
    </header>
  )
}
