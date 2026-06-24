'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap,
  Clock,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useFlashcardSets, useDueCards } from '@/hooks/use-flashcards'
import { useCourses } from '@/hooks/use-courses'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

type Difficulty = 'easy' | 'medium' | 'hard'

export default function FlashcardsPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set())

  const { courses, isLoading: coursesLoading } = useCourses()
  const { sets, isLoading: setsLoading } = useFlashcardSets(selectedCourse ?? undefined)
  const { cards: dueCards, isLoading: cardsLoading, error: cardsError, refresh: refreshDueCards } = useDueCards()

  const isLoading = coursesLoading || cardsLoading

  const filteredCards = useMemo(() => {
    if (!selectedCourse) return dueCards
    return dueCards.filter((card) => {
      const cardSet = sets.find((s) => s.id === card.id.split('/')[0])
      return cardSet?.courseId === selectedCourse
    })
  }, [selectedCourse, dueCards, sets])

  const currentCard = filteredCards[currentCardIndex]

  const totalDue = dueCards.length
  const masteredCards = dueCards.filter(
    (card) => card.difficulty === 'easy'
  ).length

  function handleFlip() {
    setIsFlipped((prev) => !prev)
  }

  function handleDifficultySelect(_difficulty: Difficulty) {
    if (!currentCard) return
    setReviewedCards((prev) => new Set([...prev, currentCard.id]))
    setIsFlipped(false)

    if (currentCardIndex < filteredCards.length - 1) {
      setTimeout(() => {
        setCurrentCardIndex((prev) => prev + 1)
      }, 200)
    }
  }

  function handlePrevCard() {
    if (currentCardIndex > 0) {
      setIsFlipped(false)
      setCurrentCardIndex((prev) => prev - 1)
    }
  }

  function handleNextCard() {
    if (currentCardIndex < filteredCards.length - 1) {
      setIsFlipped(false)
      setCurrentCardIndex((prev) => prev + 1)
    }
  }

  function handleCourseFilter(courseId: string) {
    setSelectedCourse((prev) => (prev === courseId ? null : courseId))
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }

  function handleReset() {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setReviewedCards(new Set())
    refreshDueCards()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-500">Loading flashcards...</p>
      </div>
    )
  }

  if (cardsError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <div className="rounded-full bg-red-50 p-6">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-800">Something went wrong</h2>
        <p className="text-sm text-zinc-500">{cardsError}</p>
        <Button className="mt-2" onClick={refreshDueCards}>
          Try again
        </Button>
      </div>
    )
  }

  if (filteredCards.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <div className="rounded-full bg-zinc-100 p-6">
          <Brain className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-800">No cards due</h2>
        <p className="text-sm text-zinc-500">
          All caught up! Generate new cards from your documents.
        </p>
        {selectedCourse && (
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setSelectedCourse(null)
              setCurrentCardIndex(0)
            }}
          >
            Show all courses
          </Button>
        )}
      </div>
    )
  }

  const progressPercent =
    (reviewedCards.size / filteredCards.length) * 100

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      {/* Stats bar */}
      <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
          <Zap className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-zinc-700">
            Sets: {sets.length}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-zinc-700">
            Due today: {totalDue}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
          <Check className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium text-zinc-700">
            Mastered: {masteredCards}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Flashcards</h1>
          <span className="text-sm font-medium text-zinc-500">
            Card {currentCardIndex + 1} of {filteredCards.length}
          </span>
        </div>

        {/* Course filter badges */}
        {courses.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {courses.map((course) => (
              <Badge
                key={course.id}
                variant={selectedCourse === course.id ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => handleCourseFilter(course.id)}
              >
                {course.code ?? course.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Progress</span>
            <span className="text-xs text-zinc-500">
              {reviewedCards.size}/{filteredCards.length} reviewed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Flashcard area */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {/* Left arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="hidden sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Card with 3D flip */}
          <div
            className="w-full max-w-lg cursor-pointer"
            style={{ perspective: '1200px' }}
            onClick={handleFlip}
          >
            <motion.div
              className="relative aspect-[4/3] w-full"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front face */}
              <Card
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-0 bg-white p-8 shadow-lg"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {currentCard.difficulty && (
                  <Badge
                    variant="outline"
                    className="absolute left-4 top-4 text-xs"
                  >
                    {currentCard.difficulty}
                  </Badge>
                )}
                <p className="text-center text-lg font-medium text-zinc-800 md:text-xl">
                  {currentCard.front}
                </p>
                <span className="absolute bottom-4 text-xs text-zinc-400">
                  Click to reveal
                </span>
              </Card>

              {/* Back face */}
              <Card
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-0 bg-white p-8 shadow-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {currentCard.difficulty && (
                  <Badge
                    variant="outline"
                    className="absolute left-4 top-4 text-xs"
                  >
                    {currentCard.difficulty}
                  </Badge>
                )}
                <p className="whitespace-pre-line text-center text-base text-zinc-700 md:text-lg">
                  {currentCard.back}
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Right arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextCard}
            disabled={currentCardIndex === filteredCards.length - 1}
            className="hidden sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile navigation */}
        <div className="mb-6 flex items-center justify-center gap-4 sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextCard}
            disabled={currentCardIndex === filteredCards.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Difficulty rating — visible after flip */}
        {isFlipped && (
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleDifficultySelect('hard')}
            >
              Hard
            </Button>
            <Button
              variant="outline"
              className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
              onClick={() => handleDifficultySelect('medium')}
            >
              Medium
            </Button>
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleDifficultySelect('easy')}
            >
              Easy
            </Button>
          </motion.div>
        )}

        {/* Reset button */}
        {reviewedCards.size === filteredCards.length && (
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Review again
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
