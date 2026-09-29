'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Network,
  Loader2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MindMapNebula } from '@/components/ui/mindmap-nebula'

interface MindMapTabProps {
  hasReadyDocs: boolean
  hasProcessingDocs?: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

export function MindMapTab({ hasReadyDocs, hasProcessingDocs, generations, isLoading, onGenerate }: MindMapTabProps) {
  const params = useParams()
  const sessionId = params.id as string
  const filtered = generations.filter((g) => g.type === 'mindmap')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  if (!hasReadyDocs && hasProcessingDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-purple-50 p-4 mb-4 dark:bg-purple-950/40">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 dark:text-purple-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-stone-300">Processing documents...</p>
        <p className="text-xs text-gray-400 mt-1 dark:text-stone-500">You can generate a mind map once processing is complete</p>
      </div>
    )
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4 dark:bg-stone-800">
          <Network className="h-8 w-8 text-gray-400 dark:text-stone-500" />
        </div>
        <p className="text-gray-500 dark:text-stone-400">Upload documents first to generate a mind map</p>
      </div>
    )
  }

  if ((isLoading || pending) && !latest) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-indigo-50 p-4 mb-4 dark:bg-indigo-950/40">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 dark:text-indigo-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-stone-300">Generating mind map...</p>
        <p className="text-xs text-gray-400 mt-1 dark:text-stone-500">Mapping concepts from your documents</p>
      </div>
    )
  }

  if (failed && !latest) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center pt-16">
        <div className="rounded-full bg-red-50 p-4 mb-4 dark:bg-red-950/40">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-stone-300">Generation failed</p>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
          <RotateCcw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  if (!latest || !latest.result?.nodes?.length) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4 dark:bg-stone-800">
            <Network className="h-8 w-8 text-gray-300 dark:text-stone-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4 dark:text-stone-400">Generate a mind map from your session documents</p>
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Mind Map'}
          </Button>
        </div>
      </div>
    )
  }

  const { nodes, edges } = latest.result

  return (
    <div className="mx-auto max-w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        {/* The generator emits hierarchy as parentId and often ships an empty
            edges array, so counting edges alone reported "0 connections" for a
            map that visibly has them. Each child contributes exactly one link. */}
        <span className="text-sm text-gray-500 dark:text-stone-400">
          {nodes.length} nodes ·{' '}
          {edges?.length || nodes.filter((n: any) => n.parentId).length} connections
        </span>
        <div className="flex items-center gap-2">
          <Link href={`/sessions/${sessionId}/mindmap`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Maximize2 className="h-3 w-3" /> Full screen
            </Button>
          </Link>
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="h-3 w-3" /> Regenerate
          </Button>
        </div>
      </div>

      <MindMapNebula rawNodes={nodes} edges={edges} height="600px" />
    </div>
  )
}
