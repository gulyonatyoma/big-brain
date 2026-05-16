import type { User } from '@supabase/supabase-js'
import { create } from 'zustand'

type AuthState = {
  user: User | null
  isAuthLoading: boolean
  authError: string

  setUser: (user: User | null) => void
  setIsAuthLoading: (isAuthLoading: boolean) => void
  setAuthError: (authError: string) => void
  clearAuthError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthLoading: true,
  authError: '',

  setUser: (user) => {
    set({ user })
  },

  setIsAuthLoading: (isAuthLoading) => {
    set({ isAuthLoading })
  },

  setAuthError: (authError) => {
    set({ authError })
  },

  clearAuthError: () => {
    set({ authError: '' })
  },
}))