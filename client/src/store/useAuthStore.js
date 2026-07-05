import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { setAuthToken } from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (telephone, motDePasse) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { telephone, mot_de_passe: motDePasse })
          set({ user: data.client, token: data.token, isLoading: false })
          setAuthToken(data.token)
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || 'Erreur de connexion'
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      register: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', formData)
          set({ user: data.client, token: data.token, isLoading: false })
          setAuthToken(data.token)
          return { success: true }
        } catch (err) {
          const msg = err.response?.data?.message || "Erreur lors de l'inscription"
          set({ error: msg, isLoading: false })
          return { success: false, message: msg }
        }
      },

      logout: () => {
        set({ user: null, token: null })
        setAuthToken(null)
      },

      setToken: (token) => {
        set({ token })
        setAuthToken(token)
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'allopanier-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        // Réinjecter le token après réhydratation depuis localStorage
        if (state?.token) setAuthToken(state.token)
      },
    }
  )
)

export default useAuthStore
