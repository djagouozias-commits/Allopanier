import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MapPin, Loader } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import { validerSuffixeTelephone, assemblerTelephone } from '../../lib/utils'
import PhoneInput from '../../components/ui/PhoneInput'
import Logo from '../../components/ui/Logo'
import MapModal from '../../components/ui/MapModal'
import toast from 'react-hot-toast'

const TYPES_CLIENT = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'hotel', label: 'Hôtel' },
  { value: 'bonne_dame', label: 'Bonne dame' },
  { value: 'maison', label: 'Maison' },
  { value: 'autre', label: 'Autre (préciser)' },
]

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nom: '', telSuffix: '', telWhatsappSuffix: '', email: '', mot_de_passe: '', confirmation: '',
    type_client: 'particulier', type_autre: '',
    description_lieu: '', latitude: null, longitude: null,
  })
  const [whatsappManuel, setWhatsappManuel] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [mapOpen, setMapOpen] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Le nom est requis'
    if (!validerSuffixeTelephone(form.telSuffix)) e.telephone = 'Entrez les 8 chiffres après 01'
    if (whatsappManuel && form.telWhatsappSuffix && !validerSuffixeTelephone(form.telWhatsappSuffix)) {
      e.whatsapp = 'WhatsApp invalide — 8 chiffres après 01'
    }
    if (form.mot_de_passe.length < 6) e.mot_de_passe = 'Minimum 6 caractères'
    if (form.mot_de_passe !== form.confirmation) e.confirmation = 'Les mots de passe ne correspondent pas'
    if (!form.description_lieu.trim()) e.description_lieu = 'Décrivez votre lieu de livraison'
    if (form.type_client === 'autre' && !form.type_autre.trim()) e.type_autre = 'Précisez le type'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    const telephone = assemblerTelephone(form.telSuffix)
    const whatsapp = whatsappManuel && form.telWhatsappSuffix
      ? assemblerTelephone(form.telWhatsappSuffix)
      : telephone
    const payload = {
      nom: form.nom,
      telephone,
      email: form.email || null,
      mot_de_passe: form.mot_de_passe,
      type_client: form.type_client === 'autre' ? form.type_autre : form.type_client,
      whatsapp,
      adresse: {
        description_lieu: form.description_lieu,
        latitude: form.latitude,
        longitude: form.longitude,
        libelle: 'Adresse principale',
        principale: true,
      }
    }
    const res = await register(payload)
    if (res.success) {
      toast.success('Compte créé avec succès !')
      navigate('/')
    } else {
      toast.error(res.message)
    }
  }

  const f = (name) => ({
    value: form[name] ?? '',
    onChange: e => setForm(p => ({ ...p, [name]: e.target.value })),
    className: `input-field ${errors[name] ? 'border-red-400' : ''}`,
  })

  return (
    <>
      <MapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Indiquez votre position de livraison"
        initialLat={form.latitude}
        initialLng={form.longitude}
        onValidate={({ lat, lng }) => {
          setForm(p => ({ ...p, latitude: lat, longitude: lng }))
          toast.success('Position enregistrée')
        }}
      />

      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 justify-center mb-4">
              <Logo size={48} />
              <span className="font-display font-extrabold text-2xl text-primary-600">
                Allo<span className="text-gray-900">Panier</span>
              </span>
            </Link>
            <h1 className="font-display font-bold text-2xl text-gray-900">Créer un compte</h1>
            <p className="text-gray-500 font-body mt-1">Commencez à commander en quelques secondes</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nom */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input type="text" placeholder="Ex: Kouassi Jean-Baptiste" {...f('nom')} />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Numéro de téléphone *</label>
                <PhoneInput
                  suffix={form.telSuffix}
                  onChange={telSuffix => setForm(p => ({ ...p, telSuffix }))}
                  error={errors.telephone}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Email (optionnel)</label>
                <input type="email" placeholder="email@exemple.com" {...f('email')} />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={whatsappManuel}
                    onChange={e => setWhatsappManuel(e.target.checked)} />
                  <span className="text-sm font-body text-gray-700">WhatsApp différent du téléphone</span>
                </label>
                {whatsappManuel && (
                  <PhoneInput
                    suffix={form.telWhatsappSuffix}
                    onChange={telWhatsappSuffix => setForm(p => ({ ...p, telWhatsappSuffix }))}
                    error={errors.whatsapp}
                  />
                )}
              </div>

              {/* Type client */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Type de client *</label>
                <select {...f('type_client')} className="input-field">
                  {TYPES_CLIENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.type_client === 'autre' && (
                  <input type="text" placeholder="Précisez..." {...f('type_autre')} className="input-field mt-2" />
                )}
                {errors.type_autre && <p className="text-red-500 text-xs mt-1">{errors.type_autre}</p>}
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Mot de passe *</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} placeholder="Min. 6 caractères"
                      {...f('mot_de_passe')} className={`input-field pr-10 ${errors.mot_de_passe ? 'border-red-400' : ''}`} />
                    <button type="button" onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
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

              {/* Position GPS */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                  Position de livraison
                </label>

                {/* Bouton ouvrir la carte plein écran */}
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className={`w-full flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-4 transition-colors ${
                    form.latitude
                      ? 'border-primary-400 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-400 text-gray-500 hover:text-primary-600'
                  }`}
                >
                  <MapPin size={20} className={form.latitude ? 'text-primary-600' : 'text-gray-400'} />
                  <div className="text-left">
                    {form.latitude ? (
                      <>
                        <p className="font-display font-semibold text-sm">Position enregistrée</p>
                        <p className="text-xs font-body">{form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display font-semibold text-sm">Ouvrir la carte</p>
                        <p className="text-xs font-body">Cliquez pour indiquer votre position</p>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Description lieu */}
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">
                  Description du lieu de livraison *
                </label>
                <textarea rows={3}
                  placeholder="Ex: Derrière le marché Dantokpa, maison bleue en face de la pharmacie, 2e ruelle à gauche"
                  {...f('description_lieu')} className={`input-field resize-none ${errors.description_lieu ? 'border-red-400' : ''}`}
                />
                {errors.description_lieu && <p className="text-red-500 text-xs mt-1">{errors.description_lieu}</p>}
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-display font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {isLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isLoading ? 'Création en cours...' : 'Créer mon compte'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 font-body mt-4">
              Déjà un compte ?{' '}
              <Link to="/connexion" className="text-primary-600 font-semibold hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
