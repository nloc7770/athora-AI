'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface FlashcardSet {
  id: string
  name: string
  courseId?: string
  documentId?: string
  documentName?: string
  cardCount: number
  dueCount?: number
  masteredCount?: number
  createdAt: string
  updatedAt: string
}

interface Flashcard {
  id: string
  setId?: string
  set_id?: string
  front: string
  back: string
  difficulty: string
  nextReviewAt?: string
  next_review?: string | null
  createdAt: string
  created_at?: string
}

interface FlashcardSetWithCards extends FlashcardSet {
  flashcards: Flashcard[]
}

interface UseFlashcardSetsReturn {
  sets: FlashcardSet[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface UseFlashcardSetReturn {
  set: FlashcardSetWithCards | null
  cards: Flashcard[]
  isLoading: boolean
  error: string | null
}

interface UseDueCardsReturn {
  cards: Flashcard[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

interface FlashcardSetApiResponse {
  id: string
  name: string
  course_id?: string
  document_id?: string
  session_id?: string
  flashcards: Array<{ count: number }>
  mastered_count?: number
  mastery_percent?: number
  due_count?: number
  created_at: string
  updated_at?: string
}

function mapFlashcardSet(raw: FlashcardSetApiResponse): FlashcardSet {
  const cardCount = raw.flashcards?.[0]?.count ?? 0
  return {
    id: raw.id,
    name: raw.name,
    courseId: raw.course_id,
    documentId: raw.document_id,
    cardCount,
    dueCount: raw.due_count,
    masteredCount: raw.mastered_count ?? (
      raw.mastery_percent != null && cardCount > 0
        ? Math.round((raw.mastery_percent / 100) * cardCount)
        : undefined
    ),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at ?? raw.created_at,
  }
}

export function useFlashcardSets(courseId?: string, filters?: { documentId?: string; sessionId?: string }): UseFlashcardSetsReturn {
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (courseId) params.set('courseId', courseId)
      if (filters?.documentId) params.set('documentId', filters.documentId)
      if (filters?.sessionId) params.set('sessionId', filters.sessionId)
      const qs = params.toString() ? `?${params.toString()}` : ''
      const data = await apiClient.get<FlashcardSetApiResponse[]>(`/flashcards/sets${qs}`)
      setSets(data.map(mapFlashcardSet))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch flashcard sets'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [courseId, filters?.documentId, filters?.sessionId])

  useEffect(() => {
    fetchSets()
  }, [fetchSets])

  return { sets, isLoading, error, refresh: fetchSets }
}

export function useFlashcardSet(setId: string | null): UseFlashcardSetReturn {
  const [set, setSet] = useState<FlashcardSetWithCards | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!setId) {
      setSet(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchSet = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiClient.get<FlashcardSetWithCards>(
          `/flashcards/sets/${setId}`
        )
        if (!cancelled) {
          setSet(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to fetch flashcard set'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchSet()

    return () => {
      cancelled = true
    }
  }, [setId])

  return {
    set,
    cards: set?.flashcards ?? [],
    isLoading,
    error,
  }
}

export function useDueCards(): UseDueCardsReturn {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDueCards = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.get<Flashcard[]>('/flashcards/due')
      setCards(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch due cards'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDueCards()
  }, [fetchDueCards])

  return { cards, isLoading, error, refresh: fetchDueCards }
}
