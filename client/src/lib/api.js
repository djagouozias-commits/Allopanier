import axios from 'axios'

// En développement : proxy Vite vers localhost:5000
// En production : URL Railway depuis la variable d'environnement
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token depuis le localStorage au démarrage du module
function injectTokenFromStorage() {
  try {
    const stored = localStorage.getItem('allopanier-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.token
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        return token
      }
    }
  } catch {}
  return null
}

injectTokenFromStorage()

// Intercepteur REQUEST — injecter le token à chaque requête (au cas où il a changé)
api.interceptors.request.use(config => {
  // Si le header n'est pas déjà set, essayer de l'injecter depuis localStorage
  if (!config.headers['Authorization']) {
    const token = injectTokenFromStorage()
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Intercepteur RESPONSE — gérer les erreurs globalement
api.interceptors.response.use(
  response => response,
  error => {
    // Ne pas rediriger automatiquement sur 401 — laisser les composants gérer
    // Sauf si c'est une route protégée critique
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Ne pas rediriger pour les routes de commande (éviter la perte de commande)
      if (!url.includes('/commandes') && !url.includes('/clients')) {
        localStorage.removeItem('allopanier-auth')
        window.location.href = '/connexion'
      }
    }
    return Promise.reject(error)
  }
)

// Fonction utilitaire pour définir le token manuellement (appelée après login)
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
