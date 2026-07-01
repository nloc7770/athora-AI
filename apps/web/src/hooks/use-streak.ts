"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "athora_streak_dates"

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function getStoredDates(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((d): d is string => typeof d === "string")
  } catch {
    return []
  }
}

function saveDates(dates: string[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dates))
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  const unique = [...new Set(dates)].sort().reverse()
  const today = getTodayISO()

  if (unique[0] !== today) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const current = new Date(unique[i - 1])
    const previous = new Date(unique[i])
    const diffMs = current.getTime() - previous.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

interface UseStreakReturn {
  streak: number
  recordStreak: () => void
}

export function useStreak(): UseStreakReturn {
  const [streak, setStreak] = useState(0)

  const recordStreak = useCallback(() => {
    const today = getTodayISO()
    const dates = getStoredDates()

    if (!dates.includes(today)) {
      const updated = [...dates, today]
      saveDates(updated)
      setStreak(calculateStreak(updated))
    }
  }, [])

  useEffect(() => {
    const today = getTodayISO()
    const dates = getStoredDates()

    if (!dates.includes(today)) {
      const updated = [...dates, today]
      saveDates(updated)
      setStreak(calculateStreak(updated))
    } else {
      setStreak(calculateStreak(dates))
    }
  }, [])

  return { streak, recordStreak }
}
