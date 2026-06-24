'use client'

import { AppLayout } from '@/components/layout/app-layout'
import AudioWorkspacePage from '@/components/documents/audio-workspace-page'

export default function AudioWorkspaceRoute() {
  return (
    <AppLayout>
      <AudioWorkspacePage />
    </AppLayout>
  )
}
