'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface Course {
  id: string
  name: string
  code?: string
  color?: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface CreateCourseInput {
  name: string
  code?: string
  color?: string
  description?: string
}

interface UpdateCourseInput {
  name?: string
  code?: string
  color?: string
  description?: string
}

interface UseCoursesReturn {
  courses: Course[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  createCourse: (input: CreateCourseInput) => Promise<Course>
  updateCourse: (id: string, input: UpdateCourseInput) => Promise<Course>
  deleteCourse: (id: string) => Promise<void>
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiClient.get<Course[]>('/courses')
      setCourses(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch courses'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const createCourse = useCallback(async (input: CreateCourseInput): Promise<Course> => {
    const created = await apiClient.post<Course>('/courses', input)
    setCourses((prev) => [...prev, created])
    return created
  }, [])

  const updateCourse = useCallback(async (id: string, input: UpdateCourseInput): Promise<Course> => {
    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...input } : c))
    )

    try {
      const updated = await apiClient.patch<Course>(`/courses/${id}`, input)
      setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)))
      return updated
    } catch (err) {
      // Revert on failure
      await fetchCourses()
      throw err
    }
  }, [fetchCourses])

  const deleteCourse = useCallback(async (id: string): Promise<void> => {
    // Optimistic removal
    setCourses((prev) => prev.filter((c) => c.id !== id))

    try {
      await apiClient.delete(`/courses/${id}`)
    } catch (err) {
      // Revert on failure
      await fetchCourses()
      throw err
    }
  }, [fetchCourses])

  return {
    courses,
    isLoading,
    error,
    refresh: fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  }
}
