'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Library,
  Layers,
  MessageSquare,
  User,
} from 'lucide-react'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  primary?: boolean
}

const tabs: TabItem[] = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Library', href: '/library', icon: Library },
  { name: 'Study', href: '/flashcards', icon: Layers, primary: true },
  { name: 'Tutor', href: '/tutor', icon: MessageSquare },
  { name: 'Profile', href: '/settings', icon: User },
]

function isTabActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end justify-around px-2 pt-1.5 pb-1.5">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href)

          if (tab.primary) {
            return (
              <Link
                key={tab.name}
                href={tab.href}
                tabIndex={0}
                aria-label={tab.name}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 -mt-3"
              >
                <span
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors duration-150',
                    active
                      ? 'bg-purple-600 shadow-purple-600/30'
                      : 'bg-purple-500 shadow-purple-500/20'
                  )}
                >
                  <tab.icon className="h-6 w-6 text-white" />
                </span>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    active
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              tabIndex={0}
              aria-label={tab.name}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <tab.icon
                className={cn(
                  'h-5 w-5 transition-colors duration-150',
                  active
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-stone-400 dark:text-stone-500'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-stone-500 dark:text-stone-400'
                )}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
