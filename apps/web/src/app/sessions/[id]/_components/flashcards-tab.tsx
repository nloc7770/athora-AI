'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { useSwipe } from '@/hooks/use-swipe'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Difficulty = 'easy' | 'medium' | 'hard'

interface DifficultyStats {
  easy: number
  medium: number
  hard: number
}

interface FlashcardsTabProps {
  hasReadyDocs: boolean
  hasProcessingDocs?: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

const difficultyConfig = {
  easy: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Easy' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
  hard: { bg: 'bg-red-100', text: 'text-red-700', label: 'Hard' },
} as const

function getTextSizeClass(text: string | undefined): string {
  if (!text) return 'text-lg'
  return text.length > 200 ? 'text-sm' : 'text-lg'
}

export function FlashcardsTab({ hasReadyDocs, hasProcessingDocs, generations, isLoading, onGenerate }: FlashcardsTabProps) {
  const filtered = generations.filter((g) => g.type === 'flashcards')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState<DifficultyStats>({ easy: 0, medium: 0, hard: 0 })
  const [ratedDifficulty, setRatedDifficulty] = useState<Difficulty | null>(null)
  const [isSliding, setIsSliding] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const prefersReducedMotion = useReducedMotion()

  const cards = latest?.result?.cards ?? []
  const totalCards = cards.length
  const currentCard = cards[currentIndex]

  const isInReview = !!latest && totalCards > 0

  const goNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex((prev) => {
        const next = prev + 1
        const nextCard = cards[next]
        if (nextCard) {
          setAnnouncement(`Card ${next + 1} of ${totalCards}. Question: ${nextCard.front}`)
        }
        return next
      })
      setIsFlipped(false)
    }
  }, [currentIndex, totalCards, cards])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => {
        const next = prev - 1
        const nextCard = cards[next]
        if (nextCard) {
          setAnnouncement(`Card ${next + 1} of ${totalCards}. Question: ${nextCard.front}`)
        }
        return next
      })
      setIsFlipped(false)
    }
  }, [currentIndex, cards, totalCards])

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => {
      const next = !prev
      if (next && currentCard) {
        setAnnouncement(`Answer: ${currentCard.back}`)
      }
      return next
    })
  }, [currentCard])

  const handleDifficulty = useCallback((difficulty: Difficulty) => {
    // Micro-feedback animation
    setRatedDifficulty(difficulty)
    setTimeout(() => setRatedDifficulty(null), 200)

    // Slide out
    setIsSliding(true)

    setStats((prev) => ({ ...prev, [difficulty]: prev[difficulty] + 1 }))

    const slideDelay = prefersReducedMotion ? 50 : 300
    setTimeout(() => {
      setIsSliding(false)
      if (currentIndex < totalCards - 1) {
        setCurrentIndex((prev) => prev + 1)
        setIsFlipped(false)
      } else {
        setIsFlipped(false)
      }
    }, slideDelay)
  }, [currentIndex, totalCards, prefersReducedMotion])

  // Keyboard shortcuts (Task 17)
  useEffect(() => {
    if (!isInReview) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault()
          handleFlip()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goPrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          goNext()
          break
        case 'Digit1':
          if (isFlipped) {
            e.preventDefault()
            handleDifficulty('easy')
          }
          break
        case 'Digit2':
          if (isFlipped) {
            e.preventDefault()
            handleDifficulty('medium')
          }
          break
        case 'Digit3':
          if (isFlipped) {
            e.preventDefault()
            handleDifficulty('hard')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInReview, isFlipped, handleFlip, goNext, goPrev, handleDifficulty])

  const { swipeState, handlers: swipeHandlers } = useSwipe({
    threshold: 50,
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
    onSwipeUp: () => {
      if (!isFlipped) handleFlip()
    },
  })

  if (!hasReadyDocs && hasProcessingDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-purple-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Processing documents...</p>
        <p className="text-xs text-gray-400 mt-1">You can generate flashcards once processing is complete</p>
      </div>
    )
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
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Brain className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Generate flashcards from your session documents</p>
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Flashcards'}
          </Button>
        </div>
      </div>
    )
  }

  const difficulty = currentCard?.difficulty as keyof typeof difficultyConfig | undefined
  const diffStyle = difficulty && difficultyConfig[difficulty] ? difficultyConfig[difficulty] : null

  const slideClasses = isSliding
    ? prefersReducedMotion
      ? 'opacity-0 transition-opacity duration-150'
      : 'translate-x-[120%] opacity-0 transition-all duration-300'
    : ''

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Screen reader announcements (Task 19) */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Top bar: counter + stats + generate more */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Card {currentIndex + 1} of {totalCards}
        </span>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-3 w-3" />
          Generate More
        </Button>
      </div>

      {/* Mini stats bar */}
      {(stats.easy > 0 || stats.medium > 0 || stats.hard > 0) && (
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600">Easy: {stats.easy}</span>
          <span className="text-amber-600">Medium: {stats.medium}</span>
          <span className="text-red-600">Hard: {stats.hard}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Flashcard with swipe */}
      <div className={`perspective-1000 ${slideClasses}`}>
        <div
          {...swipeHandlers}
          style={{
            transform: swipeState.isSwiping
              ? `translateX(${swipeState.offsetX * 0.3}px) translateY(${swipeState.offsetY * 0.15}px)`
              : undefined,
            transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <button
            onClick={handleFlip}
            className="relative w-full cursor-pointer"
            aria-label={isFlipped ? 'Show question' : 'Show answer'}
          >
            {prefersReducedMotion ? (
              /* Reduced motion: opacity crossfade */
              <div className="relative min-h-[280px] w-full rounded-2xl border-2 border-gray-200 shadow-sm">
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-8 transition-opacity duration-200 ${
                    isFlipped ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {diffStyle && (
                    <Badge className={`${diffStyle.bg} ${diffStyle.text} absolute top-4 right-4`}>
                      {diffStyle.label}
                    </Badge>
                  )}
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-4">Question</p>
                  <div className="max-h-[250px] overflow-y-auto scrollbar-thin w-full flex justify-center">
                    <p className={`text-center ${getTextSizeClass(currentCard?.front)} font-medium text-gray-900 leading-relaxed`}>
                      {currentCard?.front}
                    </p>
                  </div>
                  <p className="absolute bottom-4 text-xs text-gray-300">Tap to flip</p>
                </div>
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-indigo-50 p-8 transition-opacity duration-200 border border-indigo-200 ${
                    isFlipped ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {diffStyle && (
                    <Badge className={`${diffStyle.bg} ${diffStyle.text} absolute top-4 right-4`}>
                      {diffStyle.label}
                    </Badge>
                  )}
                  <p className="text-xs uppercase tracking-wider text-indigo-400 mb-4">Answer</p>
                  <div className="max-h-[250px] overflow-y-auto scrollbar-thin w-full flex justify-center">
                    <p className={`text-center ${getTextSizeClass(currentCard?.back)} text-gray-800 leading-relaxed`}>
                      {currentCard?.back}
                    </p>
                  </div>
                  <p className="absolute bottom-4 text-xs text-indigo-300">Tap to flip back</p>
                </div>
              </div>
            ) : (
              /* Standard 3D flip */
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
                  <div className="max-h-[250px] overflow-y-auto scrollbar-thin w-full flex justify-center">
                    <p className={`text-center ${getTextSizeClass(currentCard?.front)} font-medium text-gray-900 leading-relaxed`}>
                      {currentCard?.front}
                    </p>
                  </div>
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
                  <div className="max-h-[250px] overflow-y-auto scrollbar-thin w-full flex justify-center">
                    <p className={`text-center ${getTextSizeClass(currentCard?.back)} text-gray-800 leading-relaxed`}>
                      {currentCard?.back}
                    </p>
                  </div>
                  <p className="absolute bottom-4 text-xs text-indigo-300">Tap to flip back</p>
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Difficulty buttons (show after flip) - Task 16: micro-feedback */}
      {isFlipped && (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className={`border-red-200 text-red-600 hover:bg-red-50 transition-transform duration-150 ${
              ratedDifficulty === 'hard' ? 'scale-115' : ''
            }`}
            onClick={() => handleDifficulty('hard')}
          >
            Hard
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`border-amber-200 text-amber-600 hover:bg-amber-50 transition-transform duration-150 ${
              ratedDifficulty === 'medium' ? 'scale-115' : ''
            }`}
            onClick={() => handleDifficulty('medium')}
          >
            Medium
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-transform duration-150 ${
              ratedDifficulty === 'easy' ? 'scale-115' : ''
            }`}
            onClick={() => handleDifficulty('easy')}
          >
            Easy
          </Button>
        </div>
      )}

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

      {/* Keyboard shortcut hint (Task 17) */}
      <p className="text-center text-xs text-gray-400">
        Space to flip · ← → navigate · 1 2 3 rate
      </p>
    </div>
  )
}
