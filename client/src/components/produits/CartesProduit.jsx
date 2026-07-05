import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Package } from 'lucide-react'
import useCartStore from '../../store/useCartStore'
import { formatPrix } from '../../lib/utils'
import { getImageUrl } from '../../lib/imageUrl'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function CarteProduit({ produit }) {
  const addItem = useCartStore(s => s.addItem)
  const [videoUrl, setVideoUrl] = React.useState(null)

  React.useEffect(() => {
    // Charger discrètement la vidéo si elle existe
    api.get(`/medias/produit/${produit.id}`)
      .then(r => {
        const vid = (r.data.medias || []).find(m => m.type === 'video')
        if (vid) setVideoUrl(vid.url)
      })
      .catch(() => {})
  }, [produit.id])

  const handleAdd = (type, e) => {
    e.preventDefault()
    addItem(produit, type, 1)
    toast.success(`Ajouté au panier`)
  }

  const imageUrl = getImageUrl(produit.image_url)

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <Link to={`/produit/${produit.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {videoUrl ? (
            <video
              src={getImageUrl(videoUrl)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
          ) : (
            <img
              src={imageUrl}
              alt={produit.nom}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { e.target.src = 'https://placehold.co/400x300/E8F5E9/2E7D32?text=AlloPanier' }}
            />
          )}
          {!produit.stock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="badge-rupture text-sm px-3 py-1">Rupture de stock</span>
            </div>
          )}
          {produit.categorie_nom && (
            <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-xs font-display font-semibold px-2 py-0.5 rounded-full">
              {produit.categorie_nom}
            </span>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-4">
        <Link to={`/produit/${produit.id}`}>
          <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug mb-1 hover:text-primary-600 transition-colors line-clamp-2">
            {produit.nom}
          </h3>
        </Link>

        {produit.description && (
          <p className="text-xs text-gray-500 font-body mb-3 line-clamp-2">{produit.description}</p>
        )}

        {/* Prix et boutons */}
        <div className="space-y-2">
          {/* Prix unitaire */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-display font-bold text-primary-600">{formatPrix(produit.prix_unitaire)}</span>
              {produit.poids_unitaire_kg && (
                <span className="text-xs text-gray-400 ml-1">/ {produit.poids_unitaire_kg}kg</span>
              )}
            </div>
            <button
              onClick={e => handleAdd('unite', e)}
              disabled={!produit.stock}
              className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={13} />
              Ajouter
            </button>
          </div>

          {/* Prix gros */}
          {produit.prix_gros && produit.seuil_gros && (
            <div className="flex items-center justify-between gap-2 bg-secondary-50 rounded-lg px-2 py-1.5">
              <div>
                <span className="font-display font-bold text-secondary-600 text-sm">{formatPrix(produit.prix_gros)}</span>
                <span className="text-xs text-gray-500 ml-1">
                  {produit.label_gros || `à partir de ${produit.seuil_gros}`}
                </span>
              </div>
              <button
                onClick={e => handleAdd('gros', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1 bg-secondary-600 hover:bg-secondary-700 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={13} />
                Gros
              </button>
            </div>
          )}

          {/* Conditionnements */}
          {produit.has_carton && produit.prix_carton && (
            <div className="flex items-center justify-between gap-2 bg-blue-50 rounded-lg px-2 py-1.5">
              <div>
                <span className="font-display font-bold text-blue-700 text-sm">{formatPrix(produit.prix_carton)}</span>
                <span className="text-xs text-gray-500 ml-1">
                  carton {produit.qte_carton ? `(${produit.qte_carton} u.)` : ''}
                </span>
              </div>
              <button
                onClick={e => handleAdd('carton', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Package size={13} />
                Carton
              </button>
            </div>
          )}

          {produit.has_sac && produit.prix_sac && (
            <div className="flex items-center justify-between gap-2 bg-purple-50 rounded-lg px-2 py-1.5">
              <div>
                <span className="font-display font-bold text-purple-700 text-sm">{formatPrix(produit.prix_sac)}</span>
                <span className="text-xs text-gray-500 ml-1">sac {produit.qte_sac ? `(${produit.qte_sac} u.)` : ''}</span>
              </div>
              <button
                onClick={e => handleAdd('sac', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Package size={13} />
                Sac
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
