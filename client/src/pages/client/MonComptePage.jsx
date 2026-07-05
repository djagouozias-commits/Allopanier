import React, { useState } from 'react'
import { User, MapPin, Lock, Loader, Plus } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function MonComptePage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('profil')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Mon compte</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'profil', label: 'Profil', icon: User },
          { key: 'adresses', label: 'Adresses', icon: MapPin },
          { key: 'securite', label: 'Sécurité', icon: Lock },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-colors ${tab === t.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profil' && <ProfilTab user={user} />}
      {tab === 'adresses' && <AdressesTab />}
      {tab === 'securite' && <SecuriteTab />}
    </div>
  )
}

function ProfilTab({ user }) {
  const { login } = useAuthStore()
  const [form, setForm] = useState({ nom: user?.nom || '', whatsapp: user?.whatsapp || '' })
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      await api.put('/clients/profil', form)
      toast.success('Profil mis à jour')
    } catch { toast.error('Erreur lors de la mise à jour') }
    finally { setLoading(false) }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom complet</label>
        <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Téléphone</label>
        <input type="tel" value={user?.telephone || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
      </div>
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">WhatsApp</label>
        <input type="tel" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Type de client</label>
        <input type="text" value={user?.type_client || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed capitalize" />
      </div>
      <button onClick={save} disabled={loading}
        className="bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
        {loading && <Loader size={15} className="animate-spin" />} Enregistrer
      </button>
    </div>
  )
}

function AdressesTab() {
  const [adresses, setAdresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ libelle: '', description_lieu: '' })
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    api.get('/clients/adresses').then(r => { setAdresses(r.data.adresses || []); setLoading(false) })
  }, [])

  const save = async () => {
    if (!form.description_lieu.trim()) { toast.error('Description requise'); return }
    setSaving(true)
    try {
      await api.post('/clients/adresses', { ...form, principale: false })
      const r = await api.get('/clients/adresses')
      setAdresses(r.data.adresses)
      setShowForm(false)
      setForm({ libelle: '', description_lieu: '' })
      toast.success('Adresse ajoutée')
    } catch { toast.error('Erreur') }
    finally { setSaving(false) }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette adresse ?')) return
    await api.delete(`/clients/adresses/${id}`)
    setAdresses(p => p.filter(a => a.id !== id))
    toast.success('Adresse supprimée')
  }

  if (loading) return <div className="flex justify-center py-8"><span className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" /></div>

  return (
    <div className="space-y-3">
      {adresses.map(a => (
        <div key={a.id} className="card p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-display font-semibold text-sm text-gray-900">{a.libelle || 'Adresse'}</p>
            <p className="text-sm text-gray-600 font-body">{a.description_lieu}</p>
            {a.principale && <span className="text-xs text-primary-600 font-display font-semibold">Principale</span>}
          </div>
          {!a.principale && (
            <button onClick={() => supprimer(a.id)} className="text-red-400 hover:text-red-600 text-xs font-body transition-colors">Supprimer</button>
          )}
        </div>
      ))}

      {showForm && (
        <div className="card p-4 space-y-3">
          <input type="text" placeholder="Libellé (ex: Maison, Bureau)" value={form.libelle}
            onChange={e => setForm(p => ({ ...p, libelle: e.target.value }))} className="input-field" />
          <textarea rows={2} placeholder="Description du lieu" value={form.description_lieu}
            onChange={e => setForm(p => ({ ...p, description_lieu: e.target.value }))} className="input-field resize-none" />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="bg-primary-600 text-white text-sm font-display font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 font-body px-4 py-2">Annuler</button>
          </div>
        </div>
      )}

      <button onClick={() => setShowForm(true)} className="flex items-center gap-2 text-sm text-primary-600 font-display font-semibold hover:underline">
        <Plus size={15} /> Ajouter une adresse
      </button>
    </div>
  )
}

function SecuriteTab() {
  const [form, setForm] = useState({ actuel: '', nouveau: '', confirmation: '' })
  const [loading, setLoading] = useState(false)

  const save = async () => {
    if (form.nouveau.length < 6) { toast.error('Minimum 6 caractères'); return }
    if (form.nouveau !== form.confirmation) { toast.error('Les mots de passe ne correspondent pas'); return }
    setLoading(true)
    try {
      await api.put('/clients/mot-de-passe', { mot_de_passe_actuel: form.actuel, nouveau_mot_de_passe: form.nouveau })
      toast.success('Mot de passe mis à jour')
      setForm({ actuel: '', nouveau: '', confirmation: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Mot de passe actuel</label>
        <input type="password" value={form.actuel} onChange={e => setForm(p => ({ ...p, actuel: e.target.value }))} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
        <input type="password" value={form.nouveau} onChange={e => setForm(p => ({ ...p, nouveau: e.target.value }))} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Confirmer</label>
        <input type="password" value={form.confirmation} onChange={e => setForm(p => ({ ...p, confirmation: e.target.value }))} className="input-field" />
      </div>
      <button onClick={save} disabled={loading}
        className="bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
        {loading && <Loader size={15} className="animate-spin" />} Modifier le mot de passe
      </button>
    </div>
  )
}
