// Format prix FCFA
export function formatPrix(montant) {
  if (montant == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FCFA'
}

// Format poids
export function formatPoids(kg) {
  if (kg == null || kg === 0) return '—'
  return kg.toFixed(2) + ' kg'
}

/**
 * Frais de livraison :
 * - 800 FCFA pour 1 à 100 kg
 * - +800 FCFA par tranche supplémentaire de 100 kg (101-200, 201-300, …)
 */
export function calculerFraisLivraison(poidsKg, jourExceptionnel = false) {
  const poids = Math.max(Number(poidsKg) || 0, 0)
  const tranches = Math.max(1, Math.ceil(Math.max(poids, 1) / 100))
  let frais = 800 * tranches
  if (jourExceptionnel) frais *= 3
  return frais
}

// Couleurs par jour (carte + circuits)
export const COULEURS_JOURS = {
  Lundi: '#9C27B0', Mardi: '#2196F3', Mercredi: '#FF5722',
  Jeudi: '#4CAF50', Vendredi: '#FF9800', Samedi: '#E91E63', Dimanche: '#009688',
}

export function couleurJour(jour, fallback = '#2E7D32') {
  return COULEURS_JOURS[jour] || fallback
}

// Jours de livraison
export const JOURS_STANDARDS = ['Mardi', 'Jeudi', 'Samedi', 'Dimanche']
export const JOURS_EXCEPTIONNELS = ['Lundi', 'Mercredi', 'Vendredi']
export const TOUS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export function jourActuel() {
  return TOUS_JOURS[(new Date().getDay() + 6) % 7]
}

export function estJourExceptionnel(jour) {
  return JOURS_EXCEPTIONNELS.includes(jour)
}

/** Créneau indisponible : livraison déjà commencée aujourd'hui pour ce créneau */
export function estCreneauBloque(jour, tranche, date = new Date()) {
  if (jour !== jourActuel(date)) return false
  const min = date.getHours() * 60 + date.getMinutes()
  if (tranche === '8h-12h') return min >= 8 * 60
  if (tranche === '14h-18h') return min >= 14 * 60
  return false
}

export function getCreneauxBloquesAujourdhui(date = new Date()) {
  const jour = jourActuel(date)
  const tranches = []
  if (estCreneauBloque(jour, '8h-12h', date)) tranches.push('8h-12h')
  if (estCreneauBloque(jour, '14h-18h', date)) tranches.push('14h-18h')
  return { jour, tranches }
}

export function labelCreneau(tranche) {
  return tranche === '8h-12h' ? '8h à 12h' : '14h à 18h'
}

// Statuts commande
export const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMEE: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  EN_LIVRAISON: { label: 'En livraison', color: 'bg-orange-100 text-orange-800' },
  LIVREE: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  PROBLEME: { label: 'Problème', color: 'bg-red-100 text-red-800' },
}

// Générer code commande
export function genererCodeCommande() {
  const date = new Date()
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `AP-${yyyymmdd}-${rand}`
}

// Téléphone béninois : 10 chiffres (indicatif 2 chiffres + 8 chiffres)
// Opérateurs : 01, 61, 62, 90, 91, 95, 96, 97, 53, 54, 55, 64, 65, 66, 67, 68, 69, etc.
export const TELEPHONE_PREFIX = ''

export function formaterSuffixeTelephone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}

export function assemblerTelephone(suffix) {
  const s = formaterSuffixeTelephone(suffix)
  return s.length === 10 ? s : ''
}

export function validerTelephone(tel) {
  const clean = String(tel || '').replace(/[\s\-\.]/g, '')
  // 10 chiffres, commence par 0 suivi d'un chiffre valide
  return /^0[1-9][0-9]{8}$/.test(clean)
}

export function validerSuffixeTelephone(suffix) {
  return validerTelephone(suffix)
}

// Truncate text
export function truncate(str, n) {
  return str?.length > n ? str.slice(0, n - 1) + '…' : str
}
