'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  Loader2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Task 41: Proper typed interfaces
interface ExamOption {
  text: string
  index: number
}

interface ExamQuestion {
  question: string
  options: string[]
  correctAnswer?: number
  correct_answer?: number
}

interface ExamGeneration {
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: {
    questions: ExamQuestion[]
  }
}

interface ExamTabProps {
  hasReadyDocs: boolean
  hasProcessingDocs?: boolean
  generations: ExamGeneration[]
  isLoading: boolean
  onGenerate: () => void
}

// Task 42: Score-conditional celebration
function getScoreCelebration(score: number, total: number): { emoji: string; message: string; colorClass: string } {
  const percentage = total > 0 ? (score / total) * 100 : 0

  if (percentage >= 90) {
    return { emoji: '🎊', message: 'Outstanding!', colorClass: 'text-emerald-600' }
  }
  if (percentage >= 70) {
    return { emoji: '🎉', message: 'Great job!', colorClass: 'text-purple-600' }
  }
  if (percentage >= 50) {
    return { emoji: '👍', message: 'Good effort!', colorClass: 'text-amber-600' }
  }
  return { emoji: '', message: 'Keep practicing', colorClass: 'text-zinc-600' }
}

export function ExamTab({ hasReadyDocs, hasProcessingDocs, generations, isLoading, onGenerate }: ExamTabProps) {
  const filtered = generations.filter((g) => g.type === 'exam')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)

  const questions: ExamQuestion[] = latest?.result?.questions ?? []
  const totalQuestions = questions.length

  const selectAnswer = (questionIdx: number, optionIdx: number) => {
    if (revealedAnswers.has(questionIdx)) return
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }))
  }

  const toggleReveal = (questionIdx: number) => {
    setRevealedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(questionIdx)) {
        next.delete(questionIdx)
      } else {
        next.add(questionIdx)
      }
      return next
    })
  }

  const handleSubmitAll = () => {
    const allRevealed = new Set<number>()
    questions.forEach((_, idx) => allRevealed.add(idx))
    setRevealedAnswers(allRevealed)
    setShowResults(true)
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setRevealedAnswers(new Set())
    setShowResults(false)
    setCurrentQuestionIdx(0)
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((q, idx) => {
      const userAnswer = selectedAnswers[idx]
      const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct_answer
      if (userAnswer === correctIdx) correct++
    })
    return correct
  }

  // Task 38: Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showResults || totalQuestions === 0) return

    // Ignore if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))
        break
      case 'ArrowRight':
        e.preventDefault()
        setCurrentQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))
        break
      case '1':
      case '2':
      case '3':
      case '4': {
        const optionIdx = parseInt(e.key) - 1
        const currentQ = questions[currentQuestionIdx]
        if (currentQ?.options && optionIdx < currentQ.options.length) {
          selectAnswer(currentQuestionIdx, optionIdx)
        }
        break
      }
      case 'Enter': {
        const answeredCount = Object.keys(selectedAnswers).length
        if (answeredCount === totalQuestions && !showResults) {
          handleSubmitAll()
        }
        break
      }
    }
  }, [showResults, totalQuestions, currentQuestionIdx, questions, selectedAnswers])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!hasReadyDocs && hasProcessingDocs) {
    return (
      <div className="mx-auto flex w-full flex-col items-center justify-center px-3 pt-20 sm:max-w-2xl sm:px-6 lg:max-w-3xl">
        <div className="rounded-full bg-purple-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Processing documents...</p>
        <p className="text-xs text-gray-400 mt-1">You can generate an exam once processing is complete</p>
      </div>
    )
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex w-full flex-col items-center justify-center px-3 pt-20 sm:max-w-2xl sm:px-6 lg:max-w-3xl">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">Upload documents first to generate exams</p>
      </div>
    )
  }

  if ((isLoading || pending) && !latest) {
    return (
      <div className="mx-auto flex w-full flex-col items-center justify-center px-3 pt-20 sm:max-w-2xl sm:px-6 lg:max-w-3xl">
        <div className="rounded-full bg-indigo-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Generating exam...</p>
        <p className="text-xs text-gray-400 mt-1">Creating questions from your documents</p>
      </div>
    )
  }

  if (failed && !latest) {
    return (
      <div className="mx-auto w-full space-y-6 px-3 sm:max-w-2xl sm:px-6 lg:max-w-3xl">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Exam generation failed</p>
          <p className="text-xs text-gray-400 mt-1">Something went wrong. Please try again.</p>
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!latest || totalQuestions === 0) {
    return (
      <div className="mx-auto w-full space-y-6 px-3 sm:max-w-2xl sm:px-6 lg:max-w-3xl">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Generate an exam from your session documents</p>
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Exam'}
          </Button>
        </div>
      </div>
    )
  }

  const score = getScore()
  const answeredCount = Object.keys(selectedAnswers).length
  const celebration = getScoreCelebration(score, totalQuestions)

  return (
    // Task 39: Responsive max-width layout
    <div className="mx-auto w-full space-y-4 px-3 sm:max-w-2xl sm:space-y-6 sm:px-6 lg:max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            {totalQuestions} questions
          </Badge>
          {answeredCount > 0 && !showResults && (
            <span className="text-xs text-gray-400">
              {answeredCount}/{totalQuestions} answered
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {showResults && (
            <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-3 w-3" />
            <span className="hidden sm:inline">Generate New Exam</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Score card - Task 42: Score-conditional celebration */}
      {showResults && (
        <Card className={`border-2 ${score / totalQuestions >= 0.9 ? 'border-emerald-200 bg-emerald-50/50' : score / totalQuestions >= 0.7 ? 'border-purple-200 bg-purple-50/50' : score / totalQuestions >= 0.5 ? 'border-amber-200 bg-amber-50/50' : 'border-zinc-200 bg-zinc-50/50'}`}>
          <CardContent className="p-4 text-center sm:p-5">
            <p className="text-2xl font-bold text-gray-900">{score} / {totalQuestions}</p>
            <p className={`text-sm mt-1 font-medium ${celebration.colorClass}`}>
              {celebration.emoji && <span className="mr-1">{celebration.emoji}</span>}
              {celebration.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task 38: Keyboard shortcut hints */}
      {!showResults && totalQuestions > 0 && (
        <p className="text-center text-xs text-zinc-400">
          <span className="hidden sm:inline">
            Use <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">&larr;</kbd>{' '}
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">&rarr;</kbd> to navigate,{' '}
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">1</kbd>-
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">4</kbd> to select,{' '}
            <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to submit
          </span>
        </p>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => {
          const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct_answer
          const isRevealed = revealedAnswers.has(qIdx)
          const userAnswer = selectedAnswers[qIdx]

          return (
            <Card key={qIdx} className="overflow-hidden">
              <CardContent className="p-4 space-y-3 sm:p-5">
                {/* Question header */}
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                    {qIdx + 1}
                  </span>
                  <p
                    id={`exam-tab-question-${qIdx}`}
                    className="text-sm font-medium text-gray-900 pt-0.5 sm:text-base"
                  >
                    {q.question}
                  </p>
                </div>

                {/* Options - Task 37: micro-animation on selection */}
                {q.options && (
                  <div
                    className="space-y-2 pl-9"
                    role="radiogroup"
                    aria-labelledby={`exam-tab-question-${qIdx}`}
                  >
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx
                      const isCorrectOption = correctIdx === optIdx

                      let optionClasses = 'border rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out cursor-pointer flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:px-4 sm:py-2.5'

                      if (isRevealed) {
                        if (isCorrectOption) {
                          optionClasses += ' border-emerald-300 bg-emerald-50 text-emerald-800'
                        } else if (isSelected && !isCorrectOption) {
                          optionClasses += ' border-red-300 bg-red-50 text-red-800'
                        } else {
                          optionClasses += ' border-gray-200 text-gray-400'
                        }
                      } else if (isSelected) {
                        optionClasses += ' border-indigo-400 bg-indigo-50 text-indigo-800 scale-[1.02] shadow-sm'
                      } else {
                        optionClasses += ' border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }

                      return (
                        <button
                          key={optIdx}
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => selectAnswer(qIdx, optIdx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              selectAnswer(qIdx, optIdx)
                            }
                          }}
                          className={optionClasses}
                          disabled={isRevealed}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-200 ${
                            isSelected && !isRevealed ? 'border-indigo-400 bg-indigo-500 text-white' :
                            isRevealed && isCorrectOption ? 'border-emerald-400 bg-emerald-500 text-white' :
                            isRevealed && isSelected && !isCorrectOption ? 'border-red-400 bg-red-500 text-white' :
                            'border-gray-300 text-gray-500'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1 text-left">{opt}</span>
                          {isRevealed && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          {isRevealed && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Reveal button */}
                <div className="pl-9">
                  <button
                    onClick={() => toggleReveal(qIdx)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition font-medium"
                  >
                    {isRevealed ? 'Hide answer' : 'Reveal answer'}
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Submit all button */}
      {!showResults && answeredCount > 0 && (
        <div className="flex justify-center pb-8">
          <Button onClick={handleSubmitAll} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Submit All ({answeredCount}/{totalQuestions})
          </Button>
        </div>
      )}
    </div>
  )
}
