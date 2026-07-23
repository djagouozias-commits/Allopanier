import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const ICONES_SUGGERES = ['🥬', '🥫', '🥤', '🐟', '📺', '💡', '💻', '🧹', '🧼', '🌽', '🍎', '🍗', '🛒', '🏠', '🏭']

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ nom: '', icone: '🛒', ordre_affichage: 0, actif: true })
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get('/categories?all=true').then(r => { setCategories(r.data.categories || []); setLoading(false) })
  }
  useEffect(load, [])

  const openNew = () => {
    setEditData(null)
    setForm({ nom: '', icone: '🛒', ordre_affichage: categories.length, actif: true })
    setModal(true)
  }

  const openEdit = (cat) => {
    setEditData(cat)
    setForm({ nom: cat.nom, icone: cat.icone || '🛒', ordre_affichage: cat.ordre_affichage || 0, actif: cat.actif })
    setModal(true)
  }

  const save = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    setSaving(true)
    try {
      if (editData) {
        await api.put(`/categories/${editData.id}`, form)
        toast.success('Catégorie mise à jour')
      } else {
        await api.post('/categories', form)
        toast.success('Catégorie créée')
      }
      setModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ? Les produits associés ne seront pas supprimés.')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Catégorie supprimée')
      load()
    } catch { toast.error('Impossible de supprimer (vérifiez les produits associés)') }
  }

  const toggleActif = async (cat) => {
    await api.put(`/categories/${cat.id}`, { ...cat, actif: !cat.actif })
    load()
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Catégories</h1>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Icône', 'Nom', 'Ordre', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-2xl">{cat.icone || '🛒'}</td>
                <td className="px-4 py-3 font-display font-semibold text-gray-900 text-sm">{cat.nom}</td>
                <td className="px-4 py-3 text-sm text-gray-500 font-body">{cat.ordre_affichage}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActif(cat)}
                    className={`text-xs font-display font-semibold px-2.5 py-1 rounded-full transition-colors ${cat.actif ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                    {cat.actif ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => supprimer(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-body">Aucune catégorie. Créez-en une.</div>
        )}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom *</label>
            <input type="text" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" placeholder="Ex: Céréales et féculents" />
          </div>

          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-2">Icône</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ICONES_SUGGERES.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icone: ic }))}
                  className={`w-10 h-10 text-xl rounded-lg border transition-colors ${form.icone === ic ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  {ic}
                </button>
              ))}
            </div>
            <input type="text" value={form.icone} onChange={e => setForm(p => ({ ...p, icone: e.target.value }))}
              className="input-field w-24" placeholder="🛒" />
          </div>

          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Ordre d'affichage</label>
            <input type="number" value={form.ordre_affichage} onChange={e => setForm(p => ({ ...p, ordre_affichage: parseInt(e.target.value) || 0 }))}
              className="input-field w-32" min={0} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} />
            <span className="text-sm font-body text-gray-700">Active (visible sur le site)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setModal(false)} className="px-5 border border-gray-300 text-gray-700 font-body rounded-lg hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
