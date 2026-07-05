/** Distance en mètres entre deux points GPS */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

/**
 * Itinéraire routier via OSRM (OpenStreetMap).
 * @param {Array<{ lat: number, lng: number }>} waypoints
 * @returns {Promise<[number, number][]>} coordonnées [lat, lng]
 */
export async function fetchRoadRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return waypoints?.map(p => [p.lat, p.lng]) || []

  const coords = waypoints.map(p => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`

  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
      return waypoints.map(p => [p.lat, p.lng])
    }
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
  } catch {
    return waypoints.map(p => [p.lat, p.lng])
  }
}
