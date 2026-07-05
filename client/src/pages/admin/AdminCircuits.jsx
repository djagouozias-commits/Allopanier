import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Route, Navigation } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { COULEURS_JOURS, couleurJour } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import MapModal from '../../components/ui/MapModal'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const COULEURS = ['#2E7D32', '#1565C0', '#F57C00', '#C62828', '#6A1B9A', '#00695C', '#4E342E', '#37474F']
const TRANCHES = [
  { value: '8h-12h', label: 'Matin 8h – 12h' },
  { value: '14h-18h', label: 'Après-midi 14h – 18h' },
]

const STATUT_LABELS = {
  PLANIFIE: { label: 'Planifié', cls: 'bg-blue-100 text-blue-700' },
  EN_COURS: { label: 'En cours', cls: 'bg-orange-100 text-orange-700' },
  TERMINE: { label: 'Terminé', cls: 'bg-green-100 text-green-700' },
}

const formVide = () => ({
  nom: '', couleur: '#2E7D32', jour: '', tranche_horaire: '',
  depart_latitude: null, depart_longitude: null, actif: true,
})

export default function AdminCircuits() {
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(formVide())
  const [saving, setSaving] = useState(false)
  const [optimizing, setOptimizing] = useState(null)

  const load = () => {
    api.get('/admin/circuits')
      .then(r => { setCircuits(r.data.circuits || []); setLoading(false) })
      .catch(() => { setCircuits([]); setLoading(false); toast.error('Impossible de charger les circuits') })
  }
  useEffect(load, [])

  const openNew = () => {
    setEditData(null)
    setForm(formVide())
    setModal(true)
  }

  const openEdit = (c) => {
    setEditData(c)
    setForm({
      nom: c.nom,
      couleur: c.couleur || couleurJour(c.jour, '#2E7D32'),
      jour: c.jour || '',
      tranche_horaire: c.tranche_horaire || '',
      depart_latitude: c.depart_latitude ? parseFloat(c.depart_latitude) : null,
      depart_longitude: c.depart_longitude ? parseFloat(c.depart_longitude) : null,
      actif: c.actif !== false,
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    if (!form.jour) { toast.error('Jour de livraison requis'); return }
    if (!form.tranche_horaire) { toast.error('Créneau horaire requis'); return }
    if (!form.depart_latitude) { toast.error('Point de départ du livreur requis'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        couleur: form.couleur || couleurJour(form.jour),
      }
      if (editData) {
        await api.put(`/admin/circuits/${editData.id}`, payload)
        toast.success('Circuit mis à jour')
      } else {
        await api.post('/admin/circuits', payload)
        toast.success('Circuit créé')
      }
      setModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const optimiser = async (id) => {
    setOptimizing(id)
    try {
      const r = await api.post(`/admin/circuits/${id}/optimiser`)
      toast.success(`Itinéraire calculé — ${r.data.nb_commandes} livraison(s)`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de calculer l\'itinéraire')
    } finally {
      setOptimizing(null)
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce circuit ?')) return
    await api.delete(`/admin/circuits/${id}`)
    toast.success('Circuit supprimé')
    load()
  }

  if (loading) return <PageLoader />

  return (
    <>
      <MapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        title="Point de départ du livreur"
        initialLat={form.depart_latitude}
        initialLng={form.depart_longitude}
        onValidate={({ lat, lng }) => {
          setForm(p => ({ ...p, depart_latitude: lat, depart_longitude: lng }))
          toast.success('Point de départ enregistré')
        }}
      />

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Circuits de livraison</h1>
            <p className="text-sm text-gray-500 font-body mt-1">
              Définissez jour, créneau et point de départ — l'itinéraire optimal sera tracé sur la carte GPS.
            </p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-4 py-2 rounded-lg">
            <Plus size={16} /> Nouveau circuit
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-xs text-blue-700 font-body space-y-1">
          <p><strong>1.</strong> Créez un circuit avec jour, heure et lieu de départ du véhicule</p>
          <p><strong>2.</strong> Cliquez « Calculer l'itinéraire » — les commandes proches seront reliées du plus proche au plus proche, puis retour au départ</p>
          <p><strong>3.</strong> Allez sur <Link to="/admin/carte" className="underline font-semibold">Carte GPS</Link> pour démarrer le véhicule et suivre la livraison avec annonces vocales</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circuits.map(c => {
            const st = STATUT_LABELS[c.statut_livraison] || STATUT_LABELS.PLANIFIE
            const couleur = c.couleur || couleurJour(c.jour)
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: couleur }} />
                  <h3 className="font-display font-bold text-gray-900">{c.nom}</h3>
                  <span className={`ml-auto text-xs font-display font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                {c.jour && (
                  <p className="text-sm text-gray-600 font-body mb-1">
                    {c.jour}{c.tranche_horaire ? ` — ${c.tranche_horaire}` : ''}
                  </p>
                )}
                {c.depart_latitude && (
                  <p className="text-xs text-gray-400 font-body mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Départ : {parseFloat(c.depart_latitude).toFixed(4)}, {parseFloat(c.depart_longitude).toFixed(4)}
                  </p>
                )}
                <p className="text-sm text-gray-400 font-body mb-4">{c.nb_commandes || 0} commande(s) assignée(s)</p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => optimiser(c.id)}
                    disabled={optimizing === c.id}
                    className="flex items-center gap-1.5 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 font-display font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    <Route size={14} />
                    {optimizing === c.id ? 'Calcul...' : 'Calculer l\'itinéraire'}
                  </button>
                  {c.route_geojson && (
                    <Link
                      to="/admin/carte"
                      state={{ circuitId: c.id }}
                      className="flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-700 font-display font-semibold px-3 py-1.5 rounded-lg bg-secondary-50"
                    >
                      <Navigation size={14} /> Carte GPS
                    </Link>
                  )}
                  <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 font-display font-semibold">
                    <Pencil size={14} /> Modifier
                  </button>
                  <button onClick={() => supprimer(c.id)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 font-display font-semibold ml-auto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {circuits.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-body">
            Aucun circuit créé. Créez un circuit pour organiser vos tournées de livraison.
          </div>
        )}

        <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Modifier le circuit' : 'Nouveau circuit'} size="lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom du circuit *</label>
              <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                className="input-field" placeholder="Ex: Tournée Mardi matin — Godomey" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Jour *</label>
                <select value={form.jour} onChange={e => setForm(p => ({
                  ...p, jour: e.target.value,
                  couleur: COULEURS_JOURS[e.target.value] || p.couleur,
                }))} className="input-field">
                  <option value="">Choisir...</option>
                  {Object.keys(COULEURS_JOURS).map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Créneau *</label>
                <select value={form.tranche_horaire} onChange={e => setForm(p => ({ ...p, tranche_horaire: e.target.value }))} className="input-field">
                  <option value="">Choisir...</option>
                  {TRANCHES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">Point de départ du livreur *</label>
              <button type="button" onClick={() => setMapOpen(true)}
                className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-3 transition-colors ${
                  form.depart_latitude ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-500 hover:border-primary-400'
                }`}>
                <MapPin size={18} />
                {form.depart_latitude
                  ? `Départ : ${form.depart_latitude.toFixed(5)}, ${form.depart_longitude.toFixed(5)}`
                  : 'Choisir le lieu de démarrage du véhicule'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">Couleur sur la carte</label>
              <div className="flex gap-2 flex-wrap">
                {COULEURS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, couleur: c }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} />
              <span className="text-sm font-body text-gray-700">Circuit actif</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving}
                className="flex-1 bg-primary-600 text-white font-display font-semibold py-2.5 rounded-lg disabled:opacity-50">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button onClick={() => setModal(false)} className="px-5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-body">
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  )
}
