import type { ApiError } from './api-types'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TOKEN_KEY = 'athora-token'

const DEFAULT_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000
const RETRY_DELAY_MS = 1_000
const MAX_RETRIES = 1

class ApiRequestError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
  }

  toApiError(): ApiError {
    return { message: this.message, statusCode: this.statusCode }
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  // Try cookie first
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))

  if (cookie) {
    return cookie.split('=')[1]
  }

  // Fall back to localStorage
  return localStorage.getItem(TOKEN_KEY)
}

function clearAuthAndRedirect(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  window.location.href = '/login'
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof DOMException && error.name === 'AbortError')
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface RequestOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const token = getToken()
  const isUpload = body instanceof FormData
  const timeoutMs = options?.timeoutMs ?? (isUpload ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS)

  const headers: Record<string, string> = {
    ...options?.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (body && !isUpload) {
    headers['Content-Type'] = 'application/json'
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Chain caller's signal to our controller
    if (options?.signal) {
      if (options.signal.aborted) {
        clearTimeout(timeoutId)
        throw new DOMException('Request aborted', 'AbortError')
      }
      options.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: isUpload ? body : body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        clearAuthAndRedirect()
        throw new ApiRequestError('Unauthorized', 401)
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({
          message: response.statusText,
        }))

        throw new ApiRequestError(
          errorBody.message ?? response.statusText,
          response.status
        )
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      lastError = error

      // Don't retry non-network errors or if caller aborted
      if (!isNetworkError(error) || options?.signal?.aborted) {
        throw error
      }

      // Retry after delay if attempts remain
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options)
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options)
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options)
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options)
  },

  upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, formData, { ...options, timeoutMs: options?.timeoutMs ?? UPLOAD_TIMEOUT_MS })
  },
}

export { ApiRequestError }
export type { RequestOptions }
