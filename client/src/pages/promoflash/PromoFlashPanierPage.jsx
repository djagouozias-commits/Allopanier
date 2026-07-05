import React from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Zap } from 'lucide-react'
import usePromoFlashCartStore from '../../store/usePromoFlashCartStore'
import { formatPrix } from '../../lib/utils'

export default function PromoFlashPanierPage() {
  const { items, removeItem, getTotal, clearCart } = usePromoFlashCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Zap size={48} className="mx-auto text-purple-300 mb-4" />
        <p className="text-gray-500 font-body mb-4">Panier PromoFLASH vide</p>
        <Link to="/promoflash" className="text-purple-600 font-semibold hover:underline">Voir les promos</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-2xl text-purple-900 mb-6">Panier PromoFLASH</h1>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-800 font-body">
        ⚡ Pas de réservation — validez et déplacez-vous vite, un autre client peut passer avant vous.
      </div>

      <div className="space-y-3 mb-6">
        {items.map(i => (
          <div key={i.produit.id} className="card p-4 flex justify-between items-center">
            <div>
              <p className="font-display font-semibold text-gray-900">{i.produit.nom}</p>
              <p className="text-sm text-purple-600">{i.produit.nom_boutique}</p>
              <p className="font-bold text-purple-700 mt-1">{formatPrix(i.prix)}</p>
            </div>
            <button onClick={() => removeItem(i.produit.id)} className="text-gray-400 hover:text-red-500 p-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex justify-between font-display font-bold text-lg mb-4">
          <span>Total</span>
          <span className="text-purple-700">{formatPrix(getTotal())}</span>
        </div>
        <div className="flex gap-3">
          <Link to="/promoflash" className="flex-1 text-center border border-gray-300 py-3 rounded-xl font-display font-semibold text-gray-700">
            Continuer les achats
          </Link>
          <Link to="/promoflash/commande" className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-display font-bold">
            Valider
          </Link>
        </div>
        <button onClick={clearCart} className="w-full mt-3 text-sm text-gray-400 hover:text-red-500">Vider le panier</button>
      </div>
    </div>
  )
}
