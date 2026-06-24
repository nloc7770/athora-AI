'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
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

export function useSessions() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.get<StudySession[]>('/sessions')
      setSessions(data)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setIsLoading(false)
    }
  }, [])

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
