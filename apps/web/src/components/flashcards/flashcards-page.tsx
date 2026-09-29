'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Brain, ArrowLeft, Layers, Clock, Trophy,
  RotateCcw, Shuffle, CloudOff, FileUp, Plus,
} from 'lucide-react'
import { useFlashcardSets, useFlashcardSet, useDueCards } from '@/hooks/use-flashcards'
import { useSwipe } from '@/hooks/use-swipe'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { apiClient } from '@/lib/api'
import { markFirstStudyDone } from '@/hooks/use-first-study'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  ListCard,
  ListSkeleton,
} from '@/components/page'

type Difficulty = 'easy' | 'medium' | 'hard'
type ViewMode = 'list' | 'review' | 'due-review' | 'completed'

interface DifficultyStats { easy: number; medium: number; hard: number }

interface PendingRating { cardId: string; difficulty: Difficulty; lastReviewed: string }

/**
 * The list view is full-bleed (PageContainer owns the gutters). The two FOCUSED
 * views — reviewing a card, and the session summary — keep a reading measure,
 * because a flashcard stretched across 1400px is unreadable. `max-w-2xl` is the
 * same measure /exam uses for its active-exam and results views, so the two
 * focused flows line up.
 */
const FOCUS_MEASURE = 'mx-auto max-w-2xl'

/** Track tint for ui/progress — the default `bg-muted` is a light-theme grey. */
const PROGRESS_TRACK = '[&_[data-slot=progress-track]]:bg-[var(--br-bg3)]'

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
      <p className={`mb-4 text-xs font-medium tracking-wider uppercase ${
        isAnswer ? 'text-primary' : 'text-[var(--br-text3)]'
      }`}>{label}</p>
      <div className="max-h-[200px] w-full overflow-y-auto">
        <p className={`text-center ${textSize(text)} leading-relaxed ${
          isAnswer ? 'text-[var(--br-text2)]' : 'font-medium text-[var(--br-text)]'
        }`}>{text}</p>
      </div>
      {hint && <p className="absolute bottom-4 text-xs text-[var(--br-text3)]">{hint}</p>}
    </>
  )
}

interface Segment { count: number; label: string; bar: string; text: string }

/**
 * The ONE hand-rolled bar left on this page. ui/progress has a single
 * indicator, so it cannot show mastered / learning / again / new side by side —
 * and that split IS the readout. Used by both the in-review tally and the
 * session summary, which is why there are two bars here now instead of three.
 */
function StackedBar({ segments, total }: { segments: Segment[]; total: number }) {
  const shown = segments.filter((s) => s.count > 0)
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {shown.map((s, i) => (
          <span key={s.label}>
            {i > 0 && <span className="mr-2 text-[var(--br-text3)]" aria-hidden>·</span>}
            <span className={s.text}>{s.count} {s.label}</span>
          </span>
        ))}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--br-bg3)]">
        {shown.map((s) => (
          <div key={s.label} className={`h-full ${s.bar} transition-all duration-300`}
            style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%` }} />
        ))}
      </div>
    </div>
  )
}

/** Rating segments share one colour scale between review and summary. */
function ratingSegments(stats: DifficultyStats): Segment[] {
  return [
    { count: stats.easy, label: 'mastered', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    { count: stats.medium, label: 'learning', bar: 'bg-amber-500', text: 'text-amber-400' },
    { count: stats.hard, label: 'again', bar: 'bg-red-500', text: 'text-red-400' },
  ]
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

  // ── COMPLETION VIEW ──
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
      <PageContainer className={FOCUS_MEASURE}>
        <PageHeader
          title="Session Complete"
          icon={<Trophy />}
          count={`${easyPct}% easy`}
          subtitle={
            <>
              You reviewed {totalRated} card{totalRated !== 1 ? 's' : ''} in {getSessionTime()}.{' '}
              {performanceMessage} <span aria-hidden>{performanceEmoji}</span>
            </>
          }
          // Two actions only: a third pushed the measure past max-w-2xl and the
          // title wrapped. "Start Exam" lives with the nudge copy below instead.
          actions={
            <>
              <Button size="lg"
                onClick={() => { resetSession(); setViewMode(selectedSetId ? 'review' : 'due-review') }}>
                <RotateCcw /> Review Again
              </Button>
              <Button variant="outline" size="lg" onClick={goBack}>
                <Layers /> Back to Decks
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-3 gap-3">
          {([
            ['easy', stats.easy, 'Easy', 'text-emerald-400'],
            ['medium', stats.medium, 'Good', 'text-amber-400'],
            ['hard', stats.hard, 'Hard', 'text-red-400'],
          ] as const).map(([key, count, label, textColor]) => (
            <div key={key}
              className="flex flex-col items-center rounded-xl border border-[var(--br-border)] bg-[var(--br-bg2)] p-4">
              <span className={`text-2xl font-bold tabular-nums ${textColor}`}>{count}</span>
              <span className="mt-1 text-xs text-[var(--br-text3)]">{label}</span>
            </div>
          ))}
        </div>

        <StackedBar segments={ratingSegments(stats)} total={totalRated} />

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] p-4 text-center">
          <p className="text-sm text-[var(--br-accent-ink)]">
            {estimatedDueTomorrow > 0
              ? `Come back tomorrow for ~${estimatedDueTomorrow} due card${estimatedDueTomorrow !== 1 ? 's' : ''}`
              : 'All caught up! Try an exam to test your knowledge.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => { window.location.href = '/exam' }}>
            <Brain /> Start Exam
          </Button>
        </div>
      </PageContainer>
    )
  }

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <PageContainer>
        <PageHeader
          title="Flashcards"
          subtitle="Spaced repetition decks built from your documents."
          count={`${sets.length} deck${sets.length !== 1 ? 's' : ''}`}
          icon={<Brain />}
          actions={
            !dueLoading && dueCards.length > 0 ? (
              <Button onClick={startDueReview} size="lg">
                <Clock />
                Review {dueCards.length} due
              </Button>
            ) : undefined
          }
        />

        {setsLoading ? (
          <ListSkeleton count={6} variant="card" label="Loading flashcard decks" />
        ) : setsError ? (
          <EmptyState
            illustration="offline"
            title="Couldn't load your decks"
            description={setsError}
            action={<Button onClick={() => window.location.reload()}><RotateCcw />Try again</Button>}
          />
        ) : sets.length === 0 && dueCards.length === 0 ? (
          <EmptyState
            illustration="flashcards"
            title="No flashcards yet"
            description="Create a set or upload a document and athora will build the deck for you."
            action={
              <Button onClick={() => { window.location.href = '/sessions' }}>
                <Plus /> Create flashcard set
              </Button>
            }
            secondaryAction={
              <Button variant="outline" onClick={() => { window.location.href = '/sessions' }}>
                <FileUp /> Upload a document
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <ListCard
                  key={set.id}
                  onClick={() => openSet(set.id)}
                  icon={<Layers />}
                  title={set.name}
                  description={hasBeenStudied ? `${masteryPercent}% mastered` : 'Not started'}
                  meta={
                    <>
                      <span>{set.cardCount ?? 0} cards</span>
                      <span aria-hidden>·</span>
                      <span>{lastStudied}</span>
                    </>
                  }
                  badge={
                    setDueCount > 0 ? (
                      <Badge>{setDueCount} due</Badge>
                    ) : !hasBeenStudied && set.cardCount > 0 ? (
                      <Badge variant="secondary">New</Badge>
                    ) : null
                  }
                />
              )
            })}
          </div>
        )}
      </PageContainer>
    )
  }

  // ── REVIEW VIEW ──
  const reviewTitle = viewMode === 'due-review'
    ? 'Due Today' : sets.find((s) => s.id === selectedSetId)?.name ?? 'Flashcards'
  const slideClasses = isSliding
    ? (prefersReducedMotion ? 'opacity-0 transition-opacity duration-150' : 'translate-x-[120%] opacity-0 transition-all duration-300')
    : ''
  const reviewSegments: Segment[] = [
    ...ratingSegments(stats),
    {
      count: Math.max(0, totalCards - stats.easy - stats.medium - stats.hard),
      label: 'new', bar: 'bg-[var(--br-border)]', text: 'text-[var(--br-text3)]',
    },
  ]

  return (
    <PageContainer className={FOCUS_MEASURE}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      <PageHeader
        title={reviewTitle}
        icon={<Layers />}
        count={`${currentCardIndex + 1} / ${totalCards}${isShuffled ? ' shuffled' : ''}`}
        actions={
          <>
            <Button variant="ghost" size="icon-lg" onClick={goBack} aria-label="Back to decks">
              <ArrowLeft />
            </Button>
            <Button
              variant={isShuffled ? 'default' : 'outline'}
              size="icon-lg"
              onClick={() => applyShuffle(!isShuffled)}
              aria-pressed={isShuffled}
              aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
            >
              <Shuffle />
            </Button>
          </>
        }
      />

      <Progress
        value={totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0}
        aria-label="Position in deck"
        className={`gap-0 ${PROGRESS_TRACK}`}
      />

      {pendingRatings.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <CloudOff className="size-3.5" />
          <span>{pendingRatings.length} rating{pendingRatings.length !== 1 ? 's' : ''} pending sync</span>
        </div>
      )}

      {cardsLoading || (viewMode === 'due-review' && dueLoading) ? (
        <ListSkeleton count={3} label="Loading cards" />
      ) : totalCards === 0 ? (
        <EmptyState
          illustration="flashcards"
          title={viewMode === 'due-review' ? 'No cards due today' : 'This set has no cards'}
          description="Nothing to review here right now."
          secondaryAction={<Button variant="outline" onClick={goBack}><Layers />Back to decks</Button>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <StackedBar segments={reviewSegments} total={totalCards} />

          <motion.div className={`w-full touch-pan-y ${slideClasses}`} key={currentCardIndex}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.15 : 0.2 }}>
            <div {...swipeHandlers} style={{
              transform: swipeState.isSwiping ? `translateX(${swipeState.offsetX * 0.3}px) translateY(${swipeState.offsetY * 0.15}px)` : undefined,
              transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out',
            }}>
              <button onClick={handleFlip}
                className="relative w-full cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2"
                aria-label={isFlipped ? 'Show question' : 'Show answer'}>
                {prefersReducedMotion ? (
                  <div className="relative min-h-[280px] w-full rounded-2xl border border-[var(--br-border)] bg-[var(--br-bg2)]">
                    <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8 transition-opacity duration-200 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                      <CardFace label="Question" text={currentCard?.front} hint="Tap to reveal" variant="question" />
                    </div>
                    <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[var(--br-accent-wash)] p-8 transition-opacity duration-200 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                      <CardFace label="Answer" text={currentCard?.back} variant="answer" />
                    </div>
                  </div>
                ) : (
                  <div className={`perspective-1000 transform-style-3d relative min-h-[280px] w-full rounded-2xl transition-all duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                    <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--br-border)] bg-[var(--br-bg2)] p-8">
                      <CardFace label="Question" text={currentCard?.front} hint="Tap to reveal" variant="question" />
                    </div>
                    <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] p-8 [transform:rotateY(180deg)]">
                      <CardFace label="Answer" text={currentCard?.back} variant="answer" />
                    </div>
                  </div>
                )}
              </button>
            </div>
          </motion.div>

          {/* Rating chips — SRS semantics unchanged: hard/medium/easy, keys 1/2/3 */}
          {isFlipped && (
            <div className="flex items-center justify-center gap-3">
              {([['hard', 'Again', 'border-red-500/40 text-red-400 hover:bg-red-500/10'],
                 ['medium', 'Good', 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'],
                 ['easy', 'Easy', 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10']] as const).map(([diff, label, cls]) => (
                <button key={diff} onClick={() => handleDifficulty(diff)}
                  className={`rounded-full border bg-[var(--br-bg2)] px-5 py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${cls} ${ratedDifficulty === diff ? 'scale-110' : ''}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon-lg" onClick={handlePrev}
              disabled={currentCardIndex === 0} aria-label="Previous card">
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon-lg" onClick={handleNext}
              disabled={currentCardIndex === totalCards - 1} aria-label="Next card">
              <ChevronRight />
            </Button>
          </div>

          <p className="text-center text-xs text-[var(--br-text3)]">
            Space to flip · arrows to navigate · 1 2 3 to rate
          </p>
        </div>
      )}
    </PageContainer>
  )
}
