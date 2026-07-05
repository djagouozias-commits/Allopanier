const MAX_JOURS_PROMO = 10

function joursEntre(dateA, dateB) {
  const a = new Date(dateA)
  const b = new Date(dateB)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

function validerDateExpiration(dateExpiration, dateRef = new Date()) {
  const jours = joursEntre(dateRef, dateExpiration)
  if (jours < 0) return { ok: false, message: 'La date d\'expiration est déjà passée' }
  if (jours > MAX_JOURS_PROMO) {
    return { ok: false, message: `PromoFLASH : expiration max dans ${MAX_JOURS_PROMO} jours (anti-gaspillage)` }
  }
  return { ok: true, joursRestants: jours }
}

/** Prix du jour : baisse linéaire du début à la fin jusqu'à la date d'expiration */
function calculerPrixPromo(produit, dateRef = new Date()) {
  const debut = parseFloat(produit.prix_promo_debut)
  const fin = parseFloat(produit.prix_promo_fin)
  const normal = parseFloat(produit.prix_normal)
  const exp = new Date(produit.date_expiration)
  const created = new Date(produit.created_at || dateRef)

  const joursTotal = Math.max(1, Math.min(MAX_JOURS_PROMO, joursEntre(created, exp)))
  const joursEcoules = Math.max(0, joursEntre(created, dateRef))
  const ratio = Math.min(1, joursEcoules / joursTotal)
  const prix = Math.round(debut - (debut - fin) * ratio)
  const prixFinal = Math.max(fin, prix)
  const pct = normal > 0 ? Math.round((1 - prixFinal / normal) * 100) : 0

  return {
    prix_actuel: prixFinal,
    pourcentage_reduction: pct,
    jours_restants: Math.max(0, joursEntre(dateRef, exp)),
    jours_total_promo: joursTotal,
  }
}

module.exports = {
  MAX_JOURS_PROMO,
  joursEntre,
  validerDateExpiration,
  calculerPrixPromo,
}
