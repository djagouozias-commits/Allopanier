import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function VendeurConnexionPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ telephone: '', mot_de_passe: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await api.post('/promoflash/vendeurs/login', form)
      localStorage.setItem('vendeur-token', r.data.token)
      localStorage.setItem('vendeur-info', JSON.stringify(r.data.vendeur))
      navigate('/promoflash/vendeur/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl text-purple-900">Espace Vendeur PromoFlash</h1>
          <p className="text-purple-600 font-body mt-1">Connectez-vous à votre espace vendeur</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Téléphone</label>
              <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="01XXXXXXXX" value={form.telephone}
                onChange={e => setForm(p => ({ ...p, telephone: e.target.value.replace(/\D/g,'') }))} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} placeholder="Votre mot de passe" value={form.mot_de_passe}
                  onChange={e => setForm(p => ({ ...p, mot_de_passe: e.target.value }))}
                  className="input-field pr-10" required />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-display font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 font-body mt-4">
            Pas encore de compte ?{' '}
            <Link to="/promoflash/vendre" className="text-purple-600 font-semibold hover:underline">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
