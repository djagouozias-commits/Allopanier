import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const usePromoFlashCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (produit) => {
        const exists = get().items.find(i => i.produit.id === produit.id)
        if (exists) return false
        set({ items: [...get().items, { produit, prix: produit.prix_actuel }] })
        return true
      },

      removeItem: (id) => set({ items: get().items.filter(i => i.produit.id !== id) }),

      clearCart: () => set({ items: [] }),

      getTotal: () => get().items.reduce((s, i) => s + (i.prix || 0), 0),

      getItemCount: () => get().items.length,
    }),
    { name: 'promoflash-panier' }
  )
)

export default usePromoFlashCartStore
