import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSessions } from '../use-sessions'

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/stores/toast-store', () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}))

import { apiClient } from '@/lib/api'

const mockGet = vi.mocked(apiClient.get)

describe('useSessions pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue([])
  })

  it('calls /sessions with no query params when no params provided', async () => {
    renderHook(() => useSessions())

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/sessions')
    })
  })

  it('appends limit as query param', async () => {
    renderHook(() => useSessions({ limit: 10 }))

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalled()
      const call = mockGet.mock.calls[0][0] as string
      expect(call).toContain('/sessions?')
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('limit')).toBe('10')
    })
  })

  it('appends offset as query param', async () => {
    renderHook(() => useSessions({ offset: 20 }))

    await waitFor(() => {
      const call = mockGet.mock.calls[0][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('offset')).toBe('20')
    })
  })

  it('appends sortBy as query param', async () => {
    renderHook(() => useSessions({ sortBy: 'created_at' }))

    await waitFor(() => {
      const call = mockGet.mock.calls[0][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('sortBy')).toBe('created_at')
    })
  })

  it('appends order as query param', async () => {
    renderHook(() => useSessions({ order: 'desc' }))

    await waitFor(() => {
      const call = mockGet.mock.calls[0][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('order')).toBe('desc')
    })
  })

  it('combines all params into the query string', async () => {
    renderHook(() =>
      useSessions({ limit: 5, offset: 10, sortBy: 'name', order: 'asc' })
    )

    await waitFor(() => {
      const call = mockGet.mock.calls[0][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('limit')).toBe('5')
      expect(params.get('offset')).toBe('10')
      expect(params.get('sortBy')).toBe('name')
      expect(params.get('order')).toBe('asc')
    })
  })

  it('does not include undefined params in query string', async () => {
    renderHook(() => useSessions({ limit: 10 }))

    await waitFor(() => {
      const call = mockGet.mock.calls[0][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.has('offset')).toBe(false)
      expect(params.has('sortBy')).toBe(false)
      expect(params.has('order')).toBe(false)
    })
  })

  it('refetches when params change', async () => {
    const { rerender } = renderHook(
      (props: { limit?: number; offset?: number }) => useSessions(props),
      { initialProps: { limit: 5, offset: 0 } }
    )

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    rerender({ limit: 5, offset: 5 })

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2)
      const call = mockGet.mock.calls[1][0]
      const params = new URLSearchParams(call.split('?')[1])
      expect(params.get('offset')).toBe('5')
    })
  })
})
