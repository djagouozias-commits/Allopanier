import React, { useEffect, useState } from 'react'
import { Crown, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Upload, Users, Tag, Search } from 'lucide-react'
import api from '../../lib/api'
import Modal from '../../components/ui/Modal'
import { formatPrix } from '../../lib/utils'
import { getImageUrl } from '../../lib/imageUrl'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'produits', label: 'Produits VIP', icon: Crown },
  { key: 'categories', label: 'Catégories', icon: Tag },
  { key: 'membres', label: 'Membres VIP', icon: Users },
]

export default function AdminVIP() {
  const [tab, setTab] = useState('produits')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)' }}>
          <Crown size={20} color="#1a1a2e" />
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Espace VIP</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-semibold transition-colors ${
              tab === t.key ? 'bg-white shadow-sm text-yellow-600' : 'text-gray-600 hover:text-gray-900'
            }`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'produits' && <OngletProduits />}
      {tab === 'categories' && <OngletCategories />}
      {tab === 'membres' && <OngletMembres />}
    </div>
  )
}

// ==================== PRODUITS ====================
function OngletProduits() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({
    nom: '', marque: '', description: '', categorie_id: '', prix_unitaire: '',
    poids_unitaire_kg: '', stock: true, actif: true
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get('/vip/produits?limit=50').then(r => { setProduits(r.data.produits || []); setLoading(false) })
  }
  useEffect(() => {
    load()
    api.get('/vip/categories').then(r => setCategories(r.data.categories || []))
  }, [])

  const openNew = () => {
    setEditData(null)
    setForm({ nom: '', marque: '', description: '', categorie_id: '', prix_unitaire: '', poids_unitaire_kg: '', stock: true, actif: true })
    setImages([]); setPreviews([]); setVideoFile(null)
    setModal(true)
  }

  const openEdit = (p) => {
    setEditData(p)
    setForm({ nom: p.nom, marque: p.marque || '', description: p.description || '', categorie_id: p.categorie_id || '', prix_unitaire: p.prix_unitaire, poids_unitaire_kg: p.poids_unitaire_kg || '', stock: p.stock, actif: p.actif })
    setPreviews(p.images_urls || (p.image_url ? [p.image_url] : []))
    setImages([]); setVideoFile(null)
    setModal(true)
  }

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - previews.length)
    setImages(prev => [...prev, ...files].slice(0, 4))
    files.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviews(prev => [...prev, url].slice(0, 4))
    })
  }

  const save = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    if (!form.prix_unitaire) { toast.error('Prix requis'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v) })
      images.forEach(img => fd.append('photos', img))
      if (videoFile) fd.append('video', videoFile)
      if (editData) {
        await api.put(`/vip/produits/${editData.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Produit VIP mis à jour')
      } else {
        await api.post('/vip/produits', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Produit VIP créé')
      }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setSaving(false) }
  }

  const toggleActif = async (p) => {
    try {
      await api.put(`/vip/produits/${p.id}`, { actif: !p.actif })
      toast.success(p.actif ? 'Article masqué du public' : 'Article rendu visible')
      load()
    } catch { toast.error('Erreur') }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-body">{produits.length} produit(s) VIP</p>
        <button onClick={openNew}
          className="flex items-center gap-2 text-white font-display font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)' }}>
          <Plus size={16} /> Nouveau produit VIP
        </button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-yellow-50 border-b border-yellow-200">
              <tr>
                {['Photo', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Actif', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-display font-semibold text-yellow-700 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produits.map(p => (
                <tr key={p.id} className="hover:bg-yellow-50/30 transition-colors">
                  <td className="px-3 py-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden" style={{ background: '#1a1a2e' }}>
                      <img src={getImageUrl(p.image_url)} alt="" className="w-full h-full object-cover" />
                      {/* Mini watermark */}
                      <div className="absolute bottom-0 right-0 text-yellow-400" style={{ fontSize: '6px', fontWeight: 700, padding: '1px 2px', background: 'rgba(0,0,0,0.5)' }}>AP</div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-display font-semibold text-gray-900 text-sm">{p.nom}</p>
                    {p.images_urls?.length > 1 && <p className="text-xs text-yellow-600">{p.images_urls.length} photos</p>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 font-body">{p.categorie_nom || '—'}</td>
                  <td className="px-3 py-3 font-display font-bold text-yellow-700 text-sm">{formatPrix(p.prix_unitaire)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.stock ? 'Dispo' : 'Rupture'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => toggleActif(p)} className="flex items-center gap-1.5 text-xs font-display font-semibold transition-colors"
                        title={p.actif ? 'Cliquer pour masquer' : 'Cliquer pour afficher'}>
                        {p.actif
                          ? <><ToggleRight className="text-yellow-500" size={22} /><span className="text-yellow-600">Visible</span></>
                          : <><ToggleLeft size={22} className="text-gray-400" /><span className="text-gray-400">Masqué</span></>
                        }
                      </button>
                      <span className="text-xs text-gray-400 font-body">(non supprimé)</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-yellow-600">
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {produits.length === 0 && <div className="text-center py-12 text-gray-400 font-body">Aucun produit VIP</div>}
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Modifier produit VIP' : 'Nouveau produit VIP'} size="xl">
        <div className="space-y-4">
          {/* Images */}
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
              Photos (max 4) + Vidéo (max 15s)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden" style={{ background: '#1a1a2e' }}>
                  <img src={url.startsWith('blob:') ? url : getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1" style={{ fontSize: '7px', color: 'rgba(212,175,55,0.7)', fontWeight: 700 }}>AP</div>
                </div>
              ))}
              {previews.length < 4 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors gap-1">
                  <Upload size={18} className="text-yellow-400" />
                  <span className="text-xs text-yellow-500 font-body">Photos</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                </label>
              )}
            </div>
            {/* Vidéo */}
            <label className="flex items-center gap-3 border border-yellow-200 rounded-xl p-3 cursor-pointer hover:border-yellow-400 transition-colors">
              <Upload size={16} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-display font-semibold text-gray-700">Vidéo courte (max 15s)</p>
                {videoFile ? (
                  <p className="text-xs text-yellow-600 font-body">{videoFile.name}</p>
                ) : (
                  <p className="text-xs text-gray-400 font-body">MP4, WebM — facultatif</p>
                )}
              </div>
              <input type="file" accept="video/mp4,video/webm" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f) }} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom *</label>
              <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" placeholder="Ex: Sac Louis Vuitton Neverfull" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Marque</label>
              <input value={form.marque} onChange={e => setForm(p => ({ ...p, marque: e.target.value }))} className="input-field" placeholder="Ex: Louis Vuitton" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Catégorie</label>
              <select value={form.categorie_id} onChange={e => setForm(p => ({ ...p, categorie_id: e.target.value }))} className="input-field">
                <option value="">Sélectionner...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Prix (FCFA) *</label>
              <input type="number" value={form.prix_unitaire} onChange={e => setForm(p => ({ ...p, prix_unitaire: e.target.value }))} className="input-field" placeholder="150000" />
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Poids (kg)</label>
              <input type="number" step="0.01" value={form.poids_unitaire_kg} onChange={e => setForm(p => ({ ...p, poids_unitaire_kg: e.target.value }))} className="input-field" placeholder="0.5" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.checked }))} />
              <span className="text-sm font-body text-gray-700">En stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))} />
              <span className="text-sm font-body text-gray-700">Visible</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving}
              className="flex-1 text-gray-900 font-display font-bold py-3 rounded-xl disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)' }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setModal(false)} className="px-6 border border-gray-300 rounded-xl font-body text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ==================== CATÉGORIES ====================
function OngletCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState(null)
  const [form, setForm] = useState({ nom: '', icone: '♦', ordre_affichage: 0, actif: true })
  const [saving, setSaving] = useState(false)
  const ICONES_VIP = ['♦', '♠', '♣', '♥', '★', '✦', '◆', '🏆', '👑', '💎', '🥂', '🍾', '🌹', '🎭']

  const load = () => { api.get('/vip/categories?all=true').then(r => { setCategories(r.data.categories || []); setLoading(false) }) }
  useEffect(load, [])

  const save = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    setSaving(true)
    try {
      if (editData) {
        await api.put(`/vip/categories/${editData.id}`, form)
      } else {
        await api.post('/vip/categories', form)
      }
      setModal(false); load(); toast.success('Catégorie enregistrée')
    } catch { toast.error('Erreur') }
    finally { setSaving(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-gray-500 font-body">{categories.length} catégorie(s)</p>
        <button onClick={() => { setEditData(null); setForm({ nom: '', icone: '♦', ordre_affichage: 0, actif: true }); setModal(true) }}
          className="flex items-center gap-2 text-white font-display font-semibold px-4 py-2 rounded-lg text-sm"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)' }}>
          <Plus size={16} /> Nouvelle catégorie
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: '#D4AF37', fontSize: '18px' }}>{cat.icone}</span>
              <span className="font-display font-semibold text-sm text-gray-900">{cat.nom}</span>
            </div>
            <button onClick={() => { setEditData(cat); setForm({ nom: cat.nom, icone: cat.icone, ordre_affichage: cat.ordre_affichage, actif: cat.actif }); setModal(true) }}
              className="p-1.5 text-gray-400 hover:text-yellow-600">
              <Pencil size={14} />
            </button>
          </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editData ? 'Modifier' : 'Nouvelle catégorie VIP'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom *</label>
            <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-2">Icône</label>
            <div className="flex flex-wrap gap-2">
              {ICONES_VIP.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icone: ic }))}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${form.icone === ic ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving}
              className="flex-1 text-gray-900 font-display font-bold py-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)' }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setModal(false)} className="px-5 border border-gray-300 rounded-xl font-body">Annuler</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ==================== MEMBRES ====================
function OngletMembres() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = () => { api.get('/vip/membres').then(r => { setMembres(r.data.membres || []); setLoading(false) }) }
  useEffect(load, [])

  const toggle = async (m) => {
    await api.put(`/vip/membres/${m.id}`, { est_vip: !m.est_vip })
    toast.success(m.est_vip ? 'Accès VIP retiré' : 'Accès VIP activé')
    load()
  }

  const filtres = membres.filter(m =>
    !q || m.nom.toLowerCase().includes(q.toLowerCase()) || m.telephone.includes(q)
  )
  const vips = filtres.filter(m => m.est_vip)
  const standards = filtres.filter(m => !m.est_vip)

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Nom ou téléphone..." value={q} onChange={e => setQ(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
        <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Crown size={14} className="text-yellow-600" />
          <span className="text-sm font-display font-bold text-yellow-700">{vips.length} membre(s) VIP</span>
        </div>
      </div>

      {vips.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-sm text-yellow-700 mb-2 flex items-center gap-1.5">
            <Crown size={14} /> Membres VIP actifs ({vips.length})
          </h3>
          <div className="space-y-2">
            {vips.map(m => <LigneMembre key={m.id} membre={m} onToggle={toggle} />)}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold text-sm text-gray-500 mb-2">Clients standards ({standards.length})</h3>
        <div className="space-y-2">
          {standards.map(m => <LigneMembre key={m.id} membre={m} onToggle={toggle} />)}
        </div>
      </div>
    </div>
  )
}

function LigneMembre({ membre, onToggle }) {
  return (
    <div className={`card p-3 flex items-center gap-3 ${membre.est_vip ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${membre.est_vip ? 'bg-yellow-100' : 'bg-gray-100'}`}>
        {membre.est_vip ? <Crown size={16} className="text-yellow-600" /> : <span className="font-display font-bold text-gray-600 text-sm">{membre.nom?.[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-gray-900 truncate">{membre.nom}</p>
        <p className="text-xs text-gray-400 font-body">{membre.telephone}</p>
      </div>
      <button onClick={() => onToggle(membre)}
        className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1.5 rounded-lg transition-colors ${
          membre.est_vip
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-700'
        }`}>
        <Crown size={12} />
        {membre.est_vip ? 'Retirer VIP' : 'Activer VIP'}
      </button>
    </div>
  )
}
