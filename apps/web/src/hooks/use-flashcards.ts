'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface FlashcardSet {
  id: string
  name: string
  courseId?: string
  documentId?: string
  cardCount: number
  createdAt: string
  updatedAt: string
}

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: string
  nextReviewAt?: string
  createdAt: string
}

interface FlashcardSetWithCards extends FlashcardSet {
  cards: Flashcard[]
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

export function useFlashcardSets(courseId?: string): UseFlashcardSetsReturn {
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = courseId ? `?courseId=${courseId}` : ''
      const data = await apiClient.get<FlashcardSet[]>(`/flashcards/sets${params}`)
      setSets(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch flashcard sets'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

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
    cards: set?.cards ?? [],
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
