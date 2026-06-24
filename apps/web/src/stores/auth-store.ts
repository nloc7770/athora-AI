import { create } from 'zustand'

import type { AuthResponse, User } from '@/lib/api-types'
import { apiClient } from '@/lib/api'

const TOKEN_KEY = 'athora-token'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
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

    localStorage.setItem(TOKEN_KEY, token)

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

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    }
  },

  initialize: async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const user = await apiClient.get<User>('/auth/me')

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      localStorage.removeItem(TOKEN_KEY)

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
