'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface ChatSession {
  id: string
  documentId?: string
  type: 'document_chat' | 'tutor'
  title?: string
  createdAt: string
  updatedAt: string
}

interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface CreateSessionInput {
  documentId?: string
  type: 'document_chat' | 'tutor'
}

interface UseChatSessionsReturn {
  sessions: ChatSession[]
  isLoading: boolean
  error: string | null
  createSession: (input: CreateSessionInput) => Promise<ChatSession>
}

interface UseChatMessagesReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  isStreaming: boolean
}

export function useChatSessions(documentId?: string): UseChatSessionsReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = documentId ? `?documentId=${documentId}` : ''
      const data = await apiClient.get<ChatSession[]>(`/chat/sessions${params}`)
      setSessions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = useCallback(async (input: CreateSessionInput): Promise<ChatSession> => {
    const session = await apiClient.post<ChatSession>('/chat/sessions', input)
    setSessions((prev) => [session, ...prev])
    return session
  }, [])

  return { sessions, isLoading, error, createSession }
}

export function useChatMessages(sessionId: string | null): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const fetchMessages = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await apiClient.get<ChatMessage[]>(
          `/chat/sessions/${sessionId}/messages`
        )
        if (!cancelled) {
          setMessages(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to fetch messages'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchMessages()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!sessionId) return

    // Optimistically add user message
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticUserMessage])
    setIsStreaming(true)

    try {
      const response = await apiClient.post<ChatMessage>(
        `/chat/sessions/${sessionId}/messages`,
        { content }
      )

      // Replace optimistic message and add assistant response
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticUserMessage.id)
        return [...withoutOptimistic, response]
      })
    } catch (err) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id))
      const message = err instanceof Error ? err.message : 'Failed to send message'
      setError(message)
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId])

  return { messages, isLoading, error, sendMessage, isStreaming }
}
