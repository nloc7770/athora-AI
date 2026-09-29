'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { BrainApiResponse } from '@/lib/brain-graph'

/**
 * Snapshot fetch of the knowledge brain. No polling — the dashboard
 * refetches on mount and after an upload completes.
 */
export function useBrainGraph() {
  const [data, setData] = useState<BrainApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGraph = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<BrainApiResponse>('/brain/graph')
      setData(res)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load brain graph'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  return { data, isLoading, error, refresh: fetchGraph }
}
