'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Layers,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Learn',
    items: [
      { name: 'Study Spaces', href: '/sessions', icon: BookOpen },
      { name: 'Library', href: '/library', icon: Library },
      { name: 'Flashcards', href: '/flashcards', icon: Layers },
      { name: 'Exam Mode', href: '/exam', icon: GraduationCap },
      { name: 'AI Tutor', href: '/tutor', icon: MessageSquare },
    ],
  },
  {
    label: '',
    items: [
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

function NavGroupSection({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-0.5">
      {group.label && (
        <p className="mb-1 px-3 text-[11px] font-medium text-stone-400/80 dark:text-stone-500/80">
          {group.label}
        </p>
      )}
      {group.items.map((item) => {
        const active = isNavActive(pathname, item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150',
              active
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200'
            )}
          >
            <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-white")} />
            {item.name}
          </Link>
        )
      })}
    </div>
  )
}

function UserCard({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore()

  return (
    <div className="p-3">
      {user && (
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-sm font-semibold text-white">
            {user.email?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-stone-900 dark:text-stone-100">
              {user.name ?? 'Student'}
            </p>
            <p className="truncate text-[11px] text-stone-500 dark:text-stone-400">
              {user.email}
            </p>
          </div>
        </div>
      )}

      <div className="mb-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 dark:border-purple-900/40 dark:bg-purple-950/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
            Free plan
          </span>
        </div>
        <Link
          href="/settings?tab=billing"
          className="mt-1 block text-[11px] font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          Upgrade for unlimited
        </Link>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-[13px] text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-300"
        onClick={onLogout}
      >
        <LogOut className="h-[18px] w-[18px]" />
        Sign out
      </Button>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <img
            src="/images/logo.png"
            alt="Athora"
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-[15px] font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Athora
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group, i) => (
          <div key={group.label || i}>
            {i > 0 && i === navGroups.length - 1 && (
              <div className="my-2 border-t border-stone-100 dark:border-stone-800" />
            )}
            <NavGroupSection
              group={group}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </nav>

      {/* User card & logout */}
      <div className="border-t border-stone-200 dark:border-stone-800">
        <UserCard onLogout={handleLogout} />
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-60 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 lg:flex">
      <SidebarContent />
    </aside>
  )
}

export function MobileHeader() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-950 lg:hidden">
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
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Athora"
              className="h-7 w-7 rounded-lg"
            />
            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Athora
            </span>
          </Link>
        </div>
      </header>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-60 p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
