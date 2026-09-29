import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  clearCache,
  getCacheGeneration,
  getCached,
  invalidateCached,
  setCached,
} from '../api-cache'
import { apiClient } from '../api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('api-cache', () => {
  beforeEach(() => clearCache())

  it('stores and returns data per exact path', () => {
    setCached('/documents?limit=4', [1], getCacheGeneration())
    expect(getCached('/documents?limit=4')).toEqual([1])
    expect(getCached('/documents')).toBeUndefined()
  })

  it('invalidates every entry under the same top-level resource only', () => {
    const gen = getCacheGeneration()
    setCached('/documents', ['a'], gen)
    setCached('/documents?limit=4', ['b'], gen)
    setCached('/sessions', ['c'], gen)

    invalidateCached('/documents/123')

    expect(getCached('/documents')).toBeUndefined()
    expect(getCached('/documents?limit=4')).toBeUndefined()
    expect(getCached('/sessions')).toEqual(['c'])
  })

  it('clears everything on an /auth mutation', () => {
    const gen = getCacheGeneration()
    setCached('/documents', ['a'], gen)
    setCached('/sessions', ['c'], gen)

    invalidateCached('/auth/logout')

    expect(getCached('/documents')).toBeUndefined()
    expect(getCached('/sessions')).toBeUndefined()
  })

  it('drops a write that started before an invalidation', () => {
    const startedAt = getCacheGeneration()
    invalidateCached('/documents/1')
    setCached('/documents', ['stale'], startedAt)
    expect(getCached('/documents')).toBeUndefined()
  })
})

describe('apiClient cache integration', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    clearCache()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('caches GET responses and returns an identical body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: '1' }]))
    const data = await apiClient.get('/courses')
    expect(data).toEqual([{ id: '1' }])
    expect(getCached('/courses')).toEqual([{ id: '1' }])
  })

  it('does not cache failed GETs', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 500))
    await expect(apiClient.get('/courses')).rejects.toThrow('nope')
    expect(getCached('/courses')).toBeUndefined()
  })

  it('invalidates the resource after a mutation, even when it fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: '1' }]))
    await apiClient.get('/courses')

    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'bad' }, 400))
    await expect(apiClient.patch('/courses/1', { name: 'x' })).rejects.toThrow('bad')

    expect(getCached('/courses')).toBeUndefined()
  })
})
