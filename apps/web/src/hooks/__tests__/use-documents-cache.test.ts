import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api'
import { clearCache, getCacheGeneration, setCached } from '@/lib/api-cache'
import { useDocuments } from '../use-documents'

const mockGet = vi.mocked(apiClient.get)

describe('useDocuments stale-while-revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCache()
  })

  it('paints cached data on mount, then revalidates', async () => {
    setCached('/documents', [{ id: 'old' }], getCacheGeneration())
    let resolve!: (v: unknown) => void
    mockGet.mockReturnValueOnce(new Promise((r) => { resolve = r }))

    const { result } = renderHook(() => useDocuments())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.documents).toEqual([{ id: 'old' }])

    resolve([{ id: 'new' }])
    await waitFor(() => expect(result.current.documents).toEqual([{ id: 'new' }]))
    expect(mockGet).toHaveBeenCalledWith('/documents')
  })

  it('shows loading when nothing is cached', () => {
    mockGet.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useDocuments())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.documents).toEqual([])
  })
})
