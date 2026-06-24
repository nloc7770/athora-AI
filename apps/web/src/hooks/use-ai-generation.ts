'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'

type GenerationType = 'summary' | 'flashcards' | 'exam' | 'mindmap'

interface AiGeneration {
  id: string
  documentId: string
  type: GenerationType
  status: string
  result?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface UseAiGenerationReturn {
  generations: AiGeneration[]
  isLoading: boolean
  error: string | null
  generate: (type: GenerationType) => Promise<AiGeneration>
  refresh: () => Promise<void>
}

const POLL_INTERVAL_MS = 5000
const ACTIVE_STATUSES = ['pending', 'processing']

function hasActiveGenerations(generations: AiGeneration[]): boolean {
  return generations.some((g) => ACTIVE_STATUSES.includes(g.status))
}

export function useAiGeneration(documentId: string | null): UseAiGenerationReturn {
  const [generations, setGenerations] = useState<AiGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const fetchGenerations = useCallback(async () => {
    if (!documentId) {
      setGenerations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.get<AiGeneration[]>(
        `/ai-generation/document/${documentId}`
      )
      setGenerations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch generations'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  // Poll silently without resetting isLoading
  const pollGenerations = useCallback(async () => {
    if (!documentId) return

    try {
      const data = await apiClient.get<AiGeneration[]>(
        `/ai-generation/document/${documentId}`
      )
      setGenerations(data)
    } catch {
      // Silently ignore poll errors to avoid disrupting UI
    }
  }, [documentId])

  // Start or stop polling based on generation statuses
  useEffect(() => {
    if (hasActiveGenerations(generations)) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(pollGenerations, POLL_INTERVAL_MS)
      }
    } else {
      clearPolling()
    }
  }, [generations, pollGenerations, clearPolling])

  // Initial fetch
  useEffect(() => {
    fetchGenerations()
  }, [fetchGenerations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling()
    }
  }, [clearPolling])

  const generate = useCallback(async (type: GenerationType): Promise<AiGeneration> => {
    if (!documentId) {
      throw new Error('No document selected')
    }

    const generation = await apiClient.post<AiGeneration>('/ai-generation/generate', {
      documentId,
      type,
    })

    setGenerations((prev) => [generation, ...prev])
    return generation
  }, [documentId])

  return {
    generations,
    isLoading,
    error,
    generate,
    refresh: fetchGenerations,
  }
}
