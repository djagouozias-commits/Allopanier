import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Clock, Store, Zap, ArrowRight, Play } from 'lucide-react'
import api from '../../lib/api'
import { getImageUrl } from '../../lib/imageUrl'
import MapModal from '../../components/ui/MapModal'
import toast from 'react-hot-toast'

function formatF(n) { return Number(n).toLocaleString('fr-FR') + ' FCFA' }

function CartePromo({ produit, onChoisir }) {
  const jours = produit.joursRestants
  const urgence = jours <= 2

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all hover:shadow-md ${urgence ? 'border-red-200' : 'border-gray-200'}`}>
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
            {jours === 0 ? 'Dernier jour' : `${jours}j restant${jours > 1 ? 's' : ''}`}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Vendeur */}
        <p className="text-xs text-purple-600 font-display font-semibold mb-1 truncate">{produit.vendeur_nom}</p>

        {/* Nom produit */}
        <h3 className="font-display font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{produit.nom}</h3>

        {/* Prix */}
        <div className="flex items-end gap-2 mb-2">
          <span className="font-display font-extrabold text-lg text-purple-700">{formatF(produit.prixDuJour)}</span>
          {produit.prix_normal && (
            <span className="text-xs text-gray-400 font-body line-through">{formatF(produit.prix_normal)}</span>
          )}
        </div>

        {/* Barre de progression durée */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 font-body mb-1">
            <span>Prix aujourd'hui</span>
            <span className={`font-semibold ${urgence ? 'text-red-500' : 'text-gray-500'}`}>
              {jours === 0 ? "Expire aujourd'hui" : `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${urgence ? 'bg-red-400' : 'bg-purple-500'}`}
              style={{ width: `${Math.max(10, (jours / 10) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 font-body mt-0.5">
            <span>{formatF(produit.prix_promo_debut)}</span>
            <span>{formatF(produit.prix_promo_fin)}</span>
          </div>
        </div>

        {/* Prix disponible */}
        <p className="text-xs text-gray-500 font-body mb-3">
          {produit.quantite_disponible > 0 ? `${produit.quantite_disponible} disponible(s)` : 'Épuisé'}
        </p>

        {/* Action */}
        <button
          onClick={() => onChoisir(produit)}
          disabled={produit.quantite_disponible <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-display font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
        >
          <MapPin size={15} />
          {produit.quantite_disponible > 0 ? 'Je veux ça — Voir le chemin' : 'Épuisé'}
        </button>
      </div>
    </div>
  )
}

export default function PromoFlashPage() {
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [mapOpen, setMapOpen] = useState(false)
  const [produitSelectionne, setProduitSelectionne] = useState(null)
  const [positionClient, setPositionClient] = useState(null)
  const navigate = useNavigate()

  const charger = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: 20, page })
    if (q) params.append('q', q)
    api.get(`/promoflash/produits?${params}`)
      .then(r => { setProduits(r.data.produits || []); setTotal(r.data.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(charger, [q, page])

  const handleChoisir = (produit) => {
    setProduitSelectionne(produit)
    setMapOpen(true)
  }

  const handleValiderPosition = ({ lat, lng }) => {
    setPositionClient({ lat, lng })
    // Ouvrir Google Maps avec itinéraire vers la boutique
    if (produitSelectionne?.vendeur_lat && produitSelectionne?.vendeur_lng) {
      const url = `https://www.google.com/maps/dir/${lat},${lng}/${produitSelectionne.vendeur_lat},${produitSelectionne.vendeur_lng}`
      window.open(url, '_blank')
    }
    toast.success('Itinéraire ouvert vers la boutique')
    setMapOpen(false)
    setProduitSelectionne(null)
  }

  return (
    <div>
      {/* Hero PromoFlash */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Zap size={22} className="text-purple-900" fill="currentColor" />
            </div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl">PromoFlash</h1>
          </div>
          <p className="text-purple-200 font-body text-lg mb-2 max-w-xl">
            Produits à prix cassé — Max 10 jours avant expiration. Le prix baisse chaque jour.
          </p>
          <p className="text-purple-300 font-body text-sm max-w-xl">
            Premier arrivé, premier servi. Pas de réservation — levez-vous et partez !
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/promoflash/vendre"
              className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-display font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
              <Store size={18} /> Vendre mes surplus
            </Link>
            <Link to="/promoflash/vendeur/connexion"
              className="border border-purple-400 text-white hover:bg-purple-600 font-display font-semibold px-6 py-3 rounded-xl transition-colors">
              Espace vendeur
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recherche */}
        <div className="relative mb-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Chercher un article, une boutique..."
            value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            className="input-field pl-10 text-base" />
        </div>

        {/* Alerte */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Zap size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-bold text-amber-800">Comment ça marche ?</p>
            <p className="text-xs text-amber-700 font-body mt-0.5">
              Choisissez un article, activez votre GPS, et l'itinéraire vers la boutique s'ouvre automatiquement.
              Aucune réservation possible — le premier sur place emporte la marchandise.
              Possibilité de livraison par AlloPanier : déposez votre bon de commande au 0168204654 sur WhatsApp.
            </p>
          </div>
        </div>

        {/* Résultats */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {produits.map(p => <CartePromo key={p.id} produit={p} onChoisir={handleChoisir} />)}
            </div>
          </>
        )}

        {/* Note dénonciation */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-600 font-body">
            Pour toute dénonciation de mauvais traitement clientèle ou qualité de service insuffisante, contactez-nous :<br/>
            <a href="https://wa.me/22968204654" target="_blank" rel="noopener noreferrer"
              className="text-green-600 font-display font-semibold hover:underline">
              WhatsApp : +229 68 20 46 54
            </a>
          </p>
        </div>
      </div>

      {/* Carte itinéraire */}
      {produitSelectionne && (
        <MapModal
          isOpen={mapOpen}
          onClose={() => { setMapOpen(false); setProduitSelectionne(null) }}
          title={`Votre position — Itinéraire vers ${produitSelectionne.vendeur_nom}`}
          onValidate={handleValiderPosition}
        />
      )}
    </div>
  )
}
