import { create } from 'zustand'

import type { AuthResponse, User } from '@/lib/api-types'
import { apiClient } from '@/lib/api'

interface AuthState {
  user: User | null
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
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })

    set({
      user: response.user,
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
      set({
        user: null,
        isAuthenticated: false,
      })
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {})

      set({
        user: response.user,
        isAuthenticated: true,
      })

      return true
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      })

      return false
    }
  },

  initialize: async () => {
    set({ isLoading: true })

    try {
      const user = await apiClient.get<User>('/auth/me', {
        _skipRefresh: true,
      })

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // Token may be expired, try refresh
      const refreshed = await get().refreshToken()

      if (refreshed) {
        try {
          const user = await apiClient.get<User>('/auth/me', {
            _skipRefresh: true,
          })

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })

          return
        } catch {
          // Refresh succeeded but /me still failed
        }
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
