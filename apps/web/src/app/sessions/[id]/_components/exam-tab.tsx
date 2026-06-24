'use client'

import { useState } from 'react'
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

interface ExamTabProps {
  hasReadyDocs: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

export function ExamTab({ hasReadyDocs, generations, isLoading, onGenerate }: ExamTabProps) {
  const filtered = generations.filter((g) => g.type === 'exam')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())
  const [showResults, setShowResults] = useState(false)

  const questions = latest?.result?.questions ?? []
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
    questions.forEach((_: any, idx: number) => allRevealed.add(idx))
    setRevealedAnswers(allRevealed)
    setShowResults(true)
  }

  const handleReset = () => {
    setSelectedAnswers({})
    setRevealedAnswers(new Set())
    setShowResults(false)
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((q: any, idx: number) => {
      const userAnswer = selectedAnswers[idx]
      const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct_answer
      if (userAnswer === correctIdx) correct++
    })
    return correct
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">Upload documents first to generate exams</p>
      </div>
    )
  }

  if ((isLoading || pending) && !latest) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
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
      <div className="mx-auto max-w-3xl space-y-6">
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-center pt-4">
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Exam
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No exam generated yet</p>
        </div>
      </div>
    )
  }

  const score = getScore()
  const answeredCount = Object.keys(selectedAnswers).length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
            Generate New Exam
          </Button>
        </div>
      </div>

      {/* Score card */}
      {showResults && (
        <Card className={`border-2 ${score === totalQuestions ? 'border-emerald-200 bg-emerald-50/50' : score >= totalQuestions * 0.7 ? 'border-amber-200 bg-amber-50/50' : 'border-red-200 bg-red-50/50'}`}>
          <CardContent className="p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{score} / {totalQuestions}</p>
            <p className="text-sm text-gray-500 mt-1">
              {score === totalQuestions
                ? 'Perfect score!'
                : score >= totalQuestions * 0.7
                  ? 'Good job! Keep studying.'
                  : 'Keep practicing, you\'ll get there!'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: any, qIdx: number) => {
          const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct_answer
          const isRevealed = revealedAnswers.has(qIdx)
          const userAnswer = selectedAnswers[qIdx]
          const isCorrect = userAnswer === correctIdx

          return (
            <Card key={qIdx} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                {/* Question header */}
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                    {qIdx + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 pt-0.5">{q.question}</p>
                </div>

                {/* Options */}
                {q.options && (
                  <div className="space-y-2 pl-9">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isSelected = userAnswer === optIdx
                      const isCorrectOption = correctIdx === optIdx

                      let optionClasses = 'border rounded-lg px-4 py-2.5 text-sm transition cursor-pointer flex items-center gap-3'

                      if (isRevealed) {
                        if (isCorrectOption) {
                          optionClasses += ' border-emerald-300 bg-emerald-50 text-emerald-800'
                        } else if (isSelected && !isCorrectOption) {
                          optionClasses += ' border-red-300 bg-red-50 text-red-800'
                        } else {
                          optionClasses += ' border-gray-200 text-gray-400'
                        }
                      } else if (isSelected) {
                        optionClasses += ' border-indigo-300 bg-indigo-50 text-indigo-800'
                      } else {
                        optionClasses += ' border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => selectAnswer(qIdx, optIdx)}
                          className={optionClasses}
                          disabled={isRevealed}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
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
