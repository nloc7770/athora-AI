'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

const READ_AT_KEY = 'athora-notifications-read-at'

export interface ActivityNotification {
  id: string
  activity_type: 'document_upload' | 'exam_generation' | 'flashcard_generation'
  metadata: Record<string, unknown>
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [readAt, setReadAt] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(READ_AT_KEY)
    setReadAt(stored)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiClient.get<ActivityNotification[]>('/analytics/activities')
      setNotifications(data)
    } catch {
      // Silently ignore — notification fetch failure is non-critical
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => {
    if (!readAt) return true
    return new Date(n.created_at) > new Date(readAt)
  }).length

  function markAllRead() {
    const now = new Date().toISOString()
    localStorage.setItem(READ_AT_KEY, now)
    setReadAt(now)
  }

  return { notifications, unreadCount, isLoading, markAllRead, refresh: fetchNotifications }
}
