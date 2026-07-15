import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePromoFlashCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (produit) => {
        const exists = get().items.find(i => i.produit.id === produit.id)
        if (exists) {
          // Incrémenter la quantité si déjà présent
          set({ items: get().items.map(i => i.produit.id === produit.id ? { ...i, quantite: (i.quantite || 1) + 1 } : i) })
          return true
        }
        set({ items: [...get().items, { produit, prix: produit.prixDuJour || produit.prix_actuel || 0, quantite: 1 }] })
        return true
      },

      removeItem: (id) => set({ items: get().items.filter(i => i.produit.id !== id) }),

      clearCart: () => set({ items: [] }),

      getTotal: () => get().items.reduce((s, i) => s + ((i.prix || 0) * (i.quantite || 1)), 0),

      getItemCount: () => get().items.reduce((s, i) => s + (i.quantite || 1), 0),
    }),
    { name: 'promoflash-panier' }
  )
)

export default usePromoFlashCartStore
