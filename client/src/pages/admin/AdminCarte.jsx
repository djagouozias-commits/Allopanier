import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import L from '../../lib/leafletInit'
import api from '../../lib/api'
import { STATUTS, formatPrix, COULEURS_JOURS, couleurJour } from '../../lib/utils'
import { haversineMeters, formatDistance, fetchRoadRoute } from '../../lib/routeUtils'
import { annoncerProximite, annoncerDemarrage, annoncerFinCircuit, resetAnnonces, parler } from '../../lib/driverVoice'
import { PageLoader } from '../../components/ui/Spinner'
import { MapPin, AlertTriangle, RefreshCw, Play, CheckCircle, Truck, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCarte() {
  const location = useLocation()
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const stopCourantRef = useRef(0)

  const [commandes, setCommandes] = useState([])
  const [circuits, setCircuits] = useState([])
  const [circuitId, setCircuitId] = useState(location.state?.circuitId ? String(location.state.circuitId) : '')
  const [circuitDetail, setCircuitDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)
  const [filtres, setFiltres] = useState({ jour: '', statut: '' })
  const [sansGPS, setSansGPS] = useState([])
  const [modeLivreur, setModeLivreur] = useState(false)
  const [positionLivreur, setPositionLivreur] = useState(null)
  const [stopCourant, setStopCourant] = useState(0)

  const chargerCommandes = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtres.statut) params.append('statut', filtres.statut)
    if (filtres.jour) params.append('jour', filtres.jour)
    api.get(`/admin/commandes/carte?${params}`)
      .then(r => {
        const all = r.data.commandes || []
        setCommandes(all.filter(c => c.latitude && c.longitude))
        setSansGPS(all.filter(c => !c.latitude || !c.longitude))
      })
      .catch(() => { setCommandes([]); setSansGPS([]) })
      .finally(() => setLoading(false))
  }, [filtres])

  const chargerCircuits = () => {
    api.get('/admin/circuits').then(r => setCircuits(r.data.circuits || [])).catch(() => {})
  }

  const chargerCircuitDetail = useCallback(async (id) => {
    if (!id) { setCircuitDetail(null); return }
    setRouteLoading(true)
    try {
      const r = await api.get(`/admin/circuits/${id}/detail`)
      setCircuitDetail(r.data)
      if (r.data.circuit?.statut_livraison === 'EN_COURS') setModeLivreur(true)
    } catch {
      toast.error('Circuit introuvable')
      setCircuitDetail(null)
    } finally {
      setRouteLoading(false)
    }
  }, [])

  useEffect(chargerCommandes, [chargerCommandes])
  useEffect(chargerCircuits, [])
  useEffect(() => { chargerCircuitDetail(circuitId) }, [circuitId, chargerCircuitDetail])

  // Init carte
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return
    const map = L.map(mapRef.current, { center: [6.3703, 2.3912], zoom: 12 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map)
    leafletMapRef.current = map
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => {
      clearTimeout(timer)
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      map.remove()
      leafletMapRef.current = null
    }
  }, [])

  // Tracer itinéraire circuit
  useEffect(() => {
    if (!leafletMapRef.current || !circuitDetail?.circuit?.route_geojson) return

    const drawRoute = async () => {
      const route = typeof circuitDetail.circuit.route_geojson === 'string'
        ? JSON.parse(circuitDetail.circuit.route_geojson)
        : circuitDetail.circuit.route_geojson

      const couleur = circuitDetail.circuit.couleur || couleurJour(circuitDetail.circuit.jour)
      const depot = route.depot
      const waypoints = route.waypoints || []

      const points = [
        { lat: depot.lat, lng: depot.lng },
        ...waypoints.map(w => ({ lat: w.lat, lng: w.lng })),
        { lat: depot.lat, lng: depot.lng },
      ]

      setRouteLoading(true)
      const latlngs = await fetchRoadRoute(points)
      setRouteLoading(false)

      if (routeLayerRef.current) leafletMapRef.current.removeLayer(routeLayerRef.current)
      routeLayerRef.current = L.polyline(latlngs, {
        color: couleur, weight: 5, opacity: 0.85, dashArray: modeLivreur ? null : '8 6',
      }).addTo(leafletMapRef.current)

      if (latlngs.length > 1) {
        leafletMapRef.current.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] })
      }
    }

    drawRoute()
  }, [circuitDetail, modeLivreur])

  // Marqueurs commandes + circuit
  useEffect(() => {
    if (!leafletMapRef.current || loading) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const circuitCmds = circuitDetail?.commandes || []
    const afficher = circuitId && circuitCmds.length > 0 ? circuitCmds : commandes

    afficher.forEach(cmd => {
      const couleur = circuitDetail?.circuit
        ? (circuitDetail.circuit.couleur || couleurJour(circuitDetail.circuit.jour))
        : (COULEURS_JOURS[cmd.jour_livraison] || '#2E7D32')
      const ordre = cmd.ordre_dans_circuit
      const icon = L.divIcon({
        html: ordre
          ? `<div style="background:${couleur};color:white;width:26px;height:26px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">${ordre}</div>`
          : `<div style="background:${couleur};width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: ordre ? [26, 26] : [18, 18],
        iconAnchor: ordre ? [13, 13] : [9, 9],
        className: '',
      })
      const marker = L.marker([parseFloat(cmd.latitude), parseFloat(cmd.longitude)], { icon })
        .addTo(leafletMapRef.current)
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:220px;font-size:13px">
          ${ordre ? `<p style="margin:0 0 4px;font-weight:700;color:${couleur}">Étape ${ordre}</p>` : ''}
          <p style="font-weight:800;color:#2E7D32;margin:0 0 6px">${cmd.code_commande}</p>
          <p style="margin:0 0 3px;font-weight:600">${cmd.client_nom || '—'}</p>
          <p style="margin:0 0 3px;color:#666;font-size:12px">${cmd.client_telephone || ''}</p>
          <p style="margin:0 0 4px;color:#555;font-size:12px">${cmd.description_lieu || '—'}</p>
          <p style="margin:0;font-weight:700;color:#F57C00">${cmd.total ? parseInt(cmd.total).toLocaleString('fr-FR') + ' FCFA' : ''}</p>
        </div>
      `)
      markersRef.current.push(marker)
    })

    // Marqueur départ
    const depot = circuitDetail?.circuit?.depart_latitude
    if (depot && circuitDetail.circuit.depart_longitude) {
      const depIcon = L.divIcon({
        html: `<div style="background:#111;color:white;width:32px;height:32px;border-radius:8px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px">🏁</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16], className: '',
      })
      const depMarker = L.marker([
        parseFloat(circuitDetail.circuit.depart_latitude),
        parseFloat(circuitDetail.circuit.depart_longitude),
      ], { icon: depIcon, zIndexOffset: 1000 }).addTo(leafletMapRef.current)
      depMarker.bindPopup('<b>Point de départ / retour</b>')
      markersRef.current.push(depMarker)
    }

    if (markersRef.current.length > 0 && !circuitDetail?.circuit?.route_geojson) {
      const group = L.featureGroup(markersRef.current)
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.3))
    }
    setTimeout(() => leafletMapRef.current?.invalidateSize(), 100)
  }, [commandes, circuitDetail, circuitId, loading])

  useEffect(() => { stopCourantRef.current = stopCourant }, [stopCourant])

  // Mode livreur — suivi GPS + annonces
  useEffect(() => {
    if (!modeLivreur || !circuitDetail?.commandes?.length) return

    resetAnnonces()

    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setPositionLivreur({ lat, lng })

        if (leafletMapRef.current) {
          if (driverMarkerRef.current) leafletMapRef.current.removeLayer(driverMarkerRef.current)
          driverMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              html: `<div style="background:#1565C0;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(21,101,192,0.35)"></div>`,
              iconSize: [20, 20], iconAnchor: [10, 10], className: '',
            }),
            zIndexOffset: 2000,
          }).addTo(leafletMapRef.current)
        }

        const cmds = circuitDetail.commandes
        const idx = Math.min(stopCourantRef.current, cmds.length - 1)
        const cible = cmds[idx]
        if (!cible?.latitude) return

        const dist = haversineMeters(lat, lng, parseFloat(cible.latitude), parseFloat(cible.longitude))
        annoncerProximite(cible.client_nom || 'le client', dist, `stop-${cible.id}`)

        if (dist <= 80 && idx < cmds.length - 1) {
          stopCourantRef.current = idx + 1
          setStopCourant(idx + 1)
        }
      },
      () => toast.error('GPS indisponible — activez la localisation'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [modeLivreur, circuitDetail])

  const demarrerVehicule = async () => {
    if (!circuitId) { toast.error('Sélectionnez un circuit'); return }
    if (!circuitDetail?.circuit?.route_geojson) {
      toast.error('Calculez d\'abord l\'itinéraire dans Circuits')
      return
    }
    try {
      await api.post(`/admin/circuits/${circuitId}/demarrer`)
      annoncerDemarrage(circuitDetail.circuit.nom)
      setModeLivreur(true)
      setStopCourant(0)
      stopCourantRef.current = 0
      resetAnnonces()
      await chargerCircuitDetail(circuitId)
      chargerCommandes()
      toast.success('Véhicule démarré — suivez l\'itinéraire')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const terminerCircuit = async () => {
    if (!circuitId) return
    if (!window.confirm('Terminer ce circuit et marquer les livraisons comme effectuées ?')) return
    try {
      const r = await api.post(`/admin/circuits/${circuitId}/terminer`)
      annoncerFinCircuit(circuitDetail.circuit.nom, r.data.nb_livrees)
      setModeLivreur(false)
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
      await chargerCircuitDetail(circuitId)
      chargerCommandes()
      toast.success(r.data.message || 'Circuit terminé !')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    }
  }

  const cibleActuelle = circuitDetail?.commandes?.[stopCourant]
  const distanceCible = positionLivreur && cibleActuelle?.latitude
    ? haversineMeters(positionLivreur.lat, positionLivreur.lng, parseFloat(cibleActuelle.latitude), parseFloat(cibleActuelle.longitude))
    : null

  const circuitSelect = circuits.filter(c => c.route_geojson || c.jour)

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl text-gray-900">Carte GPS — Livraisons</h1>
        <button onClick={() => { chargerCommandes(); chargerCircuits() }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-body">
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Sélection circuit */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-display font-semibold text-gray-600 mb-1">Circuit de livraison</label>
            <select value={circuitId} onChange={e => setCircuitId(e.target.value)} className="input-field text-sm">
              <option value="">— Toutes les commandes —</option>
              {circuitSelect.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.jour} {c.tranche_horaire || ''}) — {c.nb_commandes || 0} cmd
                </option>
              ))}
            </select>
          </div>
          {circuitId && circuitDetail?.circuit && (
            <div className="flex flex-wrap gap-2">
              {!modeLivreur && circuitDetail.circuit.statut_livraison !== 'TERMINE' && (
                <button onClick={demarrerVehicule}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-4 py-2 rounded-lg text-sm">
                  <Play size={16} /> Démarrer le véhicule
                </button>
              )}
              {modeLivreur && (
                <button onClick={terminerCircuit}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-display font-semibold px-4 py-2 rounded-lg text-sm">
                  <CheckCircle size={16} /> Circuit terminé
                </button>
              )}
            </div>
          )}
        </div>

        {modeLivreur && cibleActuelle && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-3">
            <Truck className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-display font-bold text-orange-900">
                Prochaine livraison — Étape {stopCourant + 1} / {circuitDetail.commandes.length}
              </p>
              <p className="text-sm font-body text-orange-800">{cibleActuelle.client_nom} — {cibleActuelle.description_lieu}</p>
              {distanceCible != null && (
                <p className="text-xs font-body text-orange-600 mt-1 flex items-center gap-1">
                  <Navigation size={12} /> Distance : {formatDistance(distanceCible)}
                </p>
              )}
            </div>
            <button type="button" onClick={() => parler(`Direction ${cibleActuelle.client_nom}`)}
              className="text-xs text-orange-700 underline font-body">Répéter</button>
          </div>
        )}

        {circuitDetail?.circuit?.statut_livraison === 'TERMINE' && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 font-body flex items-center gap-2">
            <CheckCircle size={16} /> Circuit terminé avec succès
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filtres.statut} onChange={e => setFiltres(p => ({ ...p, statut: e.target.value }))}
          className="input-field text-sm max-w-xs" disabled={!!circuitId}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filtres.jour} onChange={e => setFiltres(p => ({ ...p, jour: e.target.value }))}
          className="input-field text-sm" disabled={!!circuitId}>
          <option value="">Tous les jours</option>
          {Object.keys(COULEURS_JOURS).map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        {!circuitId && (
          <span className="text-xs text-gray-400 font-body self-center">
            {commandes.length} commande(s) avec GPS
          </span>
        )}
      </div>

      {sansGPS.length > 0 && !circuitId && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-600 font-body">
            {sansGPS.length} commande(s) sans GPS : {sansGPS.map(c => c.code_commande).join(', ')}
          </p>
        </div>
      )}

      <div className="relative">
        {(loading || routeLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-xl">
            <PageLoader />
          </div>
        )}
        <div ref={mapRef} style={{
          width: '100%', height: 'calc(100vh - 420px)', minHeight: '350px',
          borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden',
        }} />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 font-body space-y-1">
        <p><strong>Mode circuit :</strong> créez un circuit (jour + heure + départ) dans Circuits, calculez l'itinéraire, puis démarrez le véhicule ici.</p>
        <p>Le chemin relie automatiquement les commandes les plus proches et revient au point de départ.</p>
        <p>En route, des annonces vocales indiquent la distance et l'arrivée chez chaque client.</p>
        <p><strong>Frais livraison :</strong> 800 FCFA jusqu'à 100 kg, puis +800 FCFA par tranche de 100 kg supplémentaire.</p>
      </div>
    </div>
  )
}
