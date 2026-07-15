import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculerFraisLivraison } from './useCartStore'

const useVIPCartStore = create(
  persist(
    (set, get) => ({
      items: [], // { id, produit, type, quantite }

      addItem: (produit, type = 'unite', quantite = 1) => {
        const key = `vip-${produit.id}-${type}`
        const existing = get().items.find(i => i.id === key)
        if (existing) {
          set({ items: get().items.map(i => i.id === key ? { ...i, quantite: i.quantite + quantite } : i) })
        } else {
          set({ items: [...get().items, { id: key, produit, type, quantite }] })
        }
      },

      updateQuantite: (itemId, quantite) => {
        if (quantite <= 0) { get().removeItem(itemId); return }
        set({ items: get().items.map(i => i.id === itemId ? { ...i, quantite } : i) })
      },

      removeItem: (itemId) => set({ items: get().items.filter(i => i.id !== itemId) }),

      clearCart: () => set({ items: [] }),

      getItemCount: () => get().items.reduce((s, i) => s + i.quantite, 0),

      getSousTotal: () => get().items.reduce((s, item) => {
        const prix = Number(item.produit.prix_unitaire) || 0
        return s + prix * item.quantite
      }, 0),

      getPoidsTotal: () => get().items.reduce((s, item) => {
        return s + (Number(item.produit.poids_unitaire_kg) || 0) * item.quantite
      }, 0),

      getItemsAvecPrix: () => get().items.map(item => ({
        ...item,
        prixUnitaire: Number(item.produit.prix_unitaire),
        sousTotal: Number(item.produit.prix_unitaire) * item.quantite,
        poids: (Number(item.produit.poids_unitaire_kg) || 0) * item.quantite,
      })),
    }),
    { name: 'allopanier-vip-cart' }
  )
)

export default useVIPCartStore
