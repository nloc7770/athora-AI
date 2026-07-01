'use client'

import { useRouter } from 'next/navigation'
import {
  Settings,
  LogOut,
  CreditCard,
  ChevronDown,
  User,
  Bell,
  FileText,
  GraduationCap,
  Brain,
  CheckCheck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useNotifications, ActivityNotification } from '@/hooks/use-notifications'

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function getActivityDisplay(n: ActivityNotification): { icon: React.ReactNode; label: string } {
  switch (n.activity_type) {
    case 'document_upload':
      return {
        icon: <FileText className="h-3.5 w-3.5 text-blue-500" />,
        label: `Document uploaded${n.metadata.documentName ? `: ${n.metadata.documentName}` : ''}`,
      }
    case 'exam_generation':
      return {
        icon: <GraduationCap className="h-3.5 w-3.5 text-purple-500" />,
        label: 'Exam generated',
      }
    case 'flashcard_generation':
      return {
        icon: <Brain className="h-3.5 w-3.5 text-emerald-500" />,
        label: `Flashcards generated${n.metadata.cardCount ? ` (${n.metadata.cardCount} cards)` : ''}`,
      }
  }
}

export function AppHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, markAllRead } = useNotifications()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? 'U'

  const recent = notifications.slice(0, 10)

  return (
    <header className="hidden h-14 shrink-0 items-center justify-end gap-3 border-b border-stone-100 bg-white px-6 lg:flex">
      {/* Credit Balance */}
      <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5">
        <CreditCard className="h-3.5 w-3.5 text-purple-600" />
        <span className="text-xs font-semibold text-stone-700">∞</span>
        <span className="text-xs text-stone-400">credits</span>
      </div>

      {/* Notification Bell */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors">
            <Bell className="h-3.5 w-3.5 text-stone-600" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <p className="text-xs font-semibold text-stone-700">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-7 w-7 text-stone-200 mb-2" />
              <p className="text-xs text-stone-400">No activity yet</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
              {recent.map((n) => {
                const { icon, label } = getActivityDisplay(n)
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-700 truncate">{label}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {notifications.length > 10 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-4 py-2">
                <button
                  onClick={() => router.push('/analytics')}
                  className="w-full text-center text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  View all activity
                </button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="User menu">
          <div className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 py-1 pl-1 pr-2.5 transition-colors hover:bg-stone-50">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-500 text-[11px] font-semibold text-white">
              {initials}
            </div>
            <span className="text-xs font-medium text-stone-700 max-w-[100px] truncate">
              {user?.name ?? user?.email?.split('@')[0] ?? 'User'}
            </span>
            <ChevronDown className="h-3 w-3 text-stone-400" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <User className="mr-2 h-3.5 w-3.5" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-3.5 w-3.5" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <CreditCard className="mr-2 h-3.5 w-3.5" />
            Billing
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
    </header>
  )
}
