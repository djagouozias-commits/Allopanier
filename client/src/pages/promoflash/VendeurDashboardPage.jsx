import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Zap, Package, LogOut, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { getImageUrl } from '../../lib/imageUrl'
import Modal from '../../components/ui/Modal'
import MapModal from '../../components/ui/MapModal'
import toast from 'react-hot-toast'

function formatF(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA' }

// Hook token vendeur
function useVendeurAuth() {
  const navigate = useNavigate()
  const [vendeur, setVendeur] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('vendeur-token')
    const v = localStorage.getItem('vendeur-info')
    if (!t || !v) { navigate('/promoflash/vendeur/connexion'); return }
    setToken(t)
    try { setVendeur(JSON.parse(v)) } catch { navigate('/promoflash/vendeur/connexion') }
  }, [])

  const apiVendeur = (url, options = {}) => {
    return api({ url, ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } })
  }

  return { vendeur, token, apiVendeur }
}

export default function VendeurDashboardPage() {
  const navigate = useNavigate()
  const { vendeur, token } = useVendeurAuth()
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [form, setForm] = useState({
    nom: '', description: '', date_expiration: '', prix_normal: '',
    prix_promo_debut: '', prix_promo_fin: '', quantite_disponible: 1
  })
  const [photo, setPhoto] = useState(null)
  const [video, setVideo] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get('/promoflash/mes-produits', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setProduits(r.data.produits || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const deconnexion = () => {
    localStorage.removeItem('vendeur-token')
    localStorage.removeItem('vendeur-info')
    navigate('/promoflash')
  }

  // Calcul max date (aujourd'hui + 10j)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 10)
  const maxDateStr = maxDate.toISOString().split('T')[0]
  const minDateStr = new Date().toISOString().split('T')[0]

  const ajouterProduit = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return }
    if (!form.date_expiration) { toast.error('Date d\'expiration requise'); return }
    if (!form.prix_promo_debut || !form.prix_promo_fin) { toast.error('Prix promo requis'); return }
    if (parseFloat(form.prix_promo_fin) > parseFloat(form.prix_promo_debut)) {
      toast.error('Le prix final doit être inférieur au prix de départ')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') fd.append(k, v) })
      if (photo) fd.append('photo', photo)
      if (video) fd.append('video', video)

      await api.post('/promoflash/produits', fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      })
      toast.success('Produit ajouté !')
      setModal(false)
      setForm({ nom: '', description: '', date_expiration: '', prix_normal: '', prix_promo_debut: '', prix_promo_fin: '', quantite_disponible: 1 })
      setPhoto(null); setVideo(null)
      // Recharger
      const r = await api.get('/promoflash/mes-produits', { headers: { Authorization: `Bearer ${token}` } })
      setProduits(r.data.produits || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const supprimerProduit = async (id) => {
    if (!window.confirm('Désactiver ce produit ?')) return
    await api.delete(`/promoflash/produits/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    setProduits(p => p.filter(x => x.id !== id))
    toast.success('Produit retiré')
  }

  if (!vendeur) return null

  const produitsActifs = produits.filter(p => p.actif && new Date(p.date_expiration) >= new Date())
  const produitsExpires = produits.filter(p => !p.actif || new Date(p.date_expiration) < new Date())

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <div className="bg-purple-700 text-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Zap size={20} className="text-yellow-300" />
            </div>
            <div>
              <p className="font-display font-bold">{vendeur.nom}</p>
              <p className="text-purple-300 text-xs font-body">{vendeur.type_vendeur}</p>
            </div>
          </div>
          <button onClick={deconnexion} className="flex items-center gap-1.5 text-purple-300 hover:text-white text-sm font-body transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Alerte validation */}
        {!vendeur.valide_admin && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-orange-800 text-sm">Compte en attente de validation</p>
              <p className="text-xs text-orange-600 font-body mt-1">
                Votre compte est en cours de vérification par AlloPanier. Vous pouvez ajouter vos produits dès maintenant, ils seront visibles après validation.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="font-display font-bold text-2xl text-purple-600">{produitsActifs.length}</p>
            <p className="text-xs text-gray-500 font-body">Actifs</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="font-display font-bold text-2xl text-gray-400">{produitsExpires.length}</p>
            <p className="text-xs text-gray-500 font-body">Expirés</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="font-display font-bold text-2xl text-green-600">
              {formatF(produits.reduce((s, p) => s + parseFloat(p.prix_promo_debut || 0) * (p.quantite_disponible || 0), 0)).split(' ')[0]}
            </p>
            <p className="text-xs text-gray-500 font-body">Valeur stock</p>
          </div>
        </div>

        {/* Bouton ajouter */}
        <button onClick={() => setModal(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md">
          <Plus size={20} /> Ajouter un produit en promo
        </button>

        {/* Liste produits */}
        {loading ? (
          <div className="flex justify-center py-8"><span className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
        ) : produits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-body">Aucun produit. Ajoutez-en un !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {produits.map(p => {
              const expire = new Date(p.date_expiration) < new Date()
              const joursRestants = Math.max(0, Math.ceil((new Date(p.date_expiration) - new Date()) / (1000 * 60 * 60 * 24)))
              return (
                <div key={p.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 ${expire || !p.actif ? 'opacity-50' : ''}`}>
                  {p.photo_url ? (
                    <img src={getImageUrl(p.photo_url)} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap size={20} className="text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-gray-900 text-sm truncate">{p.nom}</p>
                    <p className="text-xs font-body text-gray-500">
                      {expire ? '🔴 Expiré' : `⏳ ${joursRestants} j. restant${joursRestants > 1 ? 's' : ''}`}
                      {' — '}
                      {formatF(p.prixDuJour || p.prix_promo_debut)} aujourd'hui
                    </p>
                    <p className="text-xs text-gray-400 font-body">Qté : {p.quantite_disponible}</p>
                  </div>
                  <button onClick={() => supprimerProduit(p.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center">
          <Link to="/promoflash" className="text-purple-600 hover:underline text-sm font-body">
            Voir la page PromoFlash publique
          </Link>
        </div>
      </div>

      {/* Modal ajout produit */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Ajouter un produit en promo" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Nom du produit *</label>
            <input type="text" placeholder="Ex: Yaourt Danone, Fromage Gouda..." value={form.nom}
              onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Description</label>
            <textarea rows={2} placeholder="Précisions sur le produit, état, contenu..." value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" />
          </div>

          {/* Date expiration */}
          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">
              Date d'expiration * <span className="text-red-500 font-normal text-xs">(max 10 jours)</span>
            </label>
            <input type="date" min={minDateStr} max={maxDateStr} value={form.date_expiration}
              onChange={e => setForm(p => ({ ...p, date_expiration: e.target.value }))} className="input-field" />
          </div>

          {/* Prix */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-display font-semibold text-gray-600 mb-1">Prix normal (FCFA)</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" placeholder="800" value={form.prix_normal}
                onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()}
                onChange={e => setForm(p => ({ ...p, prix_normal: e.target.value.replace(/\D/g,'') }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-gray-600 mb-1">Prix promo début *</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" placeholder="400" value={form.prix_promo_debut}
                onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()}
                onChange={e => setForm(p => ({ ...p, prix_promo_debut: e.target.value.replace(/\D/g,'') }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-gray-600 mb-1">Prix promo fin *</label>
              <input type="number" inputMode="numeric" pattern="[0-9]*" min="0" placeholder="300" value={form.prix_promo_fin}
                onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()}
                onChange={e => setForm(p => ({ ...p, prix_promo_fin: e.target.value.replace(/\D/g,'') }))} className="input-field text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Quantité disponible</label>
            <input type="number" inputMode="numeric" pattern="[0-9]*" min="1" value={form.quantite_disponible}
              onKeyDown={e => ['e','E','+','-','.'].includes(e.key) && e.preventDefault()}
              onChange={e => setForm(p => ({ ...p, quantite_disponible: e.target.value.replace(/\D/g,'') }))} className="input-field w-32" />
          </div>

          {/* Photo/Vidéo produit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Photo du produit</label>
              <label className="flex items-center justify-center border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-purple-400 transition-colors h-20">
                {photo ? <p className="text-xs text-purple-600 font-body text-center">{photo.name}</p> : (
                  <span className="text-xs text-gray-400 font-body text-center">Cliquer pour choisir</span>
                )}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setPhoto(f) }} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-1">Vidéo courte (15s max)</label>
              <label className="flex items-center justify-center border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-purple-400 transition-colors h-20">
                {video ? <p className="text-xs text-purple-600 font-body text-center">{video.name}</p> : (
                  <span className="text-xs text-gray-400 font-body text-center">Cliquer pour choisir</span>
                )}
                <input type="file" accept="video/mp4,video/webm" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setVideo(f) }} />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={ajouterProduit} disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-display font-bold py-3 rounded-xl disabled:opacity-50">
              {saving ? 'Ajout en cours...' : 'Ajouter ce produit'}
            </button>
            <button onClick={() => setModal(false)} className="px-5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-body">
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
