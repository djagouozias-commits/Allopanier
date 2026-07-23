import React from 'react'
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
    api.get(`/medias/produit/${produit.id}`)
      .then(r => {
        const vid = (r.data.medias || []).find(m => m.type === 'video')
        if (vid) setVideoUrl(vid.url)
      })
      .catch(() => {})
  }, [produit.id])

  const handleAdd = (type, e) => {
    e.stopPropagation()
    addItem(produit, type, 1)
    toast.success(`Ajouté au panier`)
  }

  const imageUrl = getImageUrl(produit.image_url)

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
        {videoUrl ? (
          <video
            src={getImageUrl(videoUrl)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            muted loop playsInline autoPlay preload="metadata"
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
            <span className="badge-rupture text-xs px-2 py-1">Rupture</span>
          </div>
        )}
        {produit.categorie_nom && (
          <span className="absolute top-2 left-2 bg-white/90 text-gray-700 text-[10px] font-display font-semibold px-1.5 py-0.5 rounded-full leading-tight">
            {produit.categorie_nom}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2">
          {produit.nom}
        </h3>

        {produit.description && (
          <p className="text-[11px] text-gray-500 font-body mb-2 line-clamp-1">{produit.description}</p>
        )}

        {/* Boutons d'achat */}
        <div className="space-y-2 mt-auto">

          {/* Prix unitaire + Ajouter */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display font-bold text-primary-600 text-sm leading-tight">
                {formatPrix(produit.prix_unitaire)}
              </p>
              {produit.poids_unitaire_kg && (
                <p className="text-[10px] text-gray-400 leading-tight">{produit.poids_unitaire_kg} kg</p>
              )}
            </div>
            <button
              onClick={e => handleAdd('unite', e)}
              disabled={!produit.stock}
              className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
            >
              <ShoppingCart size={13} />
              Ajouter
            </button>
          </div>

          {/* Prix gros */}
          {produit.prix_gros && produit.seuil_gros && (
            <div className="flex items-center justify-between gap-2 bg-secondary-50 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-secondary-600 text-sm leading-tight">
                  {formatPrix(produit.prix_gros)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight truncate">
                  {produit.label_gros || `dès ${produit.seuil_gros}`}
                </p>
              </div>
              <button
                onClick={e => handleAdd('gros', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1.5 bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
              >
                <ShoppingCart size={13} />
                Gros
              </button>
            </div>
          )}

          {/* Carton */}
          {produit.has_carton && produit.prix_carton && (
            <div className="flex items-center justify-between gap-2 bg-blue-50 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-blue-700 text-sm leading-tight">
                  {formatPrix(produit.prix_carton)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  carton{produit.qte_carton ? ` (${produit.qte_carton} u.)` : ''}
                </p>
              </div>
              <button
                onClick={e => handleAdd('carton', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
              >
                <Package size={13} />
                Carton
              </button>
            </div>
          )}

          {/* Sac */}
          {produit.has_sac && produit.prix_sac && (
            <div className="flex items-center justify-between gap-2 bg-purple-50 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-purple-700 text-sm leading-tight">
                  {formatPrix(produit.prix_sac)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  sac{produit.qte_sac ? ` (${produit.qte_sac} u.)` : ''}
                </p>
              </div>
              <button
                onClick={e => handleAdd('sac', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
              >
                <Package size={13} />
                Sac
              </button>
            </div>
          )}

          {/* Boîte */}
          {produit.has_boite && produit.prix_boite && (
            <div className="flex items-center justify-between gap-2 bg-amber-50 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-amber-700 text-sm leading-tight">
                  {formatPrix(produit.prix_boite)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  boîte{produit.qte_boite ? ` (${produit.qte_boite} u.)` : ''}
                </p>
              </div>
              <button
                onClick={e => handleAdd('boite', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
              >
                <Package size={13} />
                Boîte
              </button>
            </div>
          )}

          {/* Sachet */}
          {produit.has_sachet && produit.prix_sachet && (
            <div className="flex items-center justify-between gap-2 bg-teal-50 rounded-lg px-2.5 py-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-teal-700 text-sm leading-tight">
                  {formatPrix(produit.prix_sachet)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">
                  sachet{produit.qte_sachet ? ` (${produit.qte_sachet} u.)` : ''}
                </p>
              </div>
              <button
                onClick={e => handleAdd('sachet', e)}
                disabled={!produit.stock}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-display font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 min-h-[36px]"
              >
                <Package size={13} />
                Sachet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
