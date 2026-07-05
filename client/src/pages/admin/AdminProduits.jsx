import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import { formatPrix } from '../../lib/utils'
import { getImageUrl } from '../../lib/imageUrl'
import { PageLoader } from '../../components/ui/Spinner'
import MediaGallery from '../../components/produits/MediaGallery'
import toast from 'react-hot-toast'

const FORM_INIT = {
  nom: '', description: '', categorie_id: '',
  poids_unitaire_kg: '', prix_unitaire: '', prix_gros: '', seuil_gros: '', label_gros: '',
  has_sachet: false, prix_sachet: '', qte_sachet: '', poids_sachet_kg: '',
  has_boite: false, prix_boite: '', qte_boite: '', poids_boite_kg: '',
  has_sac: false, prix_sac: '', qte_sac: '', poids_sac_kg: '',
  has_carton: false, prix_carton: '', qte_carton: '', poids_carton_kg: '',
  stock: true, stock_min: 0, actif: true,
}

export default function AdminProduits() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState(FORM_INIT)
  const [medias, setMedias] = useState([])
  const [savedProduitId, setSavedProduitId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filtre, setFiltre] = useState({ q: '', categorie: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const load = () => {
    const params = new URLSearchParams({ limit: LIMIT, page, admin: true })
    if (filtre.q) params.append('q', filtre.q)
    if (filtre.categorie) params.append('categorie', filtre.categorie)
    api.get(`/produits?${params}`).then(r => { setProduits(r.data.produits || []); setTotal(r.data.total || 0); setLoading(false) })
  }

  useEffect(() => { api.get('/categories?all=true').then(r => setCategories(r.data.categories || [])) }, [])
  useEffect(load, [filtre, page])

  const f = (name) => ({ value: form[name] ?? '', onChange: e => setForm(p => ({ ...p, [name]: e.target.value })), className: 'input-field' })
  const cb = (name) => ({ checked: form[name], onChange: e => setForm(p => ({ ...p, [name]: e.target.checked })) })

  const openNew = () => {
    setEditData(null)
    setForm(FORM_INIT)
    setMedias([])
    setSavedProduitId(null)
    setModal(true)
  }

  const openEdit = async (p) => {
    setEditData(p)
    setForm({ ...FORM_INIT, ...p })
    setSavedProduitId(p.id)
    setModal(true)
    // Charger les médias existants
    try {
      const r = await api.get(`/medias/produit/${p.id}`)
      setMedias(r.data.medias || [])
    } catch { setMedias([]) }
  }

  const save = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    if (!form.prix_unitaire) { toast.error('Prix unitaire requis'); return }
    setSaving(true)
    try {
      const payload = { ...form }
      // Convertir les types
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') payload[k] = null
      })

      let produitId = savedProduitId
      if (editData) {
        await api.put(`/produits/${editData.id}`, payload)
        produitId = editData.id
        toast.success('Produit mis à jour')
      } else {
        const r = await api.post('/produits', payload)
        produitId = r.data.produit.id
        setSavedProduitId(produitId)
        toast.success('Produit créé — vous pouvez maintenant ajouter des médias')
      }
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false) }
  }

  const closeModal = () => {
    setModal(false)
    setMedias([])
    setSavedProduitId(null)
    load()
  }

  const toggleActif = async (p) => {
    await api.put(`/produits/${p.id}`, { actif: !p.actif })
    load()
  }

  const supprimer = async (p) => {
    if (!window.confirm(`Supprimer « ${p.nom} » ?`)) return
    try {
      const r = await api.delete(`/produits/${p.id}`)
      toast.success(r.data.message || 'Produit supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Produits ({total})</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-4 py-2 rounded-lg">
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Rechercher..." value={filtre.q}
            onChange={e => setFiltre(p => ({ ...p, q: e.target.value }))}
            className="input-field pl-9 text-sm" />
        </div>
        <select value={filtre.categorie} onChange={e => setFiltre(p => ({ ...p, categorie: e.target.value }))}
          className="input-field text-sm max-w-xs">
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Photo', 'Nom', 'Catégorie', 'Prix unit.', 'Stock', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-display font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produits.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3">
                    <img src={getImageUrl(p.image_url)}
                      alt="" className="w-10 h-10 rounded-lg object-cover"
                      onError={e => { e.target.src = 'https://placehold.co/40x40/E8F5E9/2E7D32?text=AP' }} />
                  </td>
                  <td className="px-3 py-3 font-display font-semibold text-gray-900 text-sm max-w-[180px]">
                    <div className="truncate">{p.nom}</div>
                    {!p.stock && <span className="text-xs text-red-500 font-normal">Rupture</span>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 font-body">{p.categorie_nom || '—'}</td>
                  <td className="px-3 py-3 text-sm font-display font-semibold text-gray-900">{formatPrix(p.prix_unitaire)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-display font-semibold ${p.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.stock ? 'Dispo' : 'Rupture'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleActif(p)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {p.actif ? <ToggleRight className="text-primary-600" size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => supprimer(p)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {produits.length === 0 && <div className="text-center py-12 text-gray-400 font-body">Aucun produit trouvé</div>}

        {total > LIMIT && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-body disabled:opacity-40">Préc.</button>
            <span className="px-3 py-1.5 text-sm text-gray-600 font-body">Page {page} / {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-body disabled:opacity-40">Suiv.</button>
          </div>
        )}
      </div>

      {/* Modal ajout/édition */}
      <Modal isOpen={modal} onClose={closeModal} title={editData ? 'Modifier le produit' : 'Nouveau produit'} size="xl">
        <div className="space-y-5">
          {/* Médias : photos + vidéo */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-display font-semibold text-sm text-gray-700 mb-4">
              Photos et vidéo
              {!savedProduitId && (
                <span className="ml-2 text-xs text-orange-500 font-body font-normal">
                  (Enregistrez d'abord le produit pour ajouter des médias)
                </span>
              )}
            </h3>
            {savedProduitId ? (
              <MediaGallery
                produitId={savedProduitId}
                medias={medias}
                onUpdate={setMedias}
              />
            ) : (
              <div className="text-center py-8 text-gray-400 font-body text-sm">
                Enregistrez les informations du produit, puis ajoutez vos photos et vidéo.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom *</label>
              <input type="text" {...f('nom')} placeholder="Nom du produit" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Description</label>
              <textarea rows={2} {...f('description')} placeholder="Description courte" className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Catégorie *</label>
              <select {...f('categorie_id')} className="input-field">
                <option value="">Sélectionner...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Poids unitaire (kg)</label>
              <input type="number" step="0.01" {...f('poids_unitaire_kg')} placeholder="0.5" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Prix unitaire (FCFA) *</label>
              <input type="number" {...f('prix_unitaire')} placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Prix gros (FCFA)</label>
              <input type="number" {...f('prix_gros')} placeholder="420" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Seuil gros (qté)</label>
              <input type="number" {...f('seuil_gros')} placeholder="3" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Label gros</label>
              <input type="text" {...f('label_gros')} placeholder="à partir de 3 unités" />
            </div>
          </div>

          {/* Conditionnements */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="font-display font-semibold text-sm text-gray-700">Conditionnements (facultatif)</h3>

            {[
              { key: 'carton', label: 'Carton' },
              { key: 'sac', label: 'Sac' },
              { key: 'boite', label: 'Boîte' },
              { key: 'sachet', label: 'Sachet' },
            ].map(cond => (
              <div key={cond.key}>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input type="checkbox" {...cb(`has_${cond.key}`)} />
                  <span className="text-sm font-display font-semibold text-gray-700">{cond.label}</span>
                </label>
                {form[`has_${cond.key}`] && (
                  <div className="grid grid-cols-3 gap-3 pl-5">
                    <div>
                      <label className="text-xs text-gray-500 font-body">Prix (FCFA)</label>
                      <input type="number" {...f(`prix_${cond.key}`)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-body">Qté unités</label>
                      <input type="number" {...f(`qte_${cond.key}`)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-body">Poids (kg)</label>
                      <input type="number" step="0.01" {...f(`poids_${cond.key}_kg`)} className="input-field text-sm" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...cb('stock')} />
              <span className="text-sm font-body text-gray-700">En stock (disponible)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...cb('actif')} />
              <span className="text-sm font-body text-gray-700">Actif (visible sur le site)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-display font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              {saving ? 'Enregistrement...' : (savedProduitId ? 'Mettre à jour' : 'Créer le produit')}
            </button>
            <button onClick={closeModal} className="px-6 border border-gray-300 text-gray-700 font-body rounded-xl hover:bg-gray-50">
              Fermer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
