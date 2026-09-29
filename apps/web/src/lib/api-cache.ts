/**
 * Tiny in-memory GET cache for stale-while-revalidate hooks.
 *
 * apiClient.get writes every successful response here; list hooks seed their
 * state from it on mount so the last-known data paints instantly while their
 * normal fetch revalidates in the background. Mutations drop every entry under
 * the same top-level resource (`/documents/1` clears `/documents?limit=4`), and
 * any `/auth/*` mutation clears everything so one account never sees another's
 * data.
 *
 * Browser-only: the module is shared across requests on the server, so writes
 * are ignored there and reads always miss.
 */

// ponytail: FIFO cap, not LRU — plenty for a handful of list endpoints.
const MAX_ENTRIES = 100

const cache = new Map<string, unknown>()

/** Bumped on every invalidation so an in-flight GET can't write back stale data. */
let generation = 0

function resourceOf(path: string): string {
  return path.split('?')[0].split('/')[1] ?? ''
}

export function getCached<T>(path: string): T | undefined {
  return cache.get(path) as T | undefined
}

export function getCacheGeneration(): number {
  return generation
}

/** Stores `data` unless the cache was invalidated after `startedAt` was read. */
export function setCached(path: string, data: unknown, startedAt: number): void {
  if (typeof window === 'undefined' || startedAt !== generation) return
  cache.delete(path)
  cache.set(path, data)
  if (cache.size > MAX_ENTRIES) {
    cache.delete(cache.keys().next().value as string)
  }
}

export function invalidateCached(path: string): void {
  generation++
  const resource = resourceOf(path)
  if (resource === 'auth') {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (resourceOf(key) === resource) cache.delete(key)
  }
}

export function clearCache(): void {
  generation++
  cache.clear()
}
