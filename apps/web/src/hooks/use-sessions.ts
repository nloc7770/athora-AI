'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { getCached } from '@/lib/api-cache'
import { useToastStore } from '@/stores/toast-store'

interface StudySession {
  id: string
  user_id: string
  name: string
  description: string | null
  ragflow_dataset_id: string | null
  status: string
  created_at: string
  updated_at: string
  document_count?: number
}

interface SessionWithDocs extends StudySession {
  documents: Array<{
    id: string
    name: string
    type: string
    status: string
    file_size: number | null
    created_at: string
  }>
}

export interface UseSessionsParams {
  limit?: number
  offset?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

export function useSessions(params?: UseSessionsParams) {
  const searchParams = new URLSearchParams()
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))
  if (params?.offset !== undefined) searchParams.set('offset', String(params.offset))
  if (params?.sortBy !== undefined) searchParams.set('sortBy', params.sortBy)
  if (params?.order !== undefined) searchParams.set('order', params.order)
  const query = searchParams.toString()
  const path = query ? `/sessions?${query}` : '/sessions'

  // Stale-while-revalidate: paint the last response for this exact path, then refetch.
  const [sessions, setSessions] = useState<StudySession[]>(() => getCached<StudySession[]>(path) ?? [])
  const [isLoading, setIsLoading] = useState(() => getCached(path) === undefined)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const cached = getCached<StudySession[]>(path)
      if (cached) setSessions(cached)
      setIsLoading(cached === undefined)
      const data = await apiClient.get<StudySession[]>(path)
      setSessions(data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [path])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = async (name: string, description?: string) => {
    try {
      const data = await apiClient.post<StudySession>('/sessions', { name, description })
      setSessions((prev) => [{ ...data, document_count: 0 }, ...prev])
      return data
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create session'
      useToastStore.getState().addToast(message, 'error')
      throw err
    }
  }

  const deleteSession = async (id: string) => {
    const prev = sessions
    try {
      setSessions((s) => s.filter((session) => session.id !== id))
      await apiClient.delete(`/sessions/${id}`)
    } catch {
      setSessions(prev)
      useToastStore.getState().addToast('Failed to delete session', 'error')
    }
  }

  const archiveSession = async (id: string) => {
    await apiClient.patch(`/sessions/${id}`, { status: 'archived' })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return { sessions, isLoading, error, refresh: fetchSessions, createSession, deleteSession, archiveSession }
}

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<SessionWithDocs | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return
    try {
      setIsLoading(true)
      const data = await apiClient.get<SessionWithDocs>(`/sessions/${sessionId}`)
      setSession(data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load session')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return { session, documents: session?.documents ?? [], isLoading, error, refresh: fetchSession }
}
