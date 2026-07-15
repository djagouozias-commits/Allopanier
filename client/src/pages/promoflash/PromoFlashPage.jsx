import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Store, Zap, ShoppingCart, Trash2,
  Navigation, Truck, CheckCircle, X, ShoppingBag
} from 'lucide-react'
import api from '../../lib/api'
import { getImageUrl } from '../../lib/imageUrl'
import usePromoFlashCartStore from '../../store/usePromoFlashCartStore'
import PromoFlashGPS from './PromoFlashGPS'
import MapModal from '../../components/ui/MapModal'
import toast from 'react-hot-toast'

function formatF(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA' }

/* ─── Carte produit ─────────────────────────────────────── */
function CartePromo({ produit, dansPanier, onToggle }) {
  const jours = produit.joursRestants
  const urgence = jours <= 2

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-md ${dansPanier ? 'border-purple-500 ring-2 ring-purple-200' : urgence ? 'border-red-200' : 'border-gray-200'}`}>
      {/* Media */}
      <div className="relative aspect-square bg-gray-100">
        {produit.video_url ? (
          <video src={getImageUrl(produit.video_url)} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : produit.photo_url ? (
          <img src={getImageUrl(produit.photo_url)} alt={produit.nom} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-50">
            <Zap size={40} className="text-purple-300" />
          </div>
        )}

        {/* Badge réduction */}
        <div className="absolute top-2 left-2 bg-purple-600 text-white font-display font-bold text-sm px-2.5 py-1 rounded-full">
          -{produit.reductionPct}%
        </div>

        {/* Badge urgence */}
        {urgence && (
          <div className="absolute top-2 right-2 bg-red-500 text-white font-display font-bold text-xs px-2 py-0.5 rounded-full animate-pulse">
            {jours === 0 ? 'Dernier jour' : `${jours}j`}
          </div>
        )}

        {/* Badge dans le panier */}
        {dansPanier && (
          <div className="absolute bottom-2 right-2 bg-purple-600 text-white rounded-full p-1.5 shadow-md">
            <CheckCircle size={16} />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-purple-600 font-display font-semibold mb-1 truncate">{produit.vendeur_nom}</p>
        <h3 className="font-display font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{produit.nom}</h3>

        <div className="flex items-end gap-2 mb-2">
          <span className="font-display font-extrabold text-base text-purple-700">{formatF(produit.prixDuJour)}</span>
          {produit.prix_normal && (
            <span className="text-xs text-gray-400 font-body line-through">{formatF(produit.prix_normal)}</span>
          )}
        </div>

        {/* Barre progression */}
        <div className="mb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${urgence ? 'bg-red-400' : 'bg-purple-500'}`}
              style={{ width: `${Math.max(10, (jours / 10) * 100)}%` }} />
          </div>
          <p className={`text-xs mt-0.5 font-body ${urgence ? 'text-red-500' : 'text-gray-400'}`}>
            {jours === 0 ? "Expire aujourd'hui" : `${jours}j restant${jours > 1 ? 's' : ''}`}
          </p>
        </div>

        <p className="text-xs text-gray-500 font-body mb-3">
          {produit.quantite_disponible > 0 ? `${produit.quantite_disponible} disponible(s)` : 'Épuisé'}
        </p>

        <button
          onClick={() => onToggle(produit)}
          disabled={produit.quantite_disponible <= 0}
          className={`w-full font-display font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 ${
            dansPanier
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white'
          }`}
        >
          {dansPanier ? (
            <><Trash2 size={14} /> Retirer</>
          ) : (
            <><ShoppingCart size={14} /> {produit.quantite_disponible > 0 ? 'Ajouter au panier' : 'Épuisé'}</>
          )}
        </button>
      </div>
    </div>
  )
}

/* ─── Modal choix livraison / faire soi-même ──────────── */
function ModalChoix({ items, onFaireSoiMeme, onConfierAllopanier, onFermer }) {
  const total = items.reduce((s, i) => s + (Number(i.prix) || 0), 0)
  const nbMagasins = new Set(items.map(i => i.produit.vendeur_id || i.produit.id)).size

  return (
    <div className="fixed inset-0 z-[9000] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 text-white px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Comment souhaitez-vous récupérer vos articles ?</h2>
            <p className="text-purple-200 text-sm font-body mt-0.5">{items.length} article(s) — {nbMagasins} boutique{nbMagasins > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onFermer} className="p-1 hover:bg-purple-600 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Récap articles */}
        <div className="px-5 py-3 max-h-40 overflow-y-auto border-b border-gray-100 space-y-1.5">
          {items.map(item => (
            <div key={item.produit.id} className="flex items-center justify-between text-sm font-body">
              <div className="min-w-0 flex-1">
                <span className="text-gray-800 truncate block">{item.produit.nom}</span>
                <span className="text-xs text-purple-600">{item.produit.vendeur_nom}</span>
              </div>
              <span className="font-display font-semibold text-purple-700 ml-3 flex-shrink-0">{formatF(item.prix)}</span>
            </div>
          ))}
          <div className="pt-1 border-t border-gray-100 flex justify-between font-display font-bold text-sm">
            <span>Total</span>
            <span className="text-purple-700">{formatF(total)}</span>
          </div>
        </div>

        {/* Choix */}
        <div className="p-5 space-y-3">
          {/* Option 1 : faire soi-même */}
          <button
            onClick={onFaireSoiMeme}
            className="w-full flex items-start gap-4 p-4 border-2 border-purple-500 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors text-left group"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Navigation size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-purple-800 text-base">Je fais les courses moi-même</p>
              <p className="text-sm text-purple-600 font-body mt-0.5">Le GPS trace le trajet complet de boutique en boutique avec assistance vocale, puis vous ramène à votre point de départ.</p>
            </div>
          </button>

          {/* Option 2 : confier à AlloPanier */}
          <button
            onClick={onConfierAllopanier}
            className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-green-400 bg-white hover:bg-green-50 rounded-2xl transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Truck size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-gray-800 text-base">Confier à AlloPanier</p>
              <p className="text-sm text-gray-500 font-body mt-0.5">Notre équipe récupère vos articles dans les boutiques et vous livre à domicile. Contactez-nous sur WhatsApp.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Page principale ─────────────────────────────────── */
export default function PromoFlashPage() {
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalChoix, setModalChoix] = useState(false)
  const [gpsOuvert, setGpsOuvert] = useState(false)
  const [positionDepart, setPositionDepart] = useState(null)
  const [mapDepartOpen, setMapDepartOpen] = useState(false)

  const { items, addItem, removeItem, clearCart, getItemCount } = usePromoFlashCartStore()
  const nbPanier = getItemCount()

  const charger = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: 20, page })
    if (q) params.append('q', q)
    api.get(`/promoflash/produits?${params}`)
      .then(r => { setProduits(r.data.produits || []); setTotal(r.data.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(charger, [q, page])

  const handleToggle = (produit) => {
    const existe = items.find(i => i.produit.id === produit.id)
    if (existe) {
      removeItem(produit.id)
      toast(`Retiré du panier`, { icon: '🗑️' })
    } else {
      const ok = addItem(produit)
      if (ok) toast.success('Ajouté au panier PromoFlash')
    }
  }

  const handleValiderPanier = () => {
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    setModalChoix(true)
  }

  const handleFaireSoiMeme = () => {
    setModalChoix(false)
    const sansCoords = items.filter(i => !i.produit.vendeur_lat || !i.produit.vendeur_lng)
    if (sansCoords.length > 0) {
      toast.error(`${sansCoords.length} boutique(s) sans position GPS.`)
      return
    }
    // Proposer de choisir une position de départ ou utiliser GPS automatique
    setMapDepartOpen(true)
  }

  const handleValiderPositionDepart = ({ lat, lng }) => {
    setPositionDepart({ lat, lng })
    setMapDepartOpen(false)
    setGpsOuvert(true)
  }

  const handleUtiliserGPSAuto = () => {
    setPositionDepart(null) // sera détecté automatiquement
    setMapDepartOpen(false)
    setGpsOuvert(true)
  }

  const handleConfierAllopanier = () => {
    setModalChoix(false)
    const liste = items.map(i => `• ${i.produit.nom} (${formatF(i.prix)}) chez ${i.produit.vendeur_nom}`).join('\n')
    const msg = encodeURIComponent(`Bonjour AlloPanier ! Je veux confier mes achats PromoFlash :\n${liste}\nMerci de me confirmer la possibilité et les frais de service.`)
    window.open(`https://wa.me/22968204654?text=${msg}`, '_blank')
  }

  // Appelé quand le GPS se ferme (terminé ou annulé)
  const handleFermerGPS = async (etapesTerminees, etapes) => {
    setGpsOuvert(false)

    const etapesFaites = etapesTerminees.map(i => etapes[i]).filter(Boolean)
    if (etapesFaites.length === 0) {
      toast('Aucune boutique visitée — trajet annulé', { icon: '↩️' })
      return
    }

    // Construire la liste des articles récupérés
    const articlesRecuperes = etapesFaites.flatMap(e => e.articles)

    // Enregistrer dans les commandes PromoFlash
    try {
      const lignes = articlesRecuperes.map(a => ({
        produit_id: a.produit.id,
        vendeur_id: a.produit.vendeur_id || null,
        prix_applique: a.prix || a.produit.prixDuJour || 0,
        quantite: a.quantite || 1,
        nom_produit: a.produit.nom,
        vendeur_nom: a.produit.vendeur_nom,
      }))
      const total = articlesRecuperes.reduce((s, a) => s + (Number(a.prix) || 0), 0)

      await api.post('/promoflash/commandes', {
        mode: 'retrait_soi_meme',
        total,
        lignes,
        nb_boutiques_visitees: etapesFaites.length,
        nb_boutiques_total: etapes.length,
      })
      toast.success(`Trajet enregistré — ${etapesFaites.length} boutique${etapesFaites.length > 1 ? 's' : ''} visitée${etapesFaites.length > 1 ? 's' : ''}`)
    } catch {
      toast('Trajet terminé (non enregistré)', { icon: '⚠️' })
    }

    // Vider le panier PromoFlash
    clearCart()
  }

  // GPS plein écran
  if (gpsOuvert) {
    return <PromoFlashGPS items={items} positionDepart={positionDepart} onClose={handleFermerGPS} />
  }

  return (
    <div>
      {/* Modal choix */}
      {modalChoix && (
        <ModalChoix
          items={items}
          onFaireSoiMeme={handleFaireSoiMeme}
          onConfierAllopanier={handleConfierAllopanier}
          onFermer={() => setModalChoix(false)}
        />
      )}

      {/* Modal choix position de départ */}
      {mapDepartOpen && (
        <div className="fixed inset-0 z-[9000] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-purple-700 text-white px-5 py-4">
              <p className="font-display font-bold text-base">Position de départ</p>
              <p className="text-purple-200 text-sm font-body mt-0.5">D'où partez-vous ?</p>
            </div>
            <div className="p-5 space-y-3">
              <button
                onClick={handleUtiliserGPSAuto}
                className="w-full flex items-start gap-4 p-4 border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Navigation size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-purple-800">Ma position GPS actuelle</p>
                  <p className="text-sm text-purple-600 font-body mt-0.5">Le GPS détecte automatiquement votre position</p>
                </div>
              </button>
              <button
                onClick={() => setMapDepartOpen('carte')}
                className="w-full flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-gray-300 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-display font-bold text-gray-800">Choisir sur la carte</p>
                  <p className="text-sm text-gray-500 font-body mt-0.5">Indiquer un autre point de départ sur la carte</p>
                </div>
              </button>
              <button onClick={() => setMapDepartOpen(false)} className="w-full text-center text-sm text-gray-400 font-body py-2">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MapModal pour choisir manuellement la position de départ */}
      <MapModal
        isOpen={mapDepartOpen === 'carte'}
        onClose={() => setMapDepartOpen(false)}
        title="Choisir votre point de départ"
        onValidate={handleValiderPositionDepart}
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Zap size={22} className="text-purple-900" fill="currentColor" />
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl">PromoFlash</h1>
          </div>
          <p className="text-purple-200 font-body text-base mb-1 max-w-xl">
            Produits à prix cassé — Max 10 jours. Le prix baisse chaque jour.
          </p>
          <p className="text-purple-300 font-body text-sm max-w-xl mb-5">
            Ajoutez plusieurs articles, puis choisissez de faire les courses vous-même (GPS + voix) ou de les confier à AlloPanier.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/promoflash/vendre"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-display font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              <Store size={16} /> Vendre mes surplus
            </Link>
            <Link to="/promoflash/vendeur/connexion"
              className="border border-purple-400 text-white hover:bg-purple-600 font-display font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Espace vendeur
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barre recherche */}
        <div className="relative mb-5 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Chercher un article, une boutique..."
            value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            className="input-field pl-10 text-base" />
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Zap size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-body">
            <strong>Comment ça marche :</strong> Ajoutez les articles qui vous intéressent. Validez le panier — choisissez de faire les courses vous-même (GPS trace le trajet boutique par boutique avec guide vocal) ou de confier la mission à AlloPanier.
          </p>
        </div>

        {/* Grille produits */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : produits.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-body text-lg mb-2">Aucune promo flash disponible</p>
            <p className="text-gray-400 font-body text-sm">Revenez bientôt ou devenez vendeur !</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-body mb-4">{total} offre{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-32">
              {produits.map(p => (
                <CartePromo
                  key={p.id}
                  produit={p}
                  dansPanier={!!items.find(i => i.produit.id === p.id)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </>
        )}

        {/* Note */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-600 font-body">
            Mauvais traitement ou qualité insuffisante ? Contactez-nous :<br />
            <a href="https://wa.me/22968204654" target="_blank" rel="noopener noreferrer"
              className="text-green-600 font-display font-semibold hover:underline">
              WhatsApp : +229 68 20 46 54
            </a>
          </p>
        </div>
      </div>

      {/* Barre panier flottante */}
      {nbPanier > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-lg mx-auto flex items-center gap-3 bg-purple-700 rounded-2xl px-4 py-3 shadow-2xl">
            <div className="flex-1 min-w-0">
              <p className="text-white font-display font-bold text-sm">
                {nbPanier} article{nbPanier > 1 ? 's' : ''} dans mon panier
              </p>
              <p className="text-purple-300 text-xs font-body truncate">
                {items.map(i => i.produit.nom).join(', ')}
              </p>
            </div>
            <button
              onClick={() => clearCart()}
              className="p-2 text-purple-300 hover:text-red-400 transition-colors flex-shrink-0"
              title="Vider le panier">
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleValiderPanier}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-display font-bold text-sm px-5 py-2.5 rounded-xl transition-colors flex-shrink-0">
              <ShoppingBag size={16} />
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
