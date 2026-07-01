'use client'

import { useState } from 'react'
import {
  BookOpen,
  Loader2,
  Sparkles,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  Clock,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SummaryTabProps {
  hasReadyDocs: boolean
  hasProcessingDocs?: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

export function SummaryTab({ hasReadyDocs, hasProcessingDocs, generations, isLoading, onGenerate }: SummaryTabProps) {
  const filtered = generations.filter((g) => g.type === 'summary')
  const latest = filtered[0]
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())

  const toggleChapter = (index: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  if (!hasReadyDocs && hasProcessingDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-purple-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Processing documents...</p>
        <p className="text-xs text-gray-400 mt-1">You can generate a summary once processing is complete</p>
      </div>
    )
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <BookOpen className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">Upload documents first to generate a summary</p>
      </div>
    )
  }

  if (isLoading && !latest) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="relative mb-4">
          <div className="rounded-full bg-indigo-50 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-700">Generating summary...</p>
        <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
      </div>
    )
  }

  if (!latest || filtered.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <BookOpen className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Generate a summary from your session documents</p>
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Summary'}
          </Button>
        </div>
      </div>
    )
  }

  if (latest.status === 'pending' || latest.status === 'processing') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-indigo-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Processing summary...</p>
        <p className="text-xs text-gray-400 mt-1">Analyzing your documents</p>
      </div>
    )
  }

  if (latest.status === 'failed') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Summary generation failed</p>
          <p className="text-xs text-gray-400 mt-1">Something went wrong. Please try again.</p>
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const result = latest.result
  if (!result) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header with regenerate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {latest.created_at && (
            <span>Generated {new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-3 w-3" />
          Regenerate
        </Button>
      </div>

      {/* Hero section with title + overview */}
      {result.overview && (
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Overview
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{result.overview}</p>
          </CardContent>
        </Card>
      )}

      {/* Chapters as accordion */}
      {result.chapters && result.chapters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900 px-1">Chapters</h3>
          {result.chapters.map((ch: any, i: number) => {
            const isExpanded = expandedChapters.has(i)
            return (
              <Card key={i} className="overflow-hidden">
                <button
                  onClick={() => toggleChapter(i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{ch.title}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && ch.keyPoints && (
                  <div className="border-t px-5 py-4 bg-gray-50/50">
                    <ul className="space-y-2">
                      {ch.keyPoints.map((kp: string, j: number) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                          {kp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Key takeaways */}
      {result.takeaways && result.takeaways.length > 0 && (
        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/60 to-white">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-purple-500" />
              Key Takeaways
            </h3>
            <ul className="space-y-2">
              {result.takeaways.map((t: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-purple-900">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
