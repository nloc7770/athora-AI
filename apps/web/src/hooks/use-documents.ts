'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'

interface Document {
  id: string
  name: string
  type: string
  courseId?: string
  session_id?: string
  status: string
  file_size?: number
  pageCount?: number
  createdAt: string
  updatedAt: string
}

interface DocumentStatus {
  status: string
  progress: number
  isReady: boolean
}

interface UploadOptions {
  name?: string
  courseId?: string
  sessionId?: string
}

interface UseDocumentsFilters {
  courseId?: string
  type?: string
  sessionId?: string
}

export function useDocuments(filters?: UseDocumentsFilters) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.courseId) params.set('courseId', filters.courseId)
      if (filters?.type) params.set('type', filters.type)
      if (filters?.sessionId) params.set('sessionId', filters.sessionId)

      const query = params.toString()
      const path = query ? `/documents?${query}` : '/documents'
      const data = await apiClient.get<Document[]>(path)
      setDocuments(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters?.courseId, filters?.type, filters?.sessionId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const uploadDocument = useCallback(async (file: File, options?: UploadOptions): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    if (options?.name) formData.append('name', options.name)
    if (options?.courseId) formData.append('courseId', options.courseId)
    if (options?.sessionId) formData.append('sessionId', options.sessionId)

    const uploaded = await apiClient.upload<Document>('/documents/upload', formData)
    setDocuments((prev) => [uploaded, ...prev])
    return uploaded
  }, [])

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))

    try {
      await apiClient.delete(`/documents/${id}`)
    } catch (err) {
      await fetchDocuments()
      throw err
    }
  }, [fetchDocuments])

  return {
    documents,
    isLoading,
    error,
    refresh: fetchDocuments,
    uploadDocument,
    deleteDocument,
  }
}

export function useDocumentStatus(documentId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!documentId) {
      setStatus(null)
      setProgress(0)
      setIsReady(false)
      return
    }

    const poll = async () => {
      try {
        const data = await apiClient.get<{ status: string; progress: number }>(
          `/documents/${documentId}/status`
        )
        setStatus(data.status)
        setProgress(data.progress)
        const ready = data.status === 'ready'
        setIsReady(ready)

        if ((ready || data.status === 'failed') && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } catch {
        // Silently continue polling on transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [documentId])

  return { status, progress, isReady }
}
