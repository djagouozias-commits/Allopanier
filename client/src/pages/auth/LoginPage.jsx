import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import Logo from '../../components/ui/Logo'

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [mot_de_passe, setMotDePasse] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const tel = telephone.trim()
    if (!tel) { setError('Numéro de téléphone requis'); return }
    const res = await login(tel, mot_de_passe)
    if (res.success) navigate('/')
    else setError(res.message)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <Logo size={48} />
            <span className="font-display font-extrabold text-2xl text-primary-600">
              Allo<span className="text-gray-900">Panier</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-gray-900">Connexion</h1>
          <p className="text-gray-500 font-body mt-1">Accédez à votre compte</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={telephone}
                onChange={e => setTelephone(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 0188441122"
                className="input-field"
                required
                maxLength={10}
              />
              <p className="text-xs text-gray-400 mt-1 font-body">
                Format : 01 + 8 chiffres (ex: 0188441122)
              </p>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={mot_de_passe}
                  onChange={e => setMotDePasse(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>

            <Link to="/"
              className="block w-full text-center border border-gray-300 text-gray-600 font-display font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Annuler
            </Link>
          </form>

          <p className="text-center text-sm text-gray-500 font-body mt-4">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-primary-600 font-semibold hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
