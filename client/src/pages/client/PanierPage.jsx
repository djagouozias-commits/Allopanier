import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import useCartStore, { calculerFraisLivraison } from '../../store/useCartStore'
import useAuthStore from '../../store/useAuthStore'
import { formatPrix, formatPoids, JOURS_STANDARDS } from '../../lib/utils'
import { getImageUrl } from '../../lib/imageUrl'
import toast from 'react-hot-toast'

export default function PanierPage() {
  const { user } = useAuthStore()
  const { items, updateQuantite, removeItem, getItemsWithPrix, getSousTotal, getPoidsTotal } = useCartStore()
  const navigate = useNavigate()

  const itemsAvecPrix = getItemsWithPrix()
  const sousTotal = getSousTotal()
  const poidsTotal = getPoidsTotal()
  const fraisLivraison = calculerFraisLivraison(poidsTotal)
  const total = sousTotal + fraisLivraison

  const handleCommander = () => {
    if (!user) {
      toast.error('Connectez-vous pour passer une commande')
      navigate('/connexion')
      return
    }
    if (sousTotal < 500) {
      toast.error('Le montant minimum de commande est de 500 FCFA')
      return
    }
    navigate('/commande')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="text-gray-400" size={32} />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Votre panier est vide</h2>
        <p className="text-gray-500 font-body mb-6">Parcourez notre catalogue pour trouver vos produits</p>
        <Link to="/catalogue" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-6 py-3 rounded-xl transition-colors">
          Voir le catalogue <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Mon panier</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articles */}
        <div className="lg:col-span-2 space-y-3">
          {itemsAvecPrix.map(item => (
            <div key={item.id} className="card p-4 flex items-start gap-4">
              {/* Image */}
              <img
                src={getImageUrl(item.produit.image_url)}
                alt={item.produit.nom}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                onError={e => { e.target.src = 'https://placehold.co/80x80/E8F5E9/2E7D32?text=AP' }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 text-sm leading-snug">{item.produit.nom}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 font-body capitalize">{item.type}</span>
                      {item.estPrixGros && (
                        <span className="badge-gros text-xs">Prix gros</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {/* Quantité */}
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantite(item.id, item.quantite - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-display font-semibold text-gray-900">{item.quantite}</span>
                    <button
                      onClick={() => updateQuantite(item.id, item.quantite + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Prix */}
                  <div className="text-right">
                    <p className="font-display font-bold text-primary-600">{formatPrix(item.sousTotal)}</p>
                    {item.description && (
                      <p className="text-xs text-green-600 font-body mt-0.5">{item.description}</p>
                    )}
                    {!item.description && (
                      <p className="text-xs text-gray-400 font-body">{formatPrix(item.prixUnitaire)} / u.</p>
                    )}
                  </div>
                </div>

                {/* Badge palier gros */}
                {item.estPrixGros && item.nbPaliersGros > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="text-xs text-green-700 font-body">
                      {item.nbPaliersGros > 1
                        ? `${item.nbPaliersGros} paliers gros appliqués`
                        : 'Prix gros appliqué'}
                      {item.nbRestants > 0 && ` + ${item.nbRestants} au prix unitaire`}
                    </span>
                  </div>
                )}
                {/* Suggestion si proche du palier */}
                {!item.estPrixGros && item.description && item.produit.seuil_gros > 0 && (
                  <p className="mt-1.5 text-xs text-orange-500 font-body">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Récapitulatif</h2>

            <div className="space-y-3 text-sm font-body">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-semibold text-gray-900">{formatPrix(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Poids total</span>
                <span className="font-semibold text-gray-900">{formatPoids(poidsTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frais de livraison</span>
                <span className="font-semibold text-gray-900">{formatPrix(fraisLivraison)}</span>
              </div>
              <p className="text-xs text-gray-400">Livraison : {JOURS_STANDARDS.join(', ')}</p>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-base font-display font-bold text-gray-900">
                <span>Total à payer</span>
                <span className="text-primary-600">{formatPrix(total)}</span>
              </div>
            </div>

            {sousTotal < 500 && sousTotal > 0 && (
              <p className="text-xs text-red-500 font-body mt-2">Minimum de commande : 500 FCFA</p>
            )}

            <button
              onClick={handleCommander}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-display font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Passer la commande <ArrowRight size={18} />
            </button>

            <p className="text-center text-xs text-gray-400 font-body mt-3">
              Paiement en espèces à la livraison
            </p>

            <Link to="/catalogue" className="block text-center text-sm text-primary-600 hover:underline font-body mt-3">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
