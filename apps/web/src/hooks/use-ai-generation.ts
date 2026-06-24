'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useAiGeneration(documentId: string | null): UseAiGenerationReturn {
  const [generations, setGenerations] = useState<AiGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    fetchGenerations()
  }, [fetchGenerations])

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
