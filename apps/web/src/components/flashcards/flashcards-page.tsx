'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Brain, Loader2, AlertCircle, ArrowLeft,
  Layers, Clock, Trophy, RotateCcw, Shuffle, CloudOff, FileUp, Plus, Sparkles,
} from 'lucide-react'
import { useFlashcardSets, useFlashcardSet, useDueCards } from '@/hooks/use-flashcards'
import { useSwipe } from '@/hooks/use-swipe'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { apiClient } from '@/lib/api'
import { markFirstStudyDone } from '@/hooks/use-first-study'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Difficulty = 'easy' | 'medium' | 'hard'
type ViewMode = 'list' | 'review' | 'due-review' | 'completed'

interface DifficultyStats { easy: number; medium: number; hard: number }

interface PendingRating { cardId: string; difficulty: Difficulty; lastReviewed: string }

function shuffleArray<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function textSize(text: string | undefined): string {
  if (!text) return 'text-lg'
  return text.length > 200 ? 'text-sm' : 'text-lg'
}

function CardFace({ label, text, hint, variant }: {
  label: string; text: string | undefined; hint?: string
  variant: 'question' | 'answer'
}) {
  const isAnswer = variant === 'answer'
  return (
    <>
      <p className={`mb-4 text-xs font-medium uppercase tracking-wider ${
        isAnswer ? 'text-violet-500 dark:text-violet-400' : 'text-stone-400 dark:text-stone-500'
      }`}>{label}</p>
      <div className="max-h-[200px] w-full overflow-y-auto">
        <p className={`text-center ${textSize(text)} leading-relaxed ${
          isAnswer
            ? 'text-stone-800 dark:text-stone-200'
            : 'font-medium text-stone-900 dark:text-stone-100'
        }`}>{text}</p>
      </div>
      {hint && <p className="absolute bottom-4 text-xs text-stone-300 dark:text-stone-600">{hint}</p>}
    </>
  )
}

function MasteryBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

function ProgressBar({ stats, total }: { stats: DifficultyStats; total: number }) {
  const unreviewed = Math.max(0, total - stats.easy - stats.medium - stats.hard)
  const segments = [
    { count: stats.easy, color: 'bg-emerald-400 dark:bg-emerald-500', label: 'mastered', textColor: 'text-emerald-600 dark:text-emerald-400' },
    { count: stats.medium, color: 'bg-amber-400 dark:bg-amber-500', label: 'learning', textColor: 'text-amber-600 dark:text-amber-400' },
    { count: stats.hard, color: 'bg-red-400 dark:bg-red-500', label: 'again', textColor: 'text-red-500 dark:text-red-400' },
    { count: unreviewed, color: 'bg-stone-200 dark:bg-stone-700', label: 'new', textColor: 'text-stone-400' },
  ]
  return (
    <div className="mb-6">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {segments.filter((s) => s.count > 0).map((s, i) => (
          <span key={s.label}>
            {i > 0 && <span className="mr-2 text-stone-300 dark:text-stone-600">·</span>}
            <span className={s.textColor}>{s.count} {s.label}</span>
          </span>
        ))}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        {segments.filter((s) => s.count > 0).map((s) => (
          <div key={s.label} className={`h-full ${s.color} transition-all duration-300`}
            style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function FlashcardsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState<DifficultyStats>({ easy: 0, medium: 0, hard: 0 })
  const [ratedDifficulty, setRatedDifficulty] = useState<Difficulty | null>(null)
  const [isSliding, setIsSliding] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const sessionStartRef = useRef<number>(Date.now())
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([])
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([])

  const prefersReducedMotion = useReducedMotion()
  const { sets, isLoading: setsLoading, error: setsError } = useFlashcardSets()
  const { cards, isLoading: cardsLoading } = useFlashcardSet(selectedSetId)
  const { cards: dueCards, isLoading: dueLoading } = useDueCards()

  const rawCards = viewMode === 'due-review' ? dueCards : cards
  const activeCards = isShuffled && shuffledIndices.length === rawCards.length
    ? shuffledIndices.map((i) => rawCards[i]) : rawCards
  const currentCard = activeCards[currentCardIndex]
  const totalCards = activeCards.length
  const isInReview = viewMode === 'review' || viewMode === 'due-review'

  function applyShuffle(enabled: boolean) {
    setIsShuffled(enabled)
    if (enabled && rawCards.length > 0) {
      setShuffledIndices(shuffleArray(Array.from({ length: rawCards.length }, (_, i) => i)))
    }
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  useEffect(() => {
    if (isShuffled && rawCards.length > 0 && shuffledIndices.length !== rawCards.length) {
      setShuffledIndices(shuffleArray(Array.from({ length: rawCards.length }, (_, i) => i)))
    }
  }, [rawCards.length, isShuffled, shuffledIndices.length])

  const flushPendingRatings = useCallback(async () => {
    if (pendingRatings.length === 0) return
    const remaining: PendingRating[] = []
    for (const rating of pendingRatings) {
      try {
        await apiClient.patch(`/flashcards/cards/${rating.cardId}`, {
          difficulty: rating.difficulty, last_reviewed: rating.lastReviewed,
        })
      } catch { remaining.push(rating) }
    }
    setPendingRatings(remaining)
  }, [pendingRatings])

  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') flushPendingRatings() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [flushPendingRatings])

  function resetSession() {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStats({ easy: 0, medium: 0, hard: 0 })
    sessionStartRef.current = Date.now()
  }

  function openSet(setId: string) {
    setSelectedSetId(setId)
    setViewMode('review')
    resetSession()
    if (isShuffled && cards.length > 0) {
      setShuffledIndices(shuffleArray(Array.from({ length: cards.length }, (_, i) => i)))
    }
  }

  function startDueReview() {
    setViewMode('due-review')
    resetSession()
    if (isShuffled && dueCards.length > 0) {
      setShuffledIndices(shuffleArray(Array.from({ length: dueCards.length }, (_, i) => i)))
    }
  }

  function goBack() {
    setViewMode('list')
    setSelectedSetId(null)
    resetSession()
  }

  function handleFlip() {
    setIsFlipped((prev) => {
      if (!prev && currentCard) setAnnouncement(`Answer: ${currentCard.back}`)
      return !prev
    })
  }

  function handleNext() {
    if (currentCardIndex < totalCards - 1) {
      setIsFlipped(false)
      setCurrentCardIndex((prev) => {
        const next = prev + 1
        const c = activeCards[next]
        if (c) setAnnouncement(`Card ${next + 1} of ${totalCards}. Question: ${c.front}`)
        return next
      })
    }
  }

  function handlePrev() {
    if (currentCardIndex > 0) {
      setIsFlipped(false)
      setCurrentCardIndex((prev) => {
        const next = prev - 1
        const c = activeCards[next]
        if (c) setAnnouncement(`Card ${next + 1} of ${totalCards}. Question: ${c.front}`)
        return next
      })
    }
  }

  const handleDifficulty = useCallback((difficulty: Difficulty) => {
    if (!currentCard) return
    markFirstStudyDone()
    setRatedDifficulty(difficulty)
    setTimeout(() => setRatedDifficulty(null), 200)
    setIsSliding(true)
    const ts = new Date().toISOString()
    apiClient.patch(`/flashcards/cards/${currentCard.id}`, {
      difficulty, last_reviewed: ts,
    }).catch(() => {
      setPendingRatings((prev) => [...prev, { cardId: currentCard.id, difficulty, lastReviewed: ts }])
    })
    setStats((prev) => ({ ...prev, [difficulty]: prev[difficulty] + 1 }))
    setTimeout(() => {
      setIsSliding(false)
      if (currentCardIndex >= totalCards - 1) { setIsFlipped(false); setViewMode('completed'); return }
      handleNext()
    }, prefersReducedMotion ? 50 : 300)
  }, [currentCard, currentCardIndex, totalCards, prefersReducedMotion, activeCards])

  useEffect(() => {
    if (!isInReview) return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.code) {
        case 'Space': case 'Enter': e.preventDefault(); handleFlip(); break
        case 'ArrowLeft': e.preventDefault(); handlePrev(); break
        case 'ArrowRight': e.preventDefault(); handleNext(); break
        case 'Digit1': if (isFlipped) { e.preventDefault(); handleDifficulty('hard') } break
        case 'Digit2': if (isFlipped) { e.preventDefault(); handleDifficulty('medium') } break
        case 'Digit3': if (isFlipped) { e.preventDefault(); handleDifficulty('easy') } break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isInReview, isFlipped, handleDifficulty])

  function getSessionTime(): string {
    const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return mins === 0 ? `${secs}s` : `${mins}m ${secs}s`
  }

  const { swipeState, handlers: swipeHandlers } = useSwipe({
    threshold: 50,
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    onSwipeUp: () => { if (!isFlipped) handleFlip() },
  })

  // Loading
  if (setsLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400 dark:text-stone-500" />
        <p className="text-sm text-stone-500 dark:text-stone-400">Loading flashcards...</p>
      </div>
    )
  }

  // Error
  if (setsError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm text-stone-500 dark:text-stone-400">{setsError}</p>
      </div>
    )
  }

  // COMPLETION VIEW
  if (viewMode === 'completed') {
    const totalRated = stats.easy + stats.medium + stats.hard
    const easyPct = totalRated > 0 ? Math.round((stats.easy / totalRated) * 100) : 0
    const performanceEmoji = easyPct >= 70 ? '\u{1F525}' : easyPct >= 40 ? '\u{1F4AA}' : '\u{1F4DA}'
    const performanceMessage = easyPct >= 70
      ? 'Crushing it! Most cards felt easy.'
      : easyPct >= 40
        ? 'Solid session. You\'re making progress.'
        : 'Keep going — repetition builds mastery.'
    const estimatedDueTomorrow = stats.hard + (stats.medium > 0 ? Math.ceil(stats.medium * 0.3) : 0)

    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Celebratory icon */}
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
              <Trophy className="h-10 w-10 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="absolute -right-1 -top-1 text-2xl" aria-hidden="true">{performanceEmoji}</span>
          </div>

          {/* Session summary */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">Session Complete</h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              You reviewed {totalRated} card{totalRated !== 1 ? 's' : ''} in {getSessionTime()}
            </p>
            <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-300">
              {performanceMessage}
            </p>
          </div>

          {/* Performance breakdown */}
          <div className="grid w-full grid-cols-3 gap-3">
            {([
              ['easy', stats.easy, 'Easy', 'text-emerald-500 dark:text-emerald-400', 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'],
              ['medium', stats.medium, 'Good', 'text-amber-500 dark:text-amber-400', 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'],
              ['hard', stats.hard, 'Hard', 'text-red-500 dark:text-red-400', 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'],
            ] as const).map(([key, count, label, textColor, bgColor]) => (
              <div key={key} className={`flex flex-col items-center rounded-xl border p-4 ${bgColor}`}>
                <span className={`text-2xl font-bold ${textColor}`}>{count}</span>
                <span className="mt-1 text-xs text-stone-500 dark:text-stone-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Mastery bar for session */}
          <div className="w-full">
            <div className="mb-1.5 flex justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>Session mastery</span>
              <span>{easyPct}%</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              {stats.easy > 0 && (
                <div className="h-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(stats.easy / totalRated) * 100}%` }} />
              )}
              {stats.medium > 0 && (
                <div className="h-full bg-amber-400 dark:bg-amber-500 transition-all duration-300"
                  style={{ width: `${(stats.medium / totalRated) * 100}%` }} />
              )}
              {stats.hard > 0 && (
                <div className="h-full bg-red-400 dark:bg-red-500 transition-all duration-300"
                  style={{ width: `${(stats.hard / totalRated) * 100}%` }} />
              )}
            </div>
          </div>

          {/* Next action nudge */}
          <div className="w-full rounded-xl border border-violet-200 bg-violet-50 p-4 text-center dark:border-violet-800 dark:bg-violet-950/20">
            <p className="text-sm text-violet-700 dark:text-violet-300">
              {estimatedDueTomorrow > 0
                ? `Come back tomorrow for ~${estimatedDueTomorrow} due card${estimatedDueTomorrow !== 1 ? 's' : ''}`
                : 'All caught up! Try an exam to test your knowledge.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => { resetSession(); setViewMode(selectedSetId ? 'review' : 'due-review') }}
              className="gap-2 rounded-xl border-stone-200 dark:border-stone-700">
              <RotateCcw className="h-4 w-4" /> Review Again
            </Button>
            <Button variant="outline" onClick={goBack}
              className="gap-2 rounded-xl border-stone-200 dark:border-stone-700">
              <Layers className="h-4 w-4" /> Back to Decks
            </Button>
            <Button onClick={() => { window.location.href = '/exam' }}
              className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              <Brain className="h-4 w-4" /> Start Exam
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Flashcards</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">{sets.length} deck{sets.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {!dueLoading && dueCards.length > 0 && (
          <button onClick={startDueReview}
            className="mb-6 flex w-full items-center justify-between rounded-xl border border-violet-200 bg-violet-50 p-5 text-left transition-all hover:border-violet-300 hover:shadow-sm dark:border-violet-800 dark:bg-violet-950/30 dark:hover:border-violet-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-violet-900 dark:text-violet-200">Due Today</h3>
                <p className="text-xs text-violet-600 dark:text-violet-400">{dueCards.length} card{dueCards.length !== 1 ? 's' : ''} ready</p>
              </div>
            </div>
            <Badge className="bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200">{dueCards.length}</Badge>
          </button>
        )}

        {sets.length === 0 && dueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
              <Layers className="h-8 w-8 text-stone-400 dark:text-stone-500" />
            </div>
            <h2 className="mt-6 text-lg font-medium text-stone-800 dark:text-stone-200">No flashcards yet</h2>
            <p className="mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
              Create a set or upload a document to get started.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <Button onClick={() => { window.location.href = '/sessions' }}
                className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="h-4 w-4" /> Create flashcard set
              </Button>
              <Button variant="outline" onClick={() => { window.location.href = '/sessions' }}
                className="gap-2 rounded-xl border-stone-200 dark:border-stone-700">
                <FileUp className="h-4 w-4" /> Upload a document
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => {
              const setDueCount = dueCards.filter(
                (c) => (c.set_id ?? c.setId) === set.id
              ).length

              // Mastery: prefer API-provided data, fall back to dueCards heuristic
              let masteryPercent: number | null = null
              if (set.masteredCount != null && set.cardCount > 0) {
                masteryPercent = Math.round((set.masteredCount / set.cardCount) * 100)
              } else {
                const setReviewedCards = dueCards.filter(
                  (c) => (c.set_id ?? c.setId) === set.id && c.difficulty && c.difficulty !== 'new'
                )
                if (setReviewedCards.length > 0 && set.cardCount > 0) {
                  const masteredCount = setReviewedCards.filter(
                    (c) => c.difficulty === 'easy' || c.difficulty === 'medium'
                  ).length
                  masteryPercent = Math.round((masteredCount / set.cardCount) * 100)
                }
              }
              const hasBeenStudied = masteryPercent !== null

              const updateDate = set.updatedAt ? new Date(set.updatedAt) : null
              const days = updateDate && !isNaN(updateDate.getTime())
                ? Math.max(0, Math.floor((Date.now() - updateDate.getTime()) / 86_400_000)) : null
              const lastStudied = days === null ? 'Not studied' : days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`

              return (
                <div key={set.id}
                  className="group flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2">{set.name}</h3>
                    {setDueCount > 0 ? (
                      <Badge className="ml-2 shrink-0 bg-violet-100 text-violet-700 text-xs dark:bg-violet-900/40 dark:text-violet-300">{setDueCount} due</Badge>
                    ) : !hasBeenStudied && set.cardCount > 0 ? (
                      <Badge className="ml-2 shrink-0 bg-stone-100 text-stone-500 text-xs dark:bg-stone-800 dark:text-stone-400">New</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
                    <span>{set.cardCount ?? 0} cards</span>
                    <span className="text-stone-300 dark:text-stone-600">·</span>
                    <span>{lastStudied}</span>
                  </div>
                  <MasteryBar percent={masteryPercent ?? 0} />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {hasBeenStudied ? `${masteryPercent}% mastered` : 'Not started'}
                    </span>
                    <Button size="sm" onClick={() => openSet(set.id)}
                      className="h-8 gap-1.5 rounded-lg bg-violet-600 px-3 text-xs text-white hover:bg-violet-700">
                      <Sparkles className="h-3.5 w-3.5" /> Study Now
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // REVIEW VIEW
  const reviewTitle = viewMode === 'due-review'
    ? 'Due Today' : sets.find((s) => s.id === selectedSetId)?.name ?? 'Flashcards'
  const slideClasses = isSliding
    ? (prefersReducedMotion ? 'opacity-0 transition-opacity duration-150' : 'translate-x-[120%] opacity-0 transition-all duration-300')
    : ''

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col px-4 py-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {/* Top position bar */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0}%` }} />
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={goBack}
          className="h-8 w-8 rounded-lg p-0 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{reviewTitle}</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {currentCardIndex + 1} / {totalCards}
            {isShuffled && <span className="ml-1.5 text-violet-500">(shuffled)</span>}
          </p>
        </div>
        <Button variant={isShuffled ? 'default' : 'outline'} size="sm"
          onClick={() => applyShuffle(!isShuffled)}
          className={`h-8 gap-1.5 rounded-lg px-3 ${isShuffled ? 'bg-violet-600 text-white hover:bg-violet-700' : 'border-stone-200 dark:border-stone-700'}`}
          aria-pressed={isShuffled} aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}>
          <Shuffle className="h-3.5 w-3.5" />
        </Button>
      </div>

      {pendingRatings.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <CloudOff className="h-3.5 w-3.5" />
          <span>{pendingRatings.length} rating{pendingRatings.length !== 1 ? 's' : ''} pending sync</span>
        </div>
      )}

      {cardsLoading || (viewMode === 'due-review' && dueLoading) ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-stone-400 dark:text-stone-500" />
        </div>
      ) : totalCards === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Brain className="h-10 w-10 text-stone-200 dark:text-stone-700" />
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {viewMode === 'due-review' ? 'No cards due today' : 'This set has no cards'}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <ProgressBar stats={stats} total={totalCards} />

          <div className="flex flex-1 items-center justify-center">
            <motion.div className={`w-full touch-pan-y ${slideClasses}`} key={currentCardIndex}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.15 : 0.2 }}>
              <div {...swipeHandlers} style={{
                transform: swipeState.isSwiping ? `translateX(${swipeState.offsetX * 0.3}px) translateY(${swipeState.offsetY * 0.15}px)` : undefined,
                transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out',
              }}>
                <button onClick={handleFlip}
                  className="relative w-full cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                  aria-label={isFlipped ? 'Show question' : 'Show answer'}>
                  {prefersReducedMotion ? (
                    <div className="relative min-h-[280px] w-full rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
                      <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8 transition-opacity duration-200 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                        <CardFace label="Question" text={currentCard?.front} hint="Tap to reveal" variant="question" />
                      </div>
                      <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-violet-50 p-8 transition-opacity duration-200 dark:bg-violet-950/20 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                        <CardFace label="Answer" text={currentCard?.back} variant="answer" />
                      </div>
                    </div>
                  ) : (
                    <div className={`perspective-1000 relative min-h-[280px] w-full rounded-2xl transition-all duration-500 transform-style-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-8 shadow-sm backface-hidden dark:border-stone-700 dark:bg-stone-900">
                        <CardFace label="Question" text={currentCard?.front} hint="Tap to reveal" variant="question" />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 p-8 shadow-sm backface-hidden [transform:rotateY(180deg)] dark:border-violet-800 dark:bg-violet-950/20">
                        <CardFace label="Answer" text={currentCard?.back} variant="answer" />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Difficulty pills */}
          {isFlipped && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {([['hard', 'Again', 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20'],
                 ['medium', 'Good', 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20'],
                 ['easy', 'Easy', 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/20']] as const).map(([diff, label, cls]) => (
                <button key={diff} onClick={() => handleDifficulty(diff)}
                  className={`rounded-full border bg-white px-5 py-2.5 text-sm font-medium transition-all dark:bg-stone-900 ${cls} ${ratedDifficulty === diff ? 'scale-110' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Nav arrows */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button variant="ghost" size="sm" onClick={handlePrev} disabled={currentCardIndex === 0}
              className="h-9 w-9 rounded-lg p-0 text-stone-500 disabled:opacity-30 dark:text-stone-400">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNext} disabled={currentCardIndex === totalCards - 1}
              className="h-9 w-9 rounded-lg p-0 text-stone-500 disabled:opacity-30 dark:text-stone-400">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">
            Space to flip · arrows to navigate · 1 2 3 to rate
          </p>
        </div>
      )}
    </div>
  )
}
