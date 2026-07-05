const annonces = new Set()

export function resetAnnonces() {
  annonces.clear()
}

export function parler(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

/**
 * Annonces de proximité pour le livreur.
 * @returns {'300m'|'arrivee'|null}
 */
export function annoncerProximite(clientNom, distanceM, key) {
  if (distanceM <= 80 && !annonces.has(`${key}-arrivee`)) {
    annonces.add(`${key}-arrivee`)
    parler(`Bienvenue à destination sur le lieu de livraison de ${clientNom}.`)
    return 'arrivee'
  }
  if (distanceM <= 300 && !annonces.has(`${key}-300`)) {
    annonces.add(`${key}-300`)
    parler(`Vous êtes à ${Math.round(distanceM)} mètres de chez ${clientNom}.`)
    return '300m'
  }
  return null
}

export function annoncerDemarrage(circuitNom) {
  parler(`Démarrage du circuit ${circuitNom}. Bonne livraison.`)
}

export function annoncerFinCircuit(circuitNom, nbLivraisons) {
  parler(`Circuit ${circuitNom} terminé avec succès. ${nbLivraisons} livraisons effectuées.`)
}
