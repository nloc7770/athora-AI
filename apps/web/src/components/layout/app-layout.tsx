'use client'

import { Sidebar, MobileHeader } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { BottomTabBar } from '@/components/layout/bottom-tab-bar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <AppHeader />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
        <BottomTabBar />
      </div>
    </div>
  )
}
