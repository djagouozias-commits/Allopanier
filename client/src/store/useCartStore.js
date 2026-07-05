import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculerFraisLivraison } from '../lib/utils'

export { calculerFraisLivraison }

/**
 * Calcul du prix par PALIERS pour les unités.
 *
 * Exemple : seuil_gros=10, prix_gros=900, prix_unitaire=100
 *   - 7 unités  → 7 × 100 = 700 FCFA (pas de palier complet)
 *   - 10 unités → 1 palier × 900 = 900 FCFA
 *   - 13 unités → 1 palier × 900 + 3 × 100 = 1200 FCFA
 *   - 23 unités → 2 paliers × 900 + 3 × 100 = 2100 FCFA
 *
 * Retourne : { sousTotal, prixUnitaireAffiche, nbPaliersGros, nbRestants, estPrixGros }
 */
export function calculerPrixPalier(qte, prixUnitaire, prixGros, seuilGros) {
  prixUnitaire = Number(prixUnitaire) || 0
  prixGros = Number(prixGros) || 0
  seuilGros = Number(seuilGros) || 0

  // Pas de prix gros configuré
  if (!prixGros || !seuilGros) {
    return {
      sousTotal: prixUnitaire * qte,
      prixUnitaireAffiche: prixUnitaire,
      nbPaliersGros: 0,
      nbRestants: qte,
      estPrixGros: false,
      description: null,
    }
  }

  const nbPaliers = Math.floor(qte / seuilGros)
  const nbRestants = qte % seuilGros

  if (nbPaliers === 0) {
    // Pas encore de palier complet → tout au prix unitaire
    return {
      sousTotal: prixUnitaire * qte,
      prixUnitaireAffiche: prixUnitaire,
      nbPaliersGros: 0,
      nbRestants: qte,
      estPrixGros: false,
      description: `${seuilGros - qte} de plus pour atteindre le prix gros`,
    }
  }

  const totalGros = nbPaliers * seuilGros * prixGros / seuilGros * seuilGros
  // Simplifié : nbPaliers paliers × (seuilGros unités × prixGros)
  const coutGros = nbPaliers * seuilGros * prixGros
  const coutRestants = nbRestants * prixUnitaire
  const sousTotal = coutGros + coutRestants

  let description = null
  if (nbPaliers > 0 && nbRestants > 0) {
    description = `${nbPaliers * seuilGros} au prix gros + ${nbRestants} au prix unitaire`
  } else if (nbPaliers > 0) {
    description = `${nbPaliers} × ${seuilGros} au prix gros`
  }

  return {
    sousTotal,
    prixUnitaireAffiche: prixGros, // prix affiché = prix gros (le plus avantageux)
    nbPaliersGros: nbPaliers,
    nbRestants,
    estPrixGros: nbPaliers > 0,
    description,
  }
}

// Calcul prix d'une ligne du panier (avec logique paliers)
function calculerPrixLigne(item) {
  const { produit, type, quantite: qte } = item

  // Conditionnements fixes : prix fixe × quantité
  if (type === 'carton') return {
    prixUnitaire: Number(produit.prix_carton) || 0,
    sousTotal: (Number(produit.prix_carton) || 0) * qte,
    estPrixGros: false, nbPaliersGros: 0, nbRestants: qte, description: null
  }
  if (type === 'sac') return {
    prixUnitaire: Number(produit.prix_sac) || 0,
    sousTotal: (Number(produit.prix_sac) || 0) * qte,
    estPrixGros: false, nbPaliersGros: 0, nbRestants: qte, description: null
  }
  if (type === 'boite') return {
    prixUnitaire: Number(produit.prix_boite) || 0,
    sousTotal: (Number(produit.prix_boite) || 0) * qte,
    estPrixGros: false, nbPaliersGros: 0, nbRestants: qte, description: null
  }
  if (type === 'sachet') return {
    prixUnitaire: Number(produit.prix_sachet) || 0,
    sousTotal: (Number(produit.prix_sachet) || 0) * qte,
    estPrixGros: false, nbPaliersGros: 0, nbRestants: qte, description: null
  }

  // Type 'unite' ou 'gros' → calcul par paliers
  const { sousTotal, prixUnitaireAffiche, nbPaliersGros, nbRestants, estPrixGros, description } =
    calculerPrixPalier(qte, produit.prix_unitaire, produit.prix_gros, produit.seuil_gros)

  return {
    prixUnitaire: prixUnitaireAffiche,
    sousTotal,
    estPrixGros,
    nbPaliersGros,
    nbRestants,
    description,
  }
}

function calculerPoidsLigne(item) {
  const { produit, type, quantite } = item
  let poidsUnit = Number(produit.poids_unitaire_kg) || 0
  if (type === 'carton') poidsUnit = Number(produit.poids_carton_kg) || 0
  else if (type === 'sac') poidsUnit = Number(produit.poids_sac_kg) || 0
  else if (type === 'boite') poidsUnit = Number(produit.poids_boite_kg) || 0
  else if (type === 'sachet') poidsUnit = Number(produit.poids_sachet_kg) || 0
  return poidsUnit * quantite
}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (produit, type = 'unite', quantiteAjout = 1) => {
        set((state) => {
          const key = `${produit.id}-${type}`
          const existing = state.items.find(i => i.id === key)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === key ? { ...i, quantite: i.quantite + quantiteAjout } : i
              )
            }
          }
          return {
            items: [...state.items, { id: key, produit, type, quantite: quantiteAjout }]
          }
        })
      },

      updateQuantite: (itemId, quantite) => {
        if (quantite <= 0) { get().removeItem(itemId); return }
        set((state) => ({
          items: state.items.map(i => i.id === itemId ? { ...i, quantite } : i)
        }))
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter(i => i.id !== itemId) }))
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => get().items.reduce((acc, i) => acc + i.quantite, 0),

      getSousTotal: () => get().items.reduce((acc, item) => {
        const { sousTotal } = calculerPrixLigne(item)
        return acc + sousTotal
      }, 0),

      getPoidsTotal: () => get().items.reduce((acc, item) => acc + calculerPoidsLigne(item), 0),

      getItemsWithPrix: () => get().items.map(item => ({
        ...item,
        ...calculerPrixLigne(item),
        poids: calculerPoidsLigne(item),
      })),

      rechargerCommande: (lignes) => {
        const items = lignes.map(l => ({
          id: `${l.produit_id}-${l.type_achat}`,
          produit: l.produit,
          type: l.type_achat,
          quantite: l.quantite,
        }))
        set({ items })
      },
    }),
    { name: 'allopanier-cart' }
  )
)

export default useCartStore
