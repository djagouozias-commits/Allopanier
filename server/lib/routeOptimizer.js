/** Distance en mètres entre deux points GPS (formule haversine) */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Plus proche voisin : départ → arrêts les plus proches → retour départ.
 * @param {{ lat: number, lng: number }} depot
 * @param {Array<{ id, lat, lng, [key: string]: any }>} stops
 */
function optimizeRouteNearestNeighbor(depot, stops) {
  const remaining = stops.filter(s => s.lat != null && s.lng != null)
  const ordered = []
  let current = { lat: parseFloat(depot.lat), lng: parseFloat(depot.lng) }

  while (remaining.length > 0) {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineMeters(current.lat, current.lng, remaining[i].lat, remaining[i].lng)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    const next = remaining.splice(bestIdx, 1)[0]
    ordered.push(next)
    current = { lat: parseFloat(next.lat), lng: parseFloat(next.lng) }
  }

  return ordered
}

module.exports = { haversineMeters, optimizeRouteNearestNeighbor }
