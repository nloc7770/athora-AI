'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BarChart3,
  Loader2,
  FileQuestion,
  Trophy,
  RotateCcw,
  AlertCircle,
  Search,
} from 'lucide-react'
import { useExams, useExam, useAllExamAttempts } from '@/hooks/use-exams'
import { apiClient } from '@/lib/api'
import { markFirstStudyDone } from '@/hooks/use-first-study'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

type ExamState = 'list' | 'active' | 'results'

interface SubmitResponse {
  score: number
  totalQuestions: number
  correctAnswers: number
  results: {
    questionId: string
    questionText?: string
    correct: boolean
    correctAnswer: string
    userAnswer: string
    explanation?: string
  }[]
}

const SESSION_STORAGE_PREFIX = 'exam-progress-'

function getSessionKey(examId: string): string {
  return `${SESSION_STORAGE_PREFIX}${examId}`
}

function saveProgress(examId: string, answers: Record<number, number>, currentQuestion: number): void {
  try {
    sessionStorage.setItem(
      getSessionKey(examId),
      JSON.stringify({ answers, currentQuestion, savedAt: Date.now() })
    )
  } catch {
    // sessionStorage may be unavailable
  }
}

function loadProgress(examId: string): { answers: Record<number, number>; currentQuestion: number } | null {
  try {
    const raw = sessionStorage.getItem(getSessionKey(examId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.answers === 'object') {
      return { answers: parsed.answers, currentQuestion: parsed.currentQuestion ?? 0 }
    }
  } catch {
    // ignore parse errors
  }
  return null
}

function clearProgress(examId: string): void {
  try {
    sessionStorage.removeItem(getSessionKey(examId))
  } catch {
    // ignore
  }
}

function ExamPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [examState, setExamState] = useState<ExamState>('list')
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number | string>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [examResults, setExamResults] = useState<SubmitResponse | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { exams, isLoading: examsLoading, error: examsError, refresh } = useExams()
  const { exam, questions, isLoading: examLoading } = useExam(selectedExamId)

  const examIds = exams.map((e) => e.id)
  const { attemptsByExam } = useAllExamAttempts(examIds)

  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const filteredExams = exams.filter((e) => {
    const matchesSearch = searchQuery === '' || e.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = difficultyFilter === 'all' || e.difficulty === difficultyFilter
    return matchesSearch && matchesDifficulty
  })

  // Restore exam state from URL on mount (fixes F5 reset)
  useEffect(() => {
    const examId = searchParams.get('examId')
    const state = searchParams.get('state') as ExamState | null
    if (examId) {
      setSelectedExamId(examId)
      setExamState(state === 'results' ? 'results' : 'active')
      if (state !== 'results') {
        startTimer()
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const questionCount = questions.length
  const answeredCount = Object.keys(answers).length

  const handleSubmitRef = useRef<() => void>(() => {})

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  // Countdown timer: auto-submit when time runs out
  const timeLimit = exam?.timeLimit ? exam.timeLimit * 60 : null
  const remainingSeconds = timeLimit !== null ? Math.max(0, timeLimit - elapsedSeconds) : null

  function getTimerDisplay(): string {
    if (remainingSeconds !== null) {
      return formatTime(remainingSeconds)
    }
    return formatTime(elapsedSeconds)
  }

  function getTimerColorClass(): string {
    if (remainingSeconds === null) return 'text-stone-500 dark:text-stone-400'
    if (remainingSeconds <= 60) return 'text-red-500 animate-pulse dark:text-red-400'
    if (remainingSeconds <= 300) return 'text-orange-500 dark:text-orange-400'
    return 'text-stone-500 dark:text-stone-400'
  }

  // Prevent accidental browser close/refresh during active exam
  useEffect(() => {
    if (examState !== 'active') return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examState])

  // Task 38: Keyboard shortcuts for exam navigation
  useEffect(() => {
    if (examState !== 'active' || questionCount === 0) return

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentQuestion((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentQuestion((prev) => Math.min(questionCount - 1, prev + 1))
          break
        case '1':
        case '2':
        case '3':
        case '4': {
          const optIdx = parseInt(e.key) - 1
          const currentQ = questions[currentQuestion]
          if (currentQ?.options && optIdx < currentQ.options.length) {
            handleSelectAnswer(currentQuestion, optIdx)
          }
          break
        }
        case 'Enter': {
          if (answeredCount === questionCount && !isSubmitting) {
            handleSubmitRef.current()
          }
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [examState, questionCount, currentQuestion, questions, answeredCount, isSubmitting])

  // Task 12: Persist currentQuestion to sessionStorage on navigation
  useEffect(() => {
    if (examState === 'active' && selectedExamId) {
      saveProgress(selectedExamId, answers, currentQuestion)
    }
  }, [currentQuestion, examState, selectedExamId, answers])

  function handleStartExam(examId: string) {
    setSelectedExamId(examId)
    setExamState('active')
    setCurrentQuestion(0)
    setAnswers({})
    setElapsedSeconds(0)
    setExamResults(null)
    setSubmitError(null)
    setRetryCount(0)

    router.replace(`/exam?examId=${examId}`, { scroll: false })

    // Task 12: Restore progress from sessionStorage
    const saved = loadProgress(examId)
    if (saved) {
      setAnswers(saved.answers)
      setCurrentQuestion(saved.currentQuestion)
    }

    startTimer()
  }

  function handleSelectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = { ...prev, [questionIndex]: optionIndex }
      // Task 12: Persist to sessionStorage on each answer
      if (selectedExamId) {
        saveProgress(selectedExamId, next, currentQuestion)
      }
      return next
    })
  }

  function handleNext() {
    if (currentQuestion < questionCount - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  async function handleSubmit() {
    if (!selectedExamId) return

    stopTimer()
    setIsSubmitting(true)
    setSubmitError(null)

    const payload = questions.map((q, index) => ({
      questionId: q.id,
      answer: answers[index] !== undefined
        ? (q.options?.[answers[index]] ?? '')
        : '',
    }))

    try {
      const result = await apiClient.post<SubmitResponse>(
        `/exams/${selectedExamId}/submit`,
        { answers: payload, timeTaken: elapsedSeconds }
      )
      setExamResults(result)
      markFirstStudyDone()
      setExamState('results')
      router.replace(`/exam?examId=${selectedExamId}&state=results`, { scroll: false })
      // Task 12: Clear sessionStorage on submit success
      clearProgress(selectedExamId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit exam'
      setSubmitError(message)
      // Task 13: Track retry count
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keep handleSubmitRef in sync for auto-submit on timeout
  handleSubmitRef.current = handleSubmit

  useEffect(() => {
    if (examState !== 'active' || remainingSeconds === null) return
    if (remainingSeconds === 0) {
      handleSubmitRef.current()
    }
  }, [examState, remainingSeconds])

  function handleBackToList() {
    stopTimer()
    // Task 12: Clear sessionStorage on exit
    if (selectedExamId) {
      clearProgress(selectedExamId)
    }
    setExamState('list')
    setSelectedExamId(null)
    setExamResults(null)
    setSubmitError(null)
    setRetryCount(0)
    router.replace('/exam', { scroll: false })
    refresh()
  }

  function handleRetakeExam() {
    if (!selectedExamId) return
    handleStartExam(selectedExamId)
  }

  const progressPercent = questionCount > 0
    ? (answeredCount / questionCount) * 100
    : 0

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function formatRelativeDate(dateString: string): string {
    const now = Date.now()
    const then = new Date(dateString).getTime()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDays = Math.floor(diffHr / 24)
    if (diffDays < 30) return `${diffDays}d ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  function getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      case 'medium': return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
      case 'hard': return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
      default: return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
    }
  }

  // Task 42: Score-conditional celebration
  function getScoreCelebration(score: number): { emoji: string; message: string; colorClass: string; circleClass: string } {
    if (score >= 90) return { emoji: '🎊', message: 'Outstanding!', colorClass: 'text-emerald-600 dark:text-emerald-400', circleClass: 'text-emerald-600 dark:text-emerald-400' }
    if (score >= 70) return { emoji: '🎉', message: 'Great job!', colorClass: 'text-purple-600 dark:text-purple-400', circleClass: 'text-purple-600 dark:text-purple-400' }
    if (score >= 50) return { emoji: '👍', message: 'Good effort!', colorClass: 'text-amber-600 dark:text-amber-400', circleClass: 'text-amber-600 dark:text-amber-400' }
    return { emoji: '', message: 'Keep practicing', colorClass: 'text-stone-600 dark:text-stone-400', circleClass: 'text-stone-600 dark:text-stone-400' }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <AnimatePresence mode="wait">

        {/* ── LIST VIEW ── */}
        {examState === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6"
          >
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                  Exam Mode
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Test your knowledge with AI-generated questions
                </p>
              </div>
            </div>

            {examsLoading ? (
              <div className="grid gap-3" role="status" aria-busy="true">
                <span className="sr-only">Loading exams...</span>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="h-4 w-40 rounded bg-stone-200 dark:bg-stone-700" />
                      <div className="h-5 w-16 rounded-full bg-stone-100 dark:bg-stone-800" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-5 w-20 rounded-full bg-stone-100 dark:bg-stone-800" />
                      <div className="h-5 w-16 rounded-full bg-stone-100 dark:bg-stone-800" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : examsError ? (
              <Card className="flex flex-col items-center justify-center border-red-200 bg-red-50/50 p-12 text-center dark:border-red-900 dark:bg-red-950/30">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <h2 className="mt-4 text-base font-medium text-stone-700 dark:text-stone-300">
                  Failed to load exams
                </h2>
                <p className="mt-1 max-w-xs text-sm text-red-600 dark:text-red-400">{examsError}</p>
                <Button
                  onClick={() => refresh()}
                  variant="outline"
                  className="mt-4 gap-2 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </Button>
              </Card>
            ) : exams.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
                <FileQuestion className="h-12 w-12 text-stone-300 dark:text-stone-600" />
                <h2 className="mt-4 text-base font-medium text-stone-700 dark:text-stone-300">
                  No exams available
                </h2>
                <p className="mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
                  Generate exams from your course materials to start practicing.
                </p>
              </Card>
            ) : (
              <>
                {/* Search and filter */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
                    <Input
                      type="text"
                      placeholder="Search exams..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficultyFilter(level)}
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors duration-150 ${
                          difficultyFilter === level
                            ? 'bg-purple-600 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredExams.length === 0 ? (
                  <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">
                    No exams match your filters.
                  </p>
                ) : (
                <div className="grid gap-3">
                  {filteredExams.map((examItem) => (
                  <Card
                    key={examItem.id}
                    className="cursor-pointer border-stone-200 bg-white p-5 transition-all duration-150 hover:border-purple-200 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-purple-800"
                    onClick={() => handleStartExam(examItem.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-stone-900 dark:text-stone-100">
                          {examItem.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary" className="bg-stone-100 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                            {examItem.questionCount} questions
                          </Badge>
                          {examItem.difficulty && (
                            <Badge variant="secondary" className={`text-xs ${getDifficultyColor(examItem.difficulty)}`}>
                              {examItem.difficulty}
                            </Badge>
                          )}
                          {examItem.timeLimit && examItem.timeLimit > 0 && (
                            <Badge variant="secondary" className="gap-1 bg-stone-100 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                              <Clock className="h-3 w-3" />
                              {examItem.timeLimit} min
                            </Badge>
                          )}
                        </div>
                        {/* Attempt history */}
                        {(() => {
                          const attempts = attemptsByExam[examItem.id]
                          if (!attempts || attempts.length === 0) {
                            return (
                              <p className="mt-2 text-[12px] text-stone-500 dark:text-stone-400">
                                Not attempted
                              </p>
                            )
                          }
                          const bestScore = Math.max(...attempts.map((a) => a.score))
                          const lastAttempt = attempts.reduce((latest, a) =>
                            new Date(a.completedAt) > new Date(latest.completedAt) ? a : latest
                          )
                          return (
                            <p className="mt-2 text-[12px] text-stone-500 dark:text-stone-400">
                              Best: {bestScore}% &bull; {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'} &bull; Last: {formatRelativeDate(lastAttempt.completedAt)}
                            </p>
                          )
                        })()}
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500" />
                    </div>
                  </Card>
                ))}
                </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── ACTIVE EXAM VIEW ── */}
        {examState === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="mx-auto flex w-full max-w-2xl flex-col px-4 py-6 sm:px-6"
          >
            {examLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Loading questions...</p>
              </div>
            ) : questionCount === 0 ? (
              <Card className="flex flex-col items-center justify-center border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
                <FileQuestion className="h-12 w-12 text-stone-300 dark:text-stone-600" />
                <h2 className="mt-4 text-base font-medium text-stone-700 dark:text-stone-300">No questions found</h2>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">This exam has no questions yet.</p>
                <Button onClick={handleBackToList} className="mt-4 bg-purple-600 text-white hover:bg-purple-700">
                  Back to Exams
                </Button>
              </Card>
            ) : (
              <>
                {/* Top bar */}
                <div className="mb-4 flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex items-center gap-2">
                    {exam && (
                      <span className="max-w-[160px] truncate text-sm font-medium text-stone-700 dark:text-stone-300 sm:max-w-xs">
                        {exam.name}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                    Q {currentQuestion + 1} / {questionCount}
                  </span>
                  <div
                    className={`flex items-center gap-1.5 text-sm font-mono font-medium ${getTimerColorClass()}`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <Clock className="h-4 w-4" />
                    {getTimerDisplay()}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <Progress value={progressPercent} className="h-1.5 bg-stone-100 dark:bg-stone-800 [&>div]:bg-purple-600" />
                </div>

                {/* Question card */}
                <Card className="mb-5 border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400">
                      Question {currentQuestion + 1}
                    </span>
                    {questions[currentQuestion]?.type && (
                      <Badge variant="secondary" className="bg-stone-100 text-xs text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        {questions[currentQuestion].type}
                      </Badge>
                    )}
                  </div>
                  <p
                    id={`question-label-${currentQuestion}`}
                    className="text-base font-medium leading-relaxed text-stone-900 dark:text-stone-100 sm:text-lg"
                  >
                    {questions[currentQuestion]?.text}
                  </p>
                </Card>

                {/* Answer options — roving tabIndex, ArrowDown/ArrowUp moves between options */}
                <div
                  className="mb-6 grid gap-2.5"
                  role="radiogroup"
                  aria-labelledby={`question-label-${currentQuestion}`}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    const options = questions[currentQuestion]?.options
                    if (!options || options.length === 0) return
                    let nextIndex: number | null = null
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      const current = answers[currentQuestion] !== undefined ? (answers[currentQuestion] as number) : -1
                      nextIndex = (current + 1) % options.length
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault()
                      const current = answers[currentQuestion] !== undefined ? (answers[currentQuestion] as number) : 0
                      nextIndex = (current - 1 + options.length) % options.length
                    }
                    if (nextIndex !== null) {
                      handleSelectAnswer(currentQuestion, nextIndex)
                      const radios = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')
                      radios[nextIndex]?.focus()
                    }
                  }}
                >
                  {questions[currentQuestion]?.options?.map((option, index) => {
                    const isSelected = answers[currentQuestion] === index
                    const letter = String.fromCharCode(65 + index)
                    const hasSelection = answers[currentQuestion] !== undefined
                    const shouldReceiveFocus = isSelected || (!hasSelection && index === 0)

                    return (
                      <Card
                        key={index}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={shouldReceiveFocus ? 0 : -1}
                        onClick={() => handleSelectAnswer(currentQuestion, index)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelectAnswer(currentQuestion, index)
                          }
                        }}
                        className={`cursor-pointer border p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 dark:border-purple-500 dark:bg-purple-950'
                            : 'border-stone-200 bg-white hover:border-purple-200 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-purple-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150 ${
                              isSelected
                                ? 'bg-purple-600 text-white dark:bg-purple-500'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}
                          >
                            {letter}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-stone-700 dark:text-stone-300'}`}>
                            {option}
                          </span>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {/* Task 38: Keyboard shortcut hints */}
                <p className="mb-5 hidden text-center text-xs text-stone-400 dark:text-stone-600 sm:block">
                  <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:border-stone-700 dark:bg-stone-800">&larr;</kbd>{' '}
                  <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:border-stone-700 dark:bg-stone-800">&rarr;</kbd>{' '}
                  navigate{' · '}
                  <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:border-stone-700 dark:bg-stone-800">1</kbd>–
                  <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:border-stone-700 dark:bg-stone-800">4</kbd>{' '}
                  select{' · '}
                  <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:border-stone-700 dark:bg-stone-800">Enter</kbd>{' '}
                  submit
                </p>

                {/* Task 11: Question navigator */}
                <div className="mb-5 max-h-20 overflow-y-auto">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {Array.from({ length: questionCount }, (_, i) => {
                      const isAnswered = answers[i] !== undefined
                      const isCurrent = i === currentQuestion
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentQuestion(i)}
                          aria-label={`Go to question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
                          aria-current={isCurrent ? 'step' : undefined}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
                            isCurrent
                              ? 'border-2 border-purple-600 bg-white text-purple-700 dark:border-purple-500 dark:bg-stone-900 dark:text-purple-400'
                              : isAnswered
                                ? 'bg-purple-600 text-white dark:bg-purple-500'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Task 13: Submit error with retry */}
                {submitError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">{submitError}</p>
                        {retryCount > 0 && (
                          <p className="mt-0.5 text-xs text-red-500 dark:text-red-500">
                            Retry attempted {retryCount} {retryCount === 1 ? 'time' : 'times'}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-red-200 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <RotateCcw className="mr-1.5 h-3 w-3" />
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task 10: Navigation — submit always visible */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      if (answeredCount < questionCount) {
                        setShowSubmitConfirm(true)
                      } else {
                        handleSubmit()
                      }
                    }}
                    disabled={isSubmitting}
                    className={
                      answeredCount === questionCount
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-stone-700 text-white hover:bg-stone-600 dark:bg-stone-700 dark:hover:bg-stone-600'
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <BarChart3 className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting
                      ? 'Submitting…'
                      : answeredCount < questionCount
                        ? `Submit (${questionCount - answeredCount} left)`
                        : 'Submit Exam'}
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestion === questionCount - 1}
                    className="bg-stone-900 text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                {/* Exit link */}
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setShowExitConfirm(true)}
                    className="flex items-center gap-1.5 text-sm text-stone-400 transition-colors duration-150 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-400"
                  >
                    <X className="h-3.5 w-3.5" />
                    Exit Exam
                  </button>
                </div>

                {/* Exit confirmation dialog */}
                <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Exit exam?</DialogTitle>
                      <DialogDescription>
                        Your progress will be lost. Are you sure you want to exit?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Continue
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => { setShowExitConfirm(false); handleBackToList() }}
                      >
                        Exit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Task 10: Submit confirmation dialog */}
                <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit with unanswered questions?</DialogTitle>
                      <DialogDescription>
                        You have {questionCount - answeredCount} unanswered{' '}
                        {questionCount - answeredCount === 1 ? 'question' : 'questions'}.
                        Submit anyway?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Go Back
                      </DialogClose>
                      <Button
                        className="bg-purple-600 text-white hover:bg-purple-700"
                        onClick={() => { setShowSubmitConfirm(false); handleSubmit() }}
                      >
                        Submit Anyway
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </motion.div>
        )}

        {/* ── RESULTS VIEW ── */}
        {examState === 'results' && examResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6"
          >
            {/* Score card */}
            {(() => {
              const celebration = getScoreCelebration(examResults.score)
              return (
                <Card className="mb-6 border-stone-200 bg-white p-8 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
                  <Trophy className="mx-auto h-10 w-10 text-purple-400 dark:text-purple-500" />
                  <h2 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-100">
                    Exam Complete
                  </h2>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    Completed in {formatTime(elapsedSeconds)}
                  </p>

                  {/* Score circle */}
                  <div className="my-6 flex flex-col items-center">
                    <span className={`text-6xl font-bold tabular-nums ${celebration.circleClass}`}>
                      {examResults.score}%
                    </span>
                    <span className={`mt-1 text-sm font-medium ${celebration.colorClass}`}>
                      {celebration.emoji && <span className="mr-1">{celebration.emoji}</span>}
                      {celebration.message}
                    </span>
                  </div>

                  <Separator className="mb-5 dark:bg-stone-800" />

                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {examResults.correctAnswers}/{examResults.totalQuestions}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">Correct</p>
                    </div>
                    <Separator orientation="vertical" className="h-10 dark:bg-stone-800" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {formatTime(elapsedSeconds)}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">Time taken</p>
                    </div>
                  </div>
                </Card>
              )
            })()}

            {/* Task 14: Question breakdown */}
            <div className="mb-6 grid gap-2.5">
              {examResults.results.map((result, index) => {
                const isExpanded = expandedResults.has(index)
                return (
                  <Card
                    key={result.questionId}
                    className={`overflow-hidden border transition-all duration-150 ${
                      result.correct
                        ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                        : 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'
                    }`}
                  >
                    <button
                      onClick={() =>
                        setExpandedResults((prev) => {
                          const next = new Set(prev)
                          if (next.has(index)) next.delete(index)
                          else next.add(index)
                          return next
                        })
                      }
                      className="flex w-full items-start gap-3 p-4 text-left"
                      aria-expanded={isExpanded}
                    >
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          result.correct
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400'
                        }`}
                      >
                        {result.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                          Question {index + 1}
                          {result.questionText && (
                            <span className="ml-2 font-normal text-stone-500 dark:text-stone-400">
                              {result.questionText.length > 60
                                ? `${result.questionText.slice(0, 60)}…`
                                : result.questionText}
                            </span>
                          )}
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-stone-200/60 px-4 pb-4 pt-3 dark:border-stone-700/40">
                        {result.questionText && (
                          <p className="mb-3 text-sm text-stone-700 dark:text-stone-300">{result.questionText}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 px-3 py-2 dark:bg-emerald-900/40">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                              {result.correctAnswer}
                            </span>
                          </div>
                          {!result.correct && result.userAnswer && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-100/80 px-3 py-2 dark:bg-red-900/40">
                              <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                Your answer: {result.userAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                        {result.explanation && (
                          <div className="mt-3 rounded-lg bg-stone-100 px-3 py-2 dark:bg-stone-800">
                            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                              Explanation
                            </p>
                            <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{result.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Task 21: Focus Areas — weak area identification */}
            {(() => {
              const topicStats = new Map<string, { correct: number; total: number }>()
              examResults.results.forEach((result, index) => {
                const topic = questions[index]?.type || 'General'
                const existing = topicStats.get(topic) || { correct: 0, total: 0 }
                topicStats.set(topic, {
                  correct: existing.correct + (result.correct ? 1 : 0),
                  total: existing.total + 1,
                })
              })

              const areas = Array.from(topicStats.entries()).map(([topic, stats]) => ({
                topic,
                correct: stats.correct,
                total: stats.total,
                percent: Math.round((stats.correct / stats.total) * 100),
              }))

              const weakAreas = areas.filter((a) => a.percent < 70)

              if (areas.length <= 1 && weakAreas.length === 0) return null

              return (
                <Card className="mb-6 border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      Focus Areas
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {areas.map((area) => {
                      const isWeak = area.percent < 70
                      return (
                        <div
                          key={area.topic}
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isWeak && (
                              <Badge className="shrink-0 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                                Needs work
                              </Badge>
                            )}
                            <span className="truncate font-medium text-stone-700 dark:text-stone-300">
                              {area.topic}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 tabular-nums font-medium ${
                              isWeak
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {area.correct}/{area.total} ({area.percent}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })()}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleRetakeExam}
                variant="outline"
                className="flex-1 border-stone-200 text-stone-600 dark:border-stone-700 dark:text-stone-400"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button
                onClick={handleBackToList}
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
              >
                Back to Exams
              </Button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default function ExamPage() {
  return (
    <Suspense>
      <ExamPageInner />
    </Suspense>
  )
}
