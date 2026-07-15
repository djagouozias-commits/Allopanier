import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  X, MapPin, Navigation, Volume2, VolumeX, StopCircle,
  ShoppingBag, CheckCircle, ChevronRight, Loader, AlertTriangle,
  Play, Ban
} from 'lucide-react'
import L from '../../lib/leafletInit'
import { fetchRoadRoute, haversineMeters, formatDistance } from '../../lib/routeUtils'
import { parler, resetAnnonces } from '../../lib/driverVoice'

/**
 * Trier les étapes du plus proche au plus loin depuis la position de départ
 */
function trierEtapesParProximite(etapes, depart) {
  if (!depart || etapes.length === 0) return etapes
  return [...etapes].sort((a, b) => {
    const da = haversineMeters(depart.lat, depart.lng, a.lat, a.lng)
    const db = haversineMeters(depart.lat, depart.lng, b.lat, b.lng)
    return da - db
  })
}

/**
 * PromoFlashGPS — GPS plein écran multi-magasins PromoFlash
 *
 * Props:
 *   items          : [{ produit, prix }]
 *   positionDepart : { lat, lng } | null  — position personnalisée ou null = GPS automatique
 *   onClose(etapesTerminees, etapes) : callback à la fermeture avec le résumé des étapes faites
 */
export default function PromoFlashGPS({ items, positionDepart, onClose }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markersRef = useRef([])
  const routeLayersRef = useRef([])
  const positionMarkerRef = useRef(null)
  const departMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const hasAnnouncedRef = useRef({})
  const positionDepartRef = useRef(positionDepart || null)

  const [positionActuelle, setPositionActuelle] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(true)
  const [gpsErreur, setGpsErreur] = useState(false)
  const [voixActive, setVoixActive] = useState(true)
  const [etapeActuelle, setEtapeActuelle] = useState(0)
  const [etapesTerminees, setEtapesTerminees] = useState([])
  const [distanceEtape, setDistanceEtape] = useState(null)
  const [routeTracee, setRouteTracee] = useState(false)
  const [termine, setTermine] = useState(false)
  const [modalArret, setModalArret] = useState(false) // modal Reprendre / Annuler
  const [etapesTried, setEtapesTried] = useState(false)

  // Construire les étapes brutes (regroupées par vendeur)
  const etapesBrutes = React.useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const vid = item.produit.vendeur_id || item.produit.id
      if (!map.has(vid)) {
        map.set(vid, {
          vendeurId: vid,
          vendeurNom: item.produit.vendeur_nom || 'Boutique',
          lat: parseFloat(item.produit.vendeur_lat) || null,
          lng: parseFloat(item.produit.vendeur_lng) || null,
          articles: [],
        })
      }
      map.get(vid).articles.push(item)
    }
    return Array.from(map.values()).filter(e => e.lat && e.lng)
  }, [items])

  // Étapes triées (du plus proche au plus loin depuis le départ)
  const [etapes, setEtapes] = useState([])

  // Trier les étapes une fois qu'on a la position de départ
  useEffect(() => {
    if (etapesTried || etapesBrutes.length === 0) return
    const depart = positionDepartRef.current
    if (depart) {
      setEtapes(trierEtapesParProximite(etapesBrutes, depart))
      setEtapesTried(true)
    }
  }, [etapesBrutes, etapesTried])

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return
    const map = L.map(mapRef.current, {
      center: [6.3703, 2.3912], zoom: 13, zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    leafletMapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
    return () => { map.remove(); leafletMapRef.current = null }
  }, [])

  // Marqueur du point de départ fixe
  useEffect(() => {
    if (!leafletMapRef.current || !positionDepartRef.current) return
    const map = leafletMapRef.current
    if (departMarkerRef.current) map.removeLayer(departMarkerRef.current)
    const html = `<div style="width:22px;height:22px;background:#1d4ed8;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(29,78,216,0.3);display:flex;align-items:center;justify-content:center;font-size:10px;">🏠</div>`
    const icon = L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] })
    departMarkerRef.current = L.marker([positionDepartRef.current.lat, positionDepartRef.current.lng], { icon })
      .addTo(map)
      .bindPopup('<b>Votre point de départ</b>')
  }, [etapes])

  // Marqueurs des magasins
  useEffect(() => {
    if (!leafletMapRef.current || etapes.length === 0) return
    const map = leafletMapRef.current
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    etapes.forEach((etape, i) => {
      const isTerminee = etapesTerminees.includes(i)
      const isActive = i === etapeActuelle
      const couleur = isTerminee ? '#22c55e' : isActive ? '#9333ea' : '#6b7280'
      const size = isActive ? 36 : 28
      const html = `<div style="background:${couleur};color:white;width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${isActive ? 15 : 12}px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${isTerminee ? '✓' : i + 1}</div>`
      const icon = L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
      const marker = L.marker([etape.lat, etape.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${etape.vendeurNom}</b><br/>${etape.articles.map(a => `• ${a.produit.nom}`).join('<br/>')}`)
      markersRef.current.push(marker)
    })
  }, [etapes, etapeActuelle, etapesTerminees])

  // Tracer l'itinéraire
  const tracerItineraire = useCallback(async (depart) => {
    if (!leafletMapRef.current || etapes.length === 0) return
    const map = leafletMapRef.current
    routeLayersRef.current.forEach(l => map.removeLayer(l))
    routeLayersRef.current = []
    const waypoints = [depart, ...etapes.map(e => ({ lat: e.lat, lng: e.lng })), depart]
    for (let i = 0; i < waypoints.length - 1; i++) {
      const isSegmentFait = i < etapesTerminees.length
      const isSegmentActif = i === etapeActuelle
      const coords = await fetchRoadRoute([waypoints[i], waypoints[i + 1]])
      const layer = L.polyline(coords, {
        color: isSegmentFait ? '#22c55e' : isSegmentActif ? '#9333ea' : '#9ca3af',
        weight: isSegmentActif ? 6 : 4,
        opacity: isSegmentFait ? 0.5 : 0.9,
        dashArray: isSegmentFait ? '8 6' : null,
      }).addTo(map)
      routeLayersRef.current.push(layer)
    }
    const allPoints = waypoints.map(p => [p.lat, p.lng])
    if (allPoints.length > 1) map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] })
    setRouteTracee(true)
  }, [etapes, etapeActuelle, etapesTerminees])

  // GPS continu
  useEffect(() => {
    if (!navigator.geolocation) { setGpsErreur(true); setGpsLoading(false); return }
    resetAnnonces()
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const newPos = { lat, lng }
        setPositionActuelle(newPos)
        setGpsLoading(false)

        // Définir position de départ au premier fix GPS si pas déjà définie
        if (!positionDepartRef.current) {
          positionDepartRef.current = newPos
          setEtapes(trierEtapesParProximite(etapesBrutes, newPos))
          setEtapesTried(true)
        }

        if (leafletMapRef.current) {
          const map = leafletMapRef.current
          if (positionMarkerRef.current) map.removeLayer(positionMarkerRef.current)
          const html = `<div style="width:18px;height:18px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`
          const icon = L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 9] })
          positionMarkerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map)
        }

        if (etapes[etapeActuelle]) {
          const etape = etapes[etapeActuelle]
          const dist = haversineMeters(lat, lng, etape.lat, etape.lng)
          setDistanceEtape(dist)
          if (voixActive) {
            const key = `etape-${etapeActuelle}`
            if (dist <= 80 && !hasAnnouncedRef.current[`${key}-arrivee`]) {
              hasAnnouncedRef.current[`${key}-arrivee`] = true
              parler(`Vous êtes arrivé chez ${etape.vendeurNom}. Récupérez vos articles.`)
            } else if (dist <= 300 && !hasAnnouncedRef.current[`${key}-300`]) {
              hasAnnouncedRef.current[`${key}-300`] = true
              parler(`Dans ${Math.round(dist)} mètres, ${etape.vendeurNom}.`)
            } else if (dist <= 1000 && !hasAnnouncedRef.current[`${key}-1km`]) {
              hasAnnouncedRef.current[`${key}-1km`] = true
              parler(`À environ ${Math.round(dist / 100) * 100} mètres de ${etape.vendeurNom}.`)
            }
          }
        }
      },
      () => { setGpsErreur(true); setGpsLoading(false) },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    )
    watchIdRef.current = id
    return () => {
      navigator.geolocation.clearWatch(id)
      if (window.speechSynthesis) window.speechSynthesis.cancel()
    }
  }, [etapes, etapeActuelle, voixActive, etapesBrutes])

  // Tracer quand position disponible
  useEffect(() => {
    const depart = positionDepartRef.current
    if (depart && !routeTracee && etapes.length > 0) {
      tracerItineraire(depart)
    }
  }, [positionActuelle, routeTracee, etapes, tracerItineraire])

  // Retrace quand étape change
  useEffect(() => {
    if (positionDepartRef.current && routeTracee) setRouteTracee(false)
  }, [etapeActuelle, etapesTerminees])

  const etapeMarqueeArrivee = () => {
    if (etapeActuelle >= etapes.length) return
    const nouvellesTerminees = [...etapesTerminees, etapeActuelle]
    setEtapesTerminees(nouvellesTerminees)
    if (voixActive) parler(`Étape ${etapeActuelle + 1} terminée. ${etapeActuelle + 1 < etapes.length ? 'En route vers ' + etapes[etapeActuelle + 1].vendeurNom : 'Retour au point de départ.'}`)
    if (etapeActuelle + 1 >= etapes.length) {
      setEtapeActuelle(etapes.length)
      if (voixActive) setTimeout(() => parler('Toutes les boutiques visitées ! Retournez à votre point de départ.'), 1500)
    } else {
      setEtapeActuelle(etapeActuelle + 1)
    }
  }

  // Bouton Arrêter → ouvre modal
  const handleArreter = () => setModalArret(true)

  // Reprendre le trajet
  const handleReprendre = () => setModalArret(false)

  // Annuler définitivement — ferme avec ce qui a été fait
  const handleAnnuler = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setModalArret(false)
    onClose(etapesTerminees, etapes)
  }

  // Terminer (toutes étapes finies)
  const terminer = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    if (voixActive) parler('Trajet PromoFlash terminé. Bonne journée !')
    setTermine(true)
    setTimeout(() => onClose(etapesTerminees, etapes), 1200)
  }

  const recentrerSurMoi = () => {
    if (positionActuelle && leafletMapRef.current) leafletMapRef.current.setView([positionActuelle.lat, positionActuelle.lng], 16)
  }

  const etapeCourante = etapes[etapeActuelle]
  const toutesTerminees = etapeActuelle >= etapes.length

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* Barre supérieure */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-700 text-white flex-shrink-0 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation size={18} className="flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate">
              {termine ? 'Trajet terminé !' : toutesTerminees ? 'Retour au départ' : `Étape ${etapeActuelle + 1} / ${etapes.length} — ${etapeCourante?.vendeurNom || '...'}`}
            </p>
            <p className="text-purple-200 text-xs font-body">
              {etapesTerminees.length} / {etapes.length} boutique{etapes.length > 1 ? 's' : ''} visitée{etapesTerminees.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setVoixActive(v => !v)}
            className={`p-2 rounded-lg transition-colors ${voixActive ? 'bg-purple-600' : 'bg-purple-800 text-purple-400'}`}>
            {voixActive ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button onClick={handleArreter}
            className="p-2 rounded-lg bg-purple-800 hover:bg-red-600 text-white transition-colors"
            title="Quitter le GPS">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Bandeau distance */}
      {!gpsLoading && !toutesTerminees && distanceEtape !== null && (
        <div className={`px-4 py-2 flex items-center gap-3 flex-shrink-0 ${distanceEtape <= 80 ? 'bg-green-600 text-white' : distanceEtape <= 300 ? 'bg-amber-500 text-white' : 'bg-purple-50 text-purple-800'}`}>
          <MapPin size={16} className="flex-shrink-0" />
          <p className="text-sm font-display font-semibold">
            {distanceEtape <= 80 ? `Vous êtes arrivé chez ${etapeCourante?.vendeurNom} !` : `${formatDistance(distanceEtape)} de ${etapeCourante?.vendeurNom}`}
          </p>
        </div>
      )}

      {gpsLoading && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
          <Loader size={14} className="text-blue-600 animate-spin" />
          <p className="text-sm text-blue-700 font-body">Localisation en cours...</p>
        </div>
      )}
      {gpsErreur && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 flex-shrink-0">
          <AlertTriangle size={14} className="text-red-600" />
          <p className="text-sm text-red-700 font-body">GPS indisponible. Vérifiez la localisation.</p>
        </div>
      )}

      {/* Carte */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Panneau bas */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3 max-h-[40vh] overflow-y-auto">
        <div className="space-y-1.5">
          {/* Point de départ */}
          <div className="flex items-center gap-3 rounded-xl px-3 py-2 border bg-blue-50 border-blue-200">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs flex-shrink-0">🏠</div>
            <p className="font-display font-semibold text-sm text-blue-700">Votre position de départ</p>
          </div>

          {etapes.map((etape, i) => {
            const terminee = etapesTerminees.includes(i)
            const active = i === etapeActuelle
            return (
              <div key={etape.vendeurId}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border transition-colors ${terminee ? 'bg-green-50 border-green-200' : active ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-display font-bold text-xs ${terminee ? 'bg-green-500 text-white' : active ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {terminee ? <CheckCircle size={14} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-display font-semibold text-sm ${active ? 'text-purple-700' : terminee ? 'text-green-700' : 'text-gray-500'}`}>
                    {etape.vendeurNom}
                  </p>
                  <div className="text-xs text-gray-500 font-body flex flex-wrap gap-x-2">
                    {etape.articles.map(a => <span key={a.produit.id}>• {a.produit.nom}</span>)}
                  </div>
                  {active && distanceEtape !== null && (
                    <p className="text-xs text-purple-600 font-display font-semibold mt-0.5">{formatDistance(distanceEtape)}</p>
                  )}
                </div>
                {active && !terminee && <ChevronRight size={16} className="text-purple-400 flex-shrink-0 mt-1" />}
              </div>
            )
          })}

          {/* Retour au départ */}
          <div className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${toutesTerminees ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 opacity-40'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${toutesTerminees ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}>🏠</div>
            <p className={`font-display font-semibold text-sm ${toutesTerminees ? 'text-blue-700' : 'text-gray-400'}`}>Retour au point de départ</p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pb-1">
          <button onClick={recentrerSurMoi}
            className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-semibold text-sm px-3 py-3 rounded-xl transition-colors flex-shrink-0">
            <Navigation size={15} className="text-blue-600" />
            <span className="hidden sm:inline">Ma position</span>
          </button>

          {!toutesTerminees && (
            <button onClick={etapeMarqueeArrivee}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-display font-bold text-sm py-3 rounded-xl transition-colors">
              <ShoppingBag size={15} />
              Arrivé chez {etapeCourante?.vendeurNom?.split(' ')[0] || '...'}
            </button>
          )}

          {toutesTerminees ? (
            <button onClick={terminer}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-display font-bold text-sm py-3 rounded-xl transition-colors">
              <CheckCircle size={15} />
              Terminer !
            </button>
          ) : (
            <button onClick={handleArreter}
              className="flex items-center justify-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-display font-bold text-sm px-4 py-3 rounded-xl transition-colors flex-shrink-0">
              <StopCircle size={15} />
              Arrêter
            </button>
          )}
        </div>
      </div>

      {/* Modal Arrêt — Reprendre ou Annuler */}
      {modalArret && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-600 text-white px-5 py-4">
              <p className="font-display font-bold text-lg">Trajet interrompu</p>
              <p className="text-red-200 text-sm font-body mt-0.5">
                {etapesTerminees.length > 0
                  ? `${etapesTerminees.length} boutique${etapesTerminees.length > 1 ? 's' : ''} visitée${etapesTerminees.length > 1 ? 's' : ''} sur ${etapes.length}`
                  : 'Aucune boutique visitée pour le moment'}
              </p>
            </div>
            <div className="p-5 space-y-3">
              {/* Résumé ce qui est fait */}
              {etapesTerminees.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-display font-semibold text-green-700 mb-1">Articles récupérés</p>
                  {etapesTerminees.map(i => (
                    <p key={i} className="text-xs text-green-700 font-body">✓ {etapes[i]?.vendeurNom} — {etapes[i]?.articles.map(a => a.produit.nom).join(', ')}</p>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 font-body text-center">Que souhaitez-vous faire ?</p>
              <button onClick={handleReprendre}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-display font-bold py-3.5 rounded-xl transition-colors">
                <Play size={16} />
                Reprendre le trajet
              </button>
              <button onClick={handleAnnuler}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-semibold py-3.5 rounded-xl transition-colors">
                <Ban size={16} />
                {etapesTerminees.length > 0 ? 'Arrêter — enregistrer ce qui est fait' : 'Annuler le trajet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
