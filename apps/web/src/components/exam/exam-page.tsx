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
  Trophy,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { useExams, useExam, useAllExamAttempts } from '@/hooks/use-exams'
import { apiClient } from '@/lib/api'
import { markFirstStudyDone } from '@/hooks/use-first-study'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  PageContainer,
  PageHeader,
  PageToolbar,
  SearchField,
  FilterChip,
  EmptyState,
  ListCard,
  ListSkeleton,
} from '@/components/page'
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

/**
 * The list view is full-bleed. The ACTIVE EXAM and RESULTS views keep a reading
 * measure — a question with four options stretched across 1400px is a worse
 * test than a column. `max-w-2xl` is the same measure /flashcards uses for its
 * review and summary views, so both focused flows sit on the same column.
 */
const FOCUS_MEASURE = 'mx-auto max-w-2xl'

/** ui/progress's default track is `bg-muted`, a light-theme grey. */
const PROGRESS_TRACK = '[&_[data-slot=progress-track]]:bg-[var(--br-bg3)]'

/** Panel recipe shared by the question card and the result blocks. */
const PANEL = 'rounded-xl border border-[var(--br-border)] bg-[var(--br-bg2)]'

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
  const [answers, setAnswers] = useState<Record<number, number>>({})
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
    if (remainingSeconds === null) return 'text-[var(--br-text3)]'
    if (remainingSeconds <= 60) return 'animate-pulse text-red-400'
    if (remainingSeconds <= 300) return 'text-primary'
    return 'text-[var(--br-text3)]'
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
      case 'easy': return 'bg-emerald-500/15 text-emerald-400'
      case 'medium': return 'bg-amber-500/15 text-amber-400'
      case 'hard': return 'bg-red-500/15 text-red-400'
      default: return 'bg-white/[0.06] text-[var(--br-text3)]'
    }
  }

  // Task 42: Score-conditional celebration
  function getScoreCelebration(score: number): { emoji: string; message: string; colorClass: string } {
    if (score >= 90) return { emoji: '🎊', message: 'Outstanding!', colorClass: 'text-emerald-400' }
    if (score >= 70) return { emoji: '🎉', message: 'Great job!', colorClass: 'text-primary' }
    if (score >= 50) return { emoji: '👍', message: 'Good effort!', colorClass: 'text-amber-400' }
    return { emoji: '', message: 'Keep practicing', colorClass: 'text-[var(--br-text3)]' }
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── LIST VIEW ── */}
      {examState === 'list' && (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <PageContainer>
            <PageHeader
              title="Exam Mode"
              subtitle="Test your knowledge with AI-generated questions."
              count={`${exams.length} exam${exams.length !== 1 ? 's' : ''}`}
              icon={<GraduationCap />}
            />

            {!examsLoading && !examsError && exams.length > 0 ? (
              <PageToolbar
                search={
                  <SearchField
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    placeholder="Search exams…"
                    label="Search exams"
                  />
                }
                filters={
                  <>
                    {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
                      <FilterChip
                        key={level}
                        active={difficultyFilter === level}
                        onClick={() => setDifficultyFilter(level)}
                        className="capitalize"
                      >
                        {level}
                      </FilterChip>
                    ))}
                  </>
                }
              />
            ) : null}

            {examsLoading ? (
              <ListSkeleton count={6} variant="card" label="Loading exams" />
            ) : examsError ? (
              <EmptyState
                illustration="offline"
                title="Failed to load exams"
                description={examsError}
                action={<Button onClick={() => refresh()}><RotateCcw />Retry</Button>}
              />
            ) : exams.length === 0 ? (
              <EmptyState
                illustration="exams"
                title="No exams available"
                description="Generate exams from your course materials to start practicing."
                action={
                  <Button onClick={() => { window.location.href = '/sessions' }}>
                    <GraduationCap /> Generate an exam
                  </Button>
                }
              />
            ) : filteredExams.length === 0 ? (
              <EmptyState
                illustration="search"
                title="No exams match your filters"
                description="Try a different keyword or difficulty."
                secondaryAction={
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setDifficultyFilter('all') }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExams.map((examItem) => {
                  const attempts = attemptsByExam[examItem.id]
                  let history = 'Not attempted'
                  if (attempts && attempts.length > 0) {
                    const bestScore = Math.max(...attempts.map((a) => a.score))
                    const lastAttempt = attempts.reduce((latest, a) =>
                      new Date(a.completedAt) > new Date(latest.completedAt) ? a : latest
                    )
                    history = `Best ${bestScore}% · ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'} · Last ${formatRelativeDate(lastAttempt.completedAt)}`
                  }

                  return (
                    <ListCard
                      key={examItem.id}
                      onClick={() => handleStartExam(examItem.id)}
                      icon={<GraduationCap />}
                      title={examItem.name}
                      description={history}
                      meta={
                        <>
                          <span>{examItem.questionCount} questions</span>
                          {examItem.timeLimit && examItem.timeLimit > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span>{examItem.timeLimit} min</span>
                            </>
                          ) : null}
                        </>
                      }
                      badge={
                        examItem.difficulty ? (
                          <Badge className={`capitalize ${getDifficultyColor(examItem.difficulty)}`}>
                            {examItem.difficulty}
                          </Badge>
                        ) : null
                      }
                    />
                  )
                })}
              </div>
            )}
          </PageContainer>
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
        >
          <PageContainer className={FOCUS_MEASURE}>
            {examLoading ? (
              <ListSkeleton count={3} label="Loading questions" />
            ) : questionCount === 0 ? (
              <EmptyState
                illustration="exams"
                title="No questions found"
                description="This exam has no questions yet."
                action={<Button onClick={handleBackToList}>Back to Exams</Button>}
              />
            ) : (
              <>
                <PageHeader
                  title={exam?.name ?? 'Exam'}
                  icon={<GraduationCap />}
                  count={`Q ${currentQuestion + 1} / ${questionCount}`}
                  actions={
                    <>
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-sm font-medium tabular-nums ${getTimerColorClass()}`}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        <Clock className="size-4" aria-hidden />
                        {getTimerDisplay()}
                      </span>
                      <Button variant="ghost" size="lg" onClick={() => setShowExitConfirm(true)}>
                        <X /> Exit Exam
                      </Button>
                    </>
                  }
                />

                <Progress
                  value={progressPercent}
                  aria-label="Questions answered"
                  className={`gap-0 ${PROGRESS_TRACK}`}
                />

                {/* Question */}
                <div className={`${PANEL} p-5 sm:p-7`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                      Question {currentQuestion + 1}
                    </span>
                    {questions[currentQuestion]?.type && (
                      <Badge variant="secondary">{questions[currentQuestion].type}</Badge>
                    )}
                  </div>
                  <p
                    id={`question-label-${currentQuestion}`}
                    className="text-base leading-relaxed font-medium text-[var(--br-text)] sm:text-lg"
                  >
                    {questions[currentQuestion]?.text}
                  </p>
                </div>

                {/* Answer options — roving tabIndex, ArrowDown/ArrowUp moves between options */}
                <div
                  className="grid gap-2.5"
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
                      <div
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
                        className={`cursor-pointer rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/70 ${
                          isSelected
                            ? 'border-[var(--br-accent-line)] bg-[var(--br-accent-wash)]'
                            : 'border-[var(--br-border)] bg-[var(--br-bg2)] hover:border-[var(--br-accent-line)] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/[0.06] text-[var(--br-text3)]'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className={`text-sm font-medium ${isSelected ? 'text-[var(--br-accent-ink)]' : 'text-[var(--br-text2)]'}`}>
                            {option}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Task 38: Keyboard shortcut hints */}
                <p className="hidden text-center text-xs text-[var(--br-text3)] sm:block">
                  <kbd className="rounded border border-[var(--br-border)] bg-[var(--br-bg2)] px-1 py-0.5 font-mono text-[10px]">&larr;</kbd>{' '}
                  <kbd className="rounded border border-[var(--br-border)] bg-[var(--br-bg2)] px-1 py-0.5 font-mono text-[10px]">&rarr;</kbd>{' '}
                  navigate{' · '}
                  <kbd className="rounded border border-[var(--br-border)] bg-[var(--br-bg2)] px-1 py-0.5 font-mono text-[10px]">1</kbd>–
                  <kbd className="rounded border border-[var(--br-border)] bg-[var(--br-bg2)] px-1 py-0.5 font-mono text-[10px]">4</kbd>{' '}
                  select{' · '}
                  <kbd className="rounded border border-[var(--br-border)] bg-[var(--br-bg2)] px-1 py-0.5 font-mono text-[10px]">Enter</kbd>{' '}
                  submit
                </p>

                {/* Task 11: Question navigator */}
                <div className="max-h-20 overflow-y-auto">
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
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/70 ${
                            isCurrent
                              ? 'border-2 border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] text-[var(--br-accent-ink)]'
                              : isAnswered
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white/[0.06] text-[var(--br-text3)] hover:bg-white/[0.12]'
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
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-300">{submitError}</p>
                        {retryCount > 0 && (
                          <p className="mt-0.5 text-xs text-red-400">
                            Retry attempted {retryCount} {retryCount === 1 ? 'time' : 'times'}
                          </p>
                        )}
                      </div>
                      <Button onClick={handleSubmit} disabled={isSubmitting} variant="outline" size="sm">
                        <RotateCcw />
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task 10: Navigation — submit always visible. ONE primary action. */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      if (answeredCount < questionCount) {
                        setShowSubmitConfirm(true)
                      } else {
                        handleSubmit()
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <BarChart3 />}
                    {isSubmitting
                      ? 'Submitting…'
                      : answeredCount < questionCount
                        ? `Submit (${questionCount - answeredCount} left)`
                        : 'Submit Exam'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleNext}
                    disabled={currentQuestion === questionCount - 1}
                  >
                    Next
                    <ChevronRight />
                  </Button>
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
                      <Button onClick={() => { setShowSubmitConfirm(false); handleSubmit() }}>
                        Submit Anyway
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </PageContainer>
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
        >
          <PageContainer className={FOCUS_MEASURE}>
            {(() => {
              const celebration = getScoreCelebration(examResults.score)
              return (
                <PageHeader
                  title="Exam Complete"
                  icon={<Trophy />}
                  count={`${examResults.score}%`}
                  subtitle={
                    <span className={celebration.colorClass}>
                      {celebration.emoji && <span aria-hidden>{celebration.emoji} </span>}
                      {celebration.message} · completed in {formatTime(elapsedSeconds)}
                    </span>
                  }
                  actions={
                    <>
                      <Button size="lg" onClick={handleBackToList}>Back to Exams</Button>
                      <Button variant="outline" size="lg" onClick={handleRetakeExam}>
                        <RotateCcw /> Retake
                      </Button>
                    </>
                  }
                />
              )
            })()}

            {/* Score summary */}
            <div className={`${PANEL} flex flex-wrap items-center justify-center gap-8 p-6 text-center`}>
              <div>
                <p className={`text-5xl font-bold tabular-nums ${getScoreCelebration(examResults.score).colorClass}`}>
                  {examResults.score}%
                </p>
                <p className="mt-1 text-xs text-[var(--br-text3)]">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-[var(--br-text)]">
                  {examResults.correctAnswers}/{examResults.totalQuestions}
                </p>
                <p className="mt-1 text-xs text-[var(--br-text3)]">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-[var(--br-text)]">
                  {formatTime(elapsedSeconds)}
                </p>
                <p className="mt-1 text-xs text-[var(--br-text3)]">Time taken</p>
              </div>
            </div>

            {/* Task 14: Question breakdown */}
            <div className="grid gap-2.5">
              {examResults.results.map((result, index) => {
                const isExpanded = expandedResults.has(index)
                return (
                  <div
                    key={result.questionId}
                    className={`overflow-hidden rounded-xl border ${
                      result.correct
                        ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                        : 'border-red-500/30 bg-red-500/[0.07]'
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
                      className="flex w-full items-start gap-3 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                      aria-expanded={isExpanded}
                    >
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                          result.correct
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {result.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-[var(--br-text)]">
                          Question {index + 1}
                        </span>
                        {result.questionText && (
                          <span className="ml-2 text-sm font-normal text-[var(--br-text3)]">
                            {result.questionText.length > 60
                              ? `${result.questionText.slice(0, 60)}…`
                              : result.questionText}
                          </span>
                        )}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="mt-0.5 size-4 shrink-0 text-[var(--br-text3)]" />
                        : <ChevronDown className="mt-0.5 size-4 shrink-0 text-[var(--br-text3)]" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--br-border)] px-4 pt-3 pb-4">
                        {result.questionText && (
                          <p className="mb-3 text-sm text-[var(--br-text2)]">{result.questionText}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2">
                            <Check className="size-3.5 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">
                              {result.correctAnswer}
                            </span>
                          </div>
                          {!result.correct && result.userAnswer && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-2">
                              <X className="size-3.5 text-red-400" />
                              <span className="text-sm font-medium text-red-300">
                                Your answer: {result.userAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                        {result.explanation && (
                          <div className="mt-3 rounded-lg bg-white/[0.04] px-3 py-2">
                            <p className="text-xs font-semibold tracking-wide text-[var(--br-text3)] uppercase">
                              Explanation
                            </p>
                            <p className="mt-1 text-sm text-[var(--br-text2)]">{result.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                <div className={`${PANEL} p-5`}>
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-400" />
                    <h2 className="text-sm font-semibold text-[var(--br-text)]">Focus Areas</h2>
                  </div>
                  <div className="space-y-2">
                    {areas.map((area) => {
                      const isWeak = area.percent < 70
                      return (
                        <div
                          key={area.topic}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {isWeak && (
                              <Badge className="shrink-0 bg-amber-500/15 text-amber-400">
                                Needs work
                              </Badge>
                            )}
                            <span className="truncate font-medium text-[var(--br-text2)]">
                              {area.topic}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 font-medium tabular-nums ${
                              isWeak ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {area.correct}/{area.total} ({area.percent}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </PageContainer>
        </motion.div>
      )}

    </AnimatePresence>
  )
}

export default function ExamPage() {
  return (
    <Suspense>
      <ExamPageInner />
    </Suspense>
  )
}
