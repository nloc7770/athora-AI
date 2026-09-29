'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Settings } from 'lucide-react'

import { useCourses } from '@/hooks/use-courses'
import { useStreak } from '@/hooks/use-streak'
import { useNotifications } from '@/hooks/use-notifications'
import { useAuthStore } from '@/stores/auth-store'
import { useColumnResize } from '@/hooks/use-column-resize'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HudRailNav } from './hud-rail-nav'
import './brain-theme.css'

/**
 * The shell every authenticated route renders: veronica's icon rail, its top bar
 * (greeting, courses/streak readouts, notification bell, account menu) and a
 * content area. /dashboard passes the brain graph plus its own side columns as
 * `children`; every other page passes its page component and lets the shell
 * scroll it.
 *
 * This is the ONLY copy of the top bar — brain-hud renders it through here.
 */

const ICO36 = { size: 17, strokeWidth: 1.9, 'aria-hidden': true } as const

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface BrainShellProps {
  children: React.ReactNode
  /** Top-bar buttons between the stats and the bell — the dashboard's column toggles. */
  topBarExtra?: React.ReactNode
  /** Extra classes on the body grid — the dashboard's `is-vault-open` flags. */
  bodyClassName?: string
  /** Callback ref for the body grid; the dashboard's column resizer needs it. */
  bodyRef?: (el: HTMLDivElement | null) => void
  /**
   * A persistent right column, for pages whose secondary content should always
   * be on screen rather than behind a button — /tutor's chat history.
   *
   * Supplying this switches the body from the default scroll box to the HUD's
   * grid (`is-right-open` → `minmax(0,1fr) 6px var(--br-right-w)`), wraps
   * `children` in their own scroller, and drops a working resizer between them.
   * Below 1024px brain-theme.css turns the column into an absolute overlay and
   * hides the resizer, so a page that renders this must ALSO keep a way to
   * dismiss it on mobile — otherwise the overlay covers the page for good.
   */
  rightColumn?: React.ReactNode
}

export function BrainShell({
  children,
  topBarExtra,
  bodyClassName = 'is-scroll',
  bodyRef,
  rightColumn,
}: BrainShellProps) {
  // Owned here so any page can have a resizable column without re-implementing
  // the drag. The dashboard passes its own bodyRef and keeps its own instance.
  const ownResize = useColumnResize()
  const hasRight = Boolean(rightColumn)
  const resolvedBodyRef = bodyRef ?? (hasRight ? ownResize.setBodyEl : undefined)
  const resolvedBodyClass = hasRight ? 'is-right-open' : bodyClassName
  const router = useRouter()
  const { courses } = useCourses()
  const { streak } = useStreak()
  const { user, logout } = useAuthStore()
  const { unreadCount, markAllRead } = useNotifications()

  const coursesCount = courses.length
  const streakDays = streak

  // Same greeting the dashboard used to render above the brain; the page no
  // longer has a greeting block, so the top bar carries it.
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Student'

  // Mirrors AppHeader's initials logic — sign-out has to work identically now
  // that these routes render no AppHeader.
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.charAt(0).toUpperCase() ?? 'U')

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [logout, router])

  // The pages under this shell are light-first but carry a `dark:` variant on
  // every surface, so forcing the class is what renders them dark. Same
  // mechanism /settings already uses — documentElement + `dark` — rather than a
  // provider. Only removed on unmount if this shell was the one that added it.
  useEffect(() => {
    const root = document.documentElement
    const had = root.classList.contains('dark')
    root.classList.add('dark')
    return () => {
      if (!had) root.classList.remove('dark')
    }
  }, [])

  return (
    <div className="athora-brain br-shell">
      <div className="br-hud">
        <HudRailNav />

        <div className="br-hud-top">
          <div className="br-top-left">
            <div className="br-brand">
              <span className="br-top-title" style={{ textTransform: 'uppercase' }}>
                {getGreeting()}, {displayName}
              </span>
            </div>
          </div>

          <div className="br-top-right">
            {/* Courses and streak live here now — the dashboard's stat grid that
                used to show them was removed as a duplicate of the brain's own
                FILES / LEARNED / LEARNING strip. */}
            <span className="br-top-stat">
              {coursesCount} <em>courses</em>
            </span>
            <span className="br-top-stat">
              {streakDays} <em>day streak</em>
            </span>
            <span aria-hidden style={{ width: 1, height: 20, background: 'var(--br-border)' }} />

            {topBarExtra}

            {/* Notification bell — replaces AppHeader's bell, which these routes
                no longer render. Click clears the unread badge. */}
            <button
              className="br-rail-item"
              style={{ width: 36, height: 36, borderRadius: 10 }}
              onClick={markAllRead}
              aria-label="Notifications"
            >
              <Bell {...ICO36} />
              {unreadCount > 0 && (
                <span className="br-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Account menu — replaces AppHeader's. Keeps the `User menu` aria
                label the app's own test helper waits for after login. */}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="User menu"
                render={
                  <button
                    type="button"
                    className="br-rail-item"
                    style={{ width: 36, height: 36, borderRadius: 999 }}
                  />
                }
              >
                <span className="br-avatar">{initials}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={`br-hud-body ${resolvedBodyClass}`} ref={resolvedBodyRef}>
          {hasRight ? (
            <>
              {/* `overflow-hidden`, NOT `overflow-y-auto`.
                  A page under this shell already owns its own scrolling — /tutor's
                  PageContainer is `h-full` with an internal transcript scroller —
                  so an `auto` here reserved a second scrollbar gutter that never
                  scrolled anything (measured: scrollHeight === clientHeight) and
                  showed up as a grey strip beside the chat. min-h-0 is what lets a
                  grid child shrink below its content instead of stretching the row. */}
              <div className="min-h-0 overflow-hidden">{children}</div>

              <div
                className="br-resizer"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize side column"
                onPointerDown={(e) => ownResize.startDrag('right', e)}
                onDoubleClick={() => ownResize.resetDrag('right')}
              />

              {rightColumn}
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
}
