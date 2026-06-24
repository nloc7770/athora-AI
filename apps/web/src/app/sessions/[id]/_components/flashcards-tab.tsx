'use client'

import { useState } from 'react'
import {
  Brain,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface FlashcardsTabProps {
  hasReadyDocs: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

const difficultyConfig = {
  easy: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Easy' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' },
} as const

export function FlashcardsTab({ hasReadyDocs, generations, isLoading, onGenerate }: FlashcardsTabProps) {
  const filtered = generations.filter((g) => g.type === 'flashcards')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const cards = latest?.result?.cards ?? []
  const totalCards = cards.length
  const currentCard = cards[currentIndex]

  const goNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
    }
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Brain className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">Upload documents first to generate flashcards</p>
      </div>
    )
  }

  if ((isLoading || pending) && !latest) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-indigo-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Generating flashcards...</p>
        <p className="text-xs text-gray-400 mt-1">Creating cards from your documents</p>
      </div>
    )
  }

  if (failed && !latest) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Flashcard generation failed</p>
          <p className="text-xs text-gray-400 mt-1">Something went wrong. Please try again.</p>
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!latest || totalCards === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-center pt-4">
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Flashcards
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Brain className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No flashcards generated yet</p>
        </div>
      </div>
    )
  }

  const difficulty = currentCard?.difficulty as keyof typeof difficultyConfig | undefined
  const diffStyle = difficulty && difficultyConfig[difficulty] ? difficultyConfig[difficulty] : null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Top bar: counter + generate more */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Card {currentIndex + 1} of {totalCards}
        </span>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-3 w-3" />
          Generate More
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000">
        <button
          onClick={() => setIsFlipped((prev) => !prev)}
          className="relative w-full cursor-pointer"
          aria-label={isFlipped ? 'Show question' : 'Show answer'}
        >
          <div
            className={`relative min-h-[280px] w-full rounded-2xl border-2 transition-all duration-500 transform-style-3d ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* Front */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-8 backface-hidden border border-gray-200 shadow-sm">
              {diffStyle && (
                <Badge className={`${diffStyle.bg} ${diffStyle.text} absolute top-4 right-4`}>
                  {diffStyle.label}
                </Badge>
              )}
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">Question</p>
              <p className="text-center text-lg font-medium text-gray-900 leading-relaxed">
                {currentCard?.front}
              </p>
              <p className="absolute bottom-4 text-xs text-gray-300">Tap to flip</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-50 p-8 backface-hidden [transform:rotateY(180deg)] border border-indigo-200 shadow-sm">
              {diffStyle && (
                <Badge className={`${diffStyle.bg} ${diffStyle.text} absolute top-4 right-4`}>
                  {diffStyle.label}
                </Badge>
              )}
              <p className="text-xs uppercase tracking-wider text-indigo-400 mb-4">Answer</p>
              <p className="text-center text-base text-gray-800 leading-relaxed">
                {currentCard?.back}
              </p>
              <p className="absolute bottom-4 text-xs text-indigo-300">Tap to flip back</p>
            </div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-gray-500 tabular-nums min-w-[4rem] text-center">
          {currentIndex + 1} / {totalCards}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={currentIndex === totalCards - 1}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
