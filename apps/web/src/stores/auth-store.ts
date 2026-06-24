import { create } from 'zustand'

import type { AuthResponse, User } from '@/lib/api-types'
import { apiClient } from '@/lib/api'

const TOKEN_KEY = 'athora-token'
const REFRESH_TOKEN_KEY = 'athora-refresh-token'
const COOKIE_NAME = 'athora-token'

function setTokenCookie(token: string): void {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax`
}

function clearTokenCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })

    const token = response.session.access_token
    const refreshToken = response.session.refresh_token

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    setTokenCookie(token)

    set({
      user: response.user,
      token,
      isAuthenticated: true,
    })
  },

  register: async (email, password, name?) => {
    await apiClient.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    })

    await get().login(email, password)
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      clearTokenCookie()

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    }
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)

    if (!refreshToken) {
      return false
    }

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      })

      const newToken = response.session.access_token
      const newRefreshToken = response.session.refresh_token

      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken)
      setTokenCookie(newToken)

      set({
        user: response.user,
        token: newToken,
        isAuthenticated: true,
      })

      return true
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      clearTokenCookie()

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })

      return false
    }
  },

  initialize: async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    set({ isLoading: true })

    try {
      const user = await apiClient.get<User>('/auth/me')

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // Token may be expired, try refresh
      const refreshed = await get().refreshToken()

      if (refreshed) {
        try {
          const user = await apiClient.get<User>('/auth/me')

          set({
            user,
            token: localStorage.getItem(TOKEN_KEY),
            isAuthenticated: true,
            isLoading: false,
          })

          return
        } catch {
          // Refresh succeeded but /me still failed
        }
      }

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
