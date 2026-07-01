import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([]),
  },
}))

import { apiClient } from '@/lib/api'
import { useDocuments } from '../use-documents'

describe('useDocuments pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls apiClient.get with limit, sortBy, and order query params', async () => {
    renderHook(() =>
      useDocuments({ limit: 4, sortBy: 'updatedAt', order: 'desc' })
    )

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    const calledPath = vi.mocked(apiClient.get).mock.calls[0][0]
    const url = new URL(calledPath, 'http://localhost')

    expect(url.searchParams.get('limit')).toBe('4')
    expect(url.searchParams.get('sortBy')).toBe('updatedAt')
    expect(url.searchParams.get('order')).toBe('desc')
  })

  it('calls apiClient.get with limit and offset query params', async () => {
    renderHook(() => useDocuments({ limit: 10, offset: 20 }))

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    const calledPath = vi.mocked(apiClient.get).mock.calls[0][0]
    const url = new URL(calledPath, 'http://localhost')

    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('offset')).toBe('20')
  })

  it('calls /documents with no query params when no options provided', async () => {
    renderHook(() => useDocuments())

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledTimes(1)
    })

    const calledPath = vi.mocked(apiClient.get).mock.calls[0][0]
    expect(calledPath).toBe('/documents')
  })
})
