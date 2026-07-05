import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MapPin, Store, Upload, Zap } from 'lucide-react'
import api from '../../lib/api'
import MapModal from '../../components/ui/MapModal'
import toast from 'react-hot-toast'

const TYPES = ['Particulier', 'Supermarché', 'Magasin de gros', 'Magasin de détail', 'Restaurant', 'Autre']

export default function VendeurInscriptionPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '', telephone: '', email: '', mot_de_passe: '', confirmation: '',
    type_vendeur: 'Particulier', description: '', adresse_description: '',
    latitude: null, longitude: null,
  })
  const [photo, setPhoto] = useState(null)
  const [video, setVideo] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const f = (name) => ({
    value: form[name] ?? '',
    onChange: e => setForm(p => ({ ...p, [name]: e.target.value })),
    className: `input-field ${errors[name] ? 'border-red-400' : ''}`,
  })

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Nom requis'
    if (!form.telephone) e.telephone = 'Téléphone requis'
    if (form.mot_de_passe.length < 6) e.mot_de_passe = 'Min. 6 caractères'
    if (form.mot_de_passe !== form.confirmation) e.confirmation = 'Mots de passe différents'
    if (!form.adresse_description.trim()) e.adresse_description = 'Adresse requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v) })
      if (photo) fd.append('photo', photo)
      if (video) fd.append('video', video)

      const r = await api.post('/promoflash/vendeurs/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      localStorage.setItem('vendeur-token', r.data.token)
      localStorage.setItem('vendeur-info', JSON.stringify(r.data.vendeur))
      toast.success('Compte créé ! En attente de validation par l\'admin.')
      navigate('/promoflash/vendeur/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally { setLoading(false) }
  }

  return (
    <>
      <MapModal isOpen={mapOpen} onClose={() => setMapOpen(false)}
        title="Position de votre boutique" initialLat={form.latitude} initialLng={form.longitude}
        onValidate={({ lat, lng }) => { setForm(p => ({ ...p, latitude: lat, longitude: lng })); toast.success('Position enregistrée') }} />

      <div className="min-h-screen bg-purple-50 py-10 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-white" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-purple-900">Rejoindre PromoFlash</h1>
            <p className="text-purple-600 font-body mt-1">Créez votre compte vendeur et commencez à vendre</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom / Nom de la boutique *</label>
                <input type="text" placeholder="Ex: Supermarché Akpakpa, Jean Dupont" {...f('nom')} />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Téléphone *</label>
                  <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="01XXXXXXXX" {...f('telephone')}
                    onChange={e => setForm(p => ({ ...p, telephone: e.target.value.replace(/\D/g,'') }))} />
                  {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Type *</label>
                  <select {...f('type_vendeur')} className="input-field">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" placeholder="optionnel" {...f('email')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} placeholder="Min. 6 car." {...f('mot_de_passe')}
                      className={`input-field pr-9 ${errors.mot_de_passe ? 'border-red-400' : ''}`} />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.mot_de_passe && <p className="text-red-500 text-xs mt-1">{errors.mot_de_passe}</p>}
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Confirmer *</label>
                  <input type="password" placeholder="Répétez" {...f('confirmation')}
                    className={`input-field ${errors.confirmation ? 'border-red-400' : ''}`} />
                  {errors.confirmation && <p className="text-red-500 text-xs mt-1">{errors.confirmation}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Description de votre boutique</label>
                <textarea rows={2} placeholder="Décrivez votre activité, vos spécialités..." {...f('description')}
                  className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Adresse *</label>
                <textarea rows={2} placeholder="Décrivez votre emplacement précis" {...f('adresse_description')}
                  className={`input-field resize-none ${errors.adresse_description ? 'border-red-400' : ''}`} />
                {errors.adresse_description && <p className="text-red-500 text-xs mt-1">{errors.adresse_description}</p>}
              </div>

              {/* Position GPS */}
              <button type="button" onClick={() => setMapOpen(true)}
                className={`w-full flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-3.5 transition-colors ${
                  form.latitude ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-300 hover:border-purple-400 text-gray-500'
                }`}>
                <MapPin size={18} className={form.latitude ? 'text-purple-600' : 'text-gray-400'} />
                <div className="text-left">
                  {form.latitude ? (
                    <><p className="font-display font-semibold text-sm">Position enregistrée</p>
                    <p className="text-xs font-body">{form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p></>
                  ) : (
                    <><p className="font-display font-semibold text-sm">Placer ma boutique sur la carte</p>
                    <p className="text-xs font-body">Obligatoire pour apparaître sur la carte</p></>
                  )}
                </div>
              </button>

              {/* Photo/Vidéo boutique */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Photo boutique</label>
                  <label className="flex flex-col items-center justify-center border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-purple-400 transition-colors">
                    {photoPreview ? (
                      <img src={photoPreview} alt="" className="w-full h-24 object-cover rounded-lg" />
                    ) : (
                      <><Upload size={20} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-body">Choisir une photo</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)) } }} />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Vidéo courte</label>
                  <label className="flex flex-col items-center justify-center border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-purple-400 transition-colors h-full min-h-[88px]">
                    {video ? (
                      <p className="text-xs text-purple-600 font-body text-center">{video.name}</p>
                    ) : (
                      <><Upload size={20} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-body">Vidéo (max 15s)</span></>
                    )}
                    <input type="file" accept="video/mp4,video/webm" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setVideo(f) }} />
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-display font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Création...' : 'Créer mon compte vendeur'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 font-body mt-4">
              Déjà un compte ?{' '}
              <Link to="/promoflash/vendeur/connexion" className="text-purple-600 font-semibold hover:underline">Se connecter</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 font-body mt-4">
            Votre compte sera activé après validation par l'équipe AlloPanier.
          </p>
        </div>
      </div>
    </>
  )
}
