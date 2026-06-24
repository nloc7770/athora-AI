import type { ApiError } from './api-types'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const TOKEN_KEY = 'athora-token'

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

interface RequestOptions {
  headers?: Record<string, string>
  signal?: AbortSignal
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    ...options?.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  })

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
    return request<T>('POST', path, formData, options)
  },
}

export { ApiRequestError }
export type { RequestOptions }
