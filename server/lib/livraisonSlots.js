const TOUS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function jourActuel(date = new Date()) {
  return TOUS_JOURS[(date.getDay() + 6) % 7]
}

function minutesActuelles(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes()
}

/** Créneau bloqué si livraison déjà commencée ou en cours ce jour-là */
function estCreneauBloque(jour, tranche, date = new Date()) {
  if (jour !== jourActuel(date)) return false
  const min = minutesActuelles(date)
  if (tranche === '8h-12h') return min >= 8 * 60
  if (tranche === '14h-18h') return min >= 14 * 60
  return false
}

function getCreneauxBloquesAujourdhui(date = new Date()) {
  const jour = jourActuel(date)
  const bloques = []
  if (estCreneauBloque(jour, '8h-12h', date)) bloques.push('8h-12h')
  if (estCreneauBloque(jour, '14h-18h', date)) bloques.push('14h-18h')
  return { jour, tranches: bloques }
}

function validerCreneauCommande(jour, tranche, date = new Date()) {
  if (estCreneauBloque(jour, tranche, date)) {
    const label = tranche === '8h-12h' ? '8h à 12h' : '14h à 18h'
    return {
      ok: false,
      message: `La livraison du ${jour} (${label}) a déjà commencé. Choisissez un autre créneau ou un autre jour.`,
    }
  }
  return { ok: true }
}

module.exports = {
  TOUS_JOURS,
  jourActuel,
  estCreneauBloque,
  getCreneauxBloquesAujourdhui,
  validerCreneauCommande,
}
