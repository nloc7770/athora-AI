'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface Exam {
  id: string
  name: string
  courseId?: string
  questionCount: number
  difficulty?: string
  timeLimit?: number
  createdAt: string
  updatedAt: string
}

interface ExamQuestion {
  id: string
  text: string
  type: string
  options?: string[]
  correctAnswer?: string
}

interface ExamWithQuestions extends Exam {
  questions: ExamQuestion[]
}

interface ExamAttempt {
  id: string
  examId: string
  score: number
  totalQuestions: number
  completedAt: string
  timeTaken?: number
}

interface UseExamsReturn {
  exams: Exam[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface UseExamReturn {
  exam: ExamWithQuestions | null
  questions: ExamQuestion[]
  isLoading: boolean
  error: string | null
}

interface UseExamAttemptsReturn {
  attempts: ExamAttempt[]
  isLoading: boolean
  error: string | null
}

export function useExams(courseId?: string): UseExamsReturn {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExams = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = courseId ? `?courseId=${courseId}` : ''
      const data = await apiClient.get<Exam[]>(`/exams${params}`)
      setExams(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch exams'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  return { exams, isLoading, error, refresh: fetchExams }
}

export function useExam(examId: string | null): UseExamReturn {
  const [exam, setExam] = useState<ExamWithQuestions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) {
      setExam(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchExam = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiClient.get<ExamWithQuestions>(`/exams/${examId}`)
        if (!cancelled) {
          setExam(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to fetch exam'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchExam()

    return () => {
      cancelled = true
    }
  }, [examId])

  return {
    exam,
    questions: exam?.questions ?? [],
    isLoading,
    error,
  }
}

export function useAllExamAttempts(examIds: string[]): { attemptsByExam: Record<string, ExamAttempt[]>; isLoading: boolean } {
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, ExamAttempt[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (examIds.length === 0) {
      setAttemptsByExam({})
      return
    }

    let cancelled = false

    const fetchAll = async () => {
      setIsLoading(true)
      const results = await Promise.allSettled(
        examIds.map((id) => apiClient.get<ExamAttempt[]>(`/exams/${id}/attempts`).then((data) => ({ id, data })))
      )
      if (cancelled) return

      const map: Record<string, ExamAttempt[]> = {}
      for (const result of results) {
        if (result.status === 'fulfilled') {
          map[result.value.id] = result.value.data
        }
      }
      setAttemptsByExam(map)
      setIsLoading(false)
    }

    fetchAll()

    return () => { cancelled = true }
  }, [examIds.join(',')])

  return { attemptsByExam, isLoading }
}

export function useExamAttempts(examId: string | null): UseExamAttemptsReturn {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!examId) {
      setAttempts([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchAttempts = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiClient.get<ExamAttempt[]>(`/exams/${examId}/attempts`)
        if (!cancelled) {
          setAttempts(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to fetch attempts'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchAttempts()

    return () => {
      cancelled = true
    }
  }, [examId])

  return { attempts, isLoading, error }
}
