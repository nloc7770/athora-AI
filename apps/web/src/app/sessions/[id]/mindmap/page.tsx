'use client'

import { useParams, useRouter } from 'next/navigation'
import { Loader2, Network } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useSession } from '@/hooks/use-sessions'
import { useSessionGeneration } from '@/hooks/use-ai-generation'
import { MindMapFullscreen } from '@/components/ui/mindmap-fullscreen'

function MindMapPageContent() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const { session, isLoading: sessionLoading } = useSession(sessionId)
  const { generations, isLoading: genLoading } = useSessionGeneration(sessionId)

  const mindmapGenerations = generations.filter((g: any) => g.type === 'mindmap')
  const latest = mindmapGenerations.find((g: any) => g.status === 'completed')

  const isLoading = sessionLoading || genLoading

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading mind map...</p>
        </div>
      </div>
    )
  }

  if (!latest || !latest.result?.nodes?.length) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Network className="h-10 w-10 text-slate-500" />
          <p className="text-sm text-slate-400">No mind map generated yet</p>
          <button
            onClick={() => router.push(`/sessions/${sessionId}`)}
            className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline"
          >
            Go back and generate one
          </button>
        </div>
      </div>
    )
  }

  const { nodes, edges } = latest.result

  return (
    <MindMapFullscreen
      rawNodes={nodes}
      edges={edges}
      title={session?.title}
      onBack={() => router.push(`/sessions/${sessionId}`)}
    />
  )
}

export default function MindMapPage() {
  return (
    <ProtectedRoute>
      <MindMapPageContent />
    </ProtectedRoute>
  )
}
