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
  sessionId?: string
  type: 'document_chat' | 'tutor'
}

interface UseChatSessionsReturn {
  sessions: ChatSession[]
  isLoading: boolean
  error: string | null
  createSession: (input: CreateSessionInput) => Promise<ChatSession>
  deleteSession: (sessionId: string) => Promise<void>
}

interface UseChatMessagesReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string, courseContext?: string, overrideSessionId?: string) => Promise<void>
  isStreaming: boolean
}

interface ChatSessionsConfig {
  sessionId?: string
  documentId?: string
}

export function useChatSessions(config?: string | ChatSessionsConfig): UseChatSessionsReturn {
  // Support legacy string argument as documentId for backward compatibility
  const resolvedConfig: ChatSessionsConfig | undefined =
    typeof config === 'string' ? { documentId: config } : config

  const sessionId = resolvedConfig?.sessionId
  const documentId = resolvedConfig?.documentId

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (sessionId) searchParams.set('sessionId', sessionId)
      if (documentId) searchParams.set('documentId', documentId)
      const query = searchParams.toString()
      const params = query ? `?${query}` : ''
      const data = await apiClient.get<ChatSession[]>(`/chat/sessions${params}`)
      setSessions(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sessions'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, documentId])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const createSession = useCallback(async (input: CreateSessionInput): Promise<ChatSession> => {
    const session = await apiClient.post<ChatSession>('/chat/sessions', input)
    setSessions((prev) => [session, ...prev])
    return session
  }, [])

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/chat/sessions/${sessionId}`)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }, [])

  return { sessions, isLoading, error, createSession, deleteSession }
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

    // Don't refetch while streaming — would overwrite optimistic messages
    if (isStreaming) return

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
  }, [sessionId, isStreaming])

  const sendMessage = useCallback(async (content: string, courseContext?: string, overrideSessionId?: string): Promise<void> => {
    const activeId = overrideSessionId || sessionId
    if (!activeId) return

    // Optimistically add user message
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticUserMessage])
    setIsStreaming(true)
    setError(null)

    try {
      const body: { content: string; courseContext?: string } = { content }
      if (courseContext) {
        body.courseContext = courseContext
      }

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

      // Try streaming first
      let streamWorked = false
      try {
        const response = await fetch(`${BASE_URL}/chat/sessions/${activeId}/messages/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        if (response.ok && response.body) {
          streamWorked = true

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''
          let assistantMessageAdded = false

          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            sessionId: activeId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            const lines = text.split('\n')

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue

              try {
                const parsed = JSON.parse(jsonStr)
                if (parsed.done) continue
                if (parsed.error) throw new Error(parsed.error)
                if (parsed.content) {
                  fullContent += parsed.content
                  if (!assistantMessageAdded) {
                    assistantMessageAdded = true
                    setMessages((prev) => [...prev, { ...assistantMessage, content: fullContent }])
                  } else {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                      )
                    )
                  }
                }
              } catch (parseErr) {
                if (parseErr instanceof Error && parseErr.message !== 'Stream failed') {
                  // Skip malformed lines silently
                }
              }
            }
          }
        }
      } catch {
        // Stream failed, fall through to non-stream
      }

      // Fallback: non-streaming
      if (!streamWorked) {
        const response = await apiClient.post<ChatMessage>(
          `/chat/sessions/${activeId}/messages`,
          body
        )
        setMessages((prev) => [...prev, response])
      }

      // Confirm optimistic user message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticUserMessage.id ? { ...m, id: `confirmed-${Date.now()}` } : m
        )
      )
    } catch (err) {
      // Remove optimistic + partial assistant on failure
      setMessages((prev) => prev.filter((m) =>
        m.id !== optimisticUserMessage.id && !(m.role === 'assistant' && m.content === '')
      ))
      const message = err instanceof Error ? err.message : 'Failed to send message'
      setError(message)
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId])

  return { messages, isLoading, error, sendMessage, isStreaming }
}
