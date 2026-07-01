const BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL ?? 'http://localhost:3001'

const DEFAULT_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 120_000
const RETRY_DELAY_MS = 1_000
const MAX_RETRIES = 1

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

class ApiRequestError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
  }
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  window.location.href = '/login'
}

async function attemptTokenRefresh(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = doRefresh()

  try {
    return await refreshPromise
  } finally {
    isRefreshing = false
    refreshPromise = null
  }
}

async function doRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify({}),
    })

    return response.ok
  } catch {
    return false
  }
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
  _skipRefresh?: boolean
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const isUpload = body instanceof FormData
  const timeoutMs = options?.timeoutMs ?? (isUpload ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS)

  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...options?.headers,
  }

  if (body && !isUpload) {
    headers['Content-Type'] = 'application/json'
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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
        credentials: 'include',
      })

      clearTimeout(timeoutId)

      if (response.status === 401 && !options?._skipRefresh) {
        const refreshed = await attemptTokenRefresh()

        if (refreshed) {
          return request<T>(method, path, body, {
            ...options,
            _skipRefresh: true,
          })
        }

        redirectToLogin()
        throw new ApiRequestError('Unauthorized', 401)
      }

      if (response.status === 401) {
        if (!options?._skipRefresh) {
          redirectToLogin()
        }
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

      if (response.status === 204) {
        return undefined as T
      }

      return response.json() as Promise<T>
    } catch (error: unknown) {
      clearTimeout(timeoutId)
      lastError = error

      if (!isNetworkError(error) || options?.signal?.aborted) {
        throw error
      }

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
