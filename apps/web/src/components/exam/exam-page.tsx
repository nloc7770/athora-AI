'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Clock,
  ChevronRight,
  Check,
  X,
  BarChart3,
  Loader2,
  FileQuestion,
  Trophy,
  RotateCcw,
} from 'lucide-react'
import { useExams, useExam } from '@/hooks/use-exams'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ExamState = 'list' | 'active' | 'results'

interface SubmitResponse {
  score: number
  totalQuestions: number
  correctAnswers: number
  results: {
    questionId: string
    correct: boolean
    correctAnswer: string
    userAnswer: string
  }[]
}

export default function ExamPage() {
  const [examState, setExamState] = useState<ExamState>('list')
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [examResults, setExamResults] = useState<SubmitResponse | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { exams, isLoading: examsLoading, refresh } = useExams()
  const { exam, questions, isLoading: examLoading } = useExam(selectedExamId)

  const questionCount = questions.length

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

  function handleStartExam(examId: string) {
    setSelectedExamId(examId)
    setExamState('active')
    setCurrentQuestion(0)
    setAnswers({})
    setElapsedSeconds(0)
    setExamResults(null)
    setSubmitError(null)
    startTimer()
  }

  function handleSelectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
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
      setExamState('results')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit exam'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBackToList() {
    stopTimer()
    setExamState('list')
    setSelectedExamId(null)
    setExamResults(null)
    setSubmitError(null)
    refresh()
  }

  function handleRetakeExam() {
    if (!selectedExamId) return
    handleStartExam(selectedExamId)
  }

  const answeredCount = Object.keys(answers).length
  const progressPercent = questionCount > 0
    ? (answeredCount / questionCount) * 100
    : 0

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-50 text-emerald-700'
      case 'medium':
        return 'bg-amber-50 text-amber-700'
      case 'hard':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-zinc-100 text-zinc-600'
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50">
      <AnimatePresence mode="wait">
        {examState === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
          >
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Exam Mode
                </h1>
                <p className="text-sm text-zinc-500">
                  Test your knowledge with AI-generated questions
                </p>
              </div>
            </div>

            {/* Exam List */}
            {examsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">Loading exams...</p>
              </div>
            ) : exams.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-zinc-200 bg-white p-12 text-center">
                <FileQuestion className="h-12 w-12 text-zinc-300" />
                <h2 className="mt-4 text-lg font-medium text-zinc-700">
                  No exams available
                </h2>
                <p className="mt-2 max-w-sm text-sm text-zinc-500">
                  Generate exams from your course materials to start practicing.
                  Upload documents and use AI to create targeted questions.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {exams.map((examItem) => (
                  <Card
                    key={examItem.id}
                    className="cursor-pointer border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm"
                    onClick={() => handleStartExam(examItem.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-zinc-900">
                          {examItem.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-zinc-100 text-xs text-zinc-600"
                          >
                            {examItem.questionCount} questions
                          </Badge>
                          {examItem.difficulty && (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getDifficultyColor(examItem.difficulty)}`}
                            >
                              {examItem.difficulty}
                            </Badge>
                          )}
                          {examItem.timeLimit && examItem.timeLimit > 0 && (
                            <Badge
                              variant="secondary"
                              className="bg-zinc-100 text-xs text-zinc-600"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              {examItem.timeLimit} min
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-400" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {examState === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:px-6"
          >
            {examLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                <p className="mt-3 text-sm text-zinc-500">
                  Loading questions...
                </p>
              </div>
            ) : questionCount === 0 ? (
              <Card className="flex flex-col items-center justify-center border-zinc-200 bg-white p-12 text-center">
                <FileQuestion className="h-12 w-12 text-zinc-300" />
                <h2 className="mt-4 text-lg font-medium text-zinc-700">
                  No questions found
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                  This exam has no questions yet.
                </p>
                <Button
                  onClick={handleBackToList}
                  className="mt-4 bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Back to Exams
                </Button>
              </Card>
            ) : (
              <>
                {/* Top Bar */}
                <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span className="font-mono font-medium">
                        {formatTime(elapsedSeconds)}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <span className="text-sm font-medium text-zinc-700">
                      Question {currentQuestion + 1} of {questionCount}
                    </span>
                  </div>
                  {exam && (
                    <Badge
                      variant="secondary"
                      className="bg-zinc-100 text-xs font-medium text-zinc-600"
                    >
                      {exam.name}
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <Progress value={progressPercent} className="h-1.5" />
                </div>

                {/* Question Card */}
                <Card className="mb-6 border-zinc-200 bg-white p-8 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Question {currentQuestion + 1}
                    </span>
                    {questions[currentQuestion]?.type && (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-xs text-zinc-500"
                      >
                        {questions[currentQuestion].type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-medium leading-relaxed text-zinc-900">
                    {questions[currentQuestion]?.text}
                  </p>
                </Card>

                {/* Answer Options */}
                <div className="mb-8 grid gap-3">
                  {questions[currentQuestion]?.options?.map(
                    (option, index) => {
                      const isSelected = answers[currentQuestion] === index
                      const letter = String.fromCharCode(65 + index)

                      return (
                        <Card
                          key={index}
                          onClick={() =>
                            handleSelectAnswer(currentQuestion, index)
                          }
                          className={`cursor-pointer border p-4 transition-all ${
                            isSelected
                              ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {letter}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? 'text-white' : 'text-zinc-700'
                              }`}
                            >
                              {option}
                            </span>
                          </div>
                        </Card>
                      )
                    }
                  )}
                </div>

                {/* Question Dots */}
                <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
                  {Array.from({ length: questionCount }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestion(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        i === currentQuestion
                          ? 'scale-125 bg-zinc-900'
                          : answers[i] !== undefined
                            ? 'bg-zinc-400'
                            : 'bg-zinc-200'
                      }`}
                      aria-label={`Go to question ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Submit Error */}
                {submitError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="border-zinc-200 text-zinc-600"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-3">
                    {answeredCount === questionCount && (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <BarChart3 className="mr-2 h-4 w-4" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                      </Button>
                    )}
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestion === questionCount - 1}
                      className="bg-zinc-900 text-white hover:bg-zinc-800"
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Exit button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
                  >
                    <X className="h-3.5 w-3.5" />
                    Exit Exam
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {examState === 'results' && examResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
          >
            {/* Results Header */}
            <Card className="mb-6 border-zinc-200 bg-white p-8 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-amber-500" />
              <h2 className="mt-4 text-2xl font-semibold text-zinc-900">
                Exam Complete
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                You completed the exam in {formatTime(elapsedSeconds)}
              </p>

              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-zinc-900">
                    {examResults.score}%
                  </p>
                  <p className="text-xs text-zinc-500">Score</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-zinc-900">
                    {examResults.correctAnswers}/{examResults.totalQuestions}
                  </p>
                  <p className="text-xs text-zinc-500">Correct</p>
                </div>
              </div>
            </Card>

            {/* Question Results */}
            <div className="mb-6 grid gap-3">
              {examResults.results.map((result, index) => (
                <Card
                  key={result.questionId}
                  className={`border p-4 ${
                    result.correct
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        result.correct
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {result.correct ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-800">
                        Question {index + 1}
                      </p>
                      {!result.correct && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Correct answer:{' '}
                          <span className="font-medium text-emerald-700">
                            {result.correctAnswer}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRetakeExam}
                variant="outline"
                className="flex-1 border-zinc-200 text-zinc-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retake Exam
              </Button>
              <Button
                onClick={handleBackToList}
                className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
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
