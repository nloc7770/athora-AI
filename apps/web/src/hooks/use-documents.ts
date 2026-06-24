'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'

interface Document {
  id: string
  name: string
  type: string
  courseId?: string
  status: string
  pageCount?: number
  createdAt: string
  updatedAt: string
}

interface DocumentStatus {
  status: string
  progress: number
  isReady: boolean
}

interface UploadDocumentInput {
  file: File
  name?: string
  courseId?: string
}

interface UseDocumentsReturn {
  documents: Document[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  uploadDocument: (input: UploadDocumentInput) => Promise<Document>
  deleteDocument: (id: string) => Promise<void>
}

interface UseDocumentStatusReturn {
  status: string | null
  progress: number
  isReady: boolean
}

export function useDocuments(courseId?: string, type?: string): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (courseId) params.set('courseId', courseId)
      if (type) params.set('type', type)

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
  }, [courseId, type])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const uploadDocument = useCallback(async (input: UploadDocumentInput): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', input.file)
    if (input.name) formData.append('name', input.name)
    if (input.courseId) formData.append('courseId', input.courseId)

    const uploaded = await apiClient.upload<Document>('/documents/upload', formData)
    setDocuments((prev) => [...prev, uploaded])
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

export function useDocumentStatus(documentId: string | null): UseDocumentStatusReturn {
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
        const data = await apiClient.get<DocumentStatus>(
          `/documents/${documentId}/status`
        )
        setStatus(data.status)
        setProgress(data.progress)
        setIsReady(data.isReady)

        if (data.isReady && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } catch {
        // Silently continue polling on transient errors
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [documentId])

  return { status, progress, isReady }
}
