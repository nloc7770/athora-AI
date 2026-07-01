import { create } from 'zustand'

import { apiClient } from '@/lib/api'

type AdminRole = 'admin' | 'super_admin'

interface AdminUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: string
}

interface AuthResponse {
  user: AdminUser
}

interface AdminAuthState {
  user: AdminUser | null
  role: AdminRole | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

function isAdminRole(role: string): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    })

    const { user } = response

    if (!isAdminRole(user.role)) {
      await apiClient.post('/auth/logout')
      throw new Error('Access denied. Admin privileges required.')
    }

    set({
      user,
      role: user.role,
      isAuthenticated: true,
    })
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      set({
        user: null,
        role: null,
        isAuthenticated: false,
      })
    }
  },

  initialize: async () => {
    set({ isLoading: true })

    try {
      const user = await apiClient.get<AdminUser>('/auth/me', {
        _skipRefresh: true,
      })

      if (!isAdminRole(user.role)) {
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      set({
        user,
        role: user.role,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      set({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
