import React, { useEffect, useRef, useState } from 'react'
import { X, MapPin, Check, Loader } from 'lucide-react'
import L from '../../lib/leafletInit'

/**
 * Carte GPS plein écran en modal.
 * Props :
 *   - isOpen : booléen
 *   - onClose() : fermer sans valider
 *   - onValidate({ lat, lng }) : valider la position
 *   - initialLat, initialLng : position initiale
 *   - title : titre de la modal
 */
export default function MapModal({ isOpen, onClose, onValidate, initialLat, initialLng, title = 'Choisir ma position' }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerRef = useRef(null)
  const [position, setPosition] = useState({ lat: initialLat || 6.3703, lng: initialLng || 2.3912 })
  const [gpsLoading, setGpsLoading] = useState(false)
  const [hasPosition, setHasPosition] = useState(!!(initialLat && initialLng))

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Initialiser la carte
  useEffect(() => {
    if (!isOpen || !mapRef.current) return
    if (leafletMapRef.current) {
      // Recalculer la taille si déjà initialisée
      setTimeout(() => leafletMapRef.current.invalidateSize(), 100)
      return
    }

    const lat = initialLat || 6.3703
    const lng = initialLng || 2.3912

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: initialLat ? 16 : 13,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    // Marqueur initial si position connue
    if (initialLat && initialLng) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', e => {
        const p = e.target.getLatLng()
        setPosition({ lat: p.lat, lng: p.lng })
        setHasPosition(true)
      })
    }

    // Clic pour placer/déplacer le marqueur
    map.on('click', e => {
      if (markerRef.current) map.removeLayer(markerRef.current)
      markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(map)
      markerRef.current.on('dragend', ev => {
        const p = ev.target.getLatLng()
        setPosition({ lat: p.lat, lng: p.lng })
        setHasPosition(true)
      })
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
      setHasPosition(true)
    })

    leafletMapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
  }, [isOpen])

  // Mettre à jour le marqueur quand la position change via GPS
  useEffect(() => {
    if (!leafletMapRef.current || !position.lat) return
    if (markerRef.current) leafletMapRef.current.removeLayer(markerRef.current)
    markerRef.current = L.marker([position.lat, position.lng], { draggable: true }).addTo(leafletMapRef.current)
    markerRef.current.on('dragend', e => {
      const p = e.target.getLatLng()
      setPosition({ lat: p.lat, lng: p.lng })
      setHasPosition(true)
    })
    leafletMapRef.current.setView([position.lat, position.lng], 16)
  }, [position.lat, position.lng])

  const geolocate = () => {
    if (!navigator.geolocation) { alert("Géolocalisation non disponible sur cet appareil"); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setHasPosition(true)
        setGpsLoading(false)
      },
      () => {
        alert("Impossible d'obtenir votre position. Activez la localisation ou cliquez sur la carte.")
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleValidate = () => {
    if (!hasPosition) { alert('Cliquez sur la carte pour indiquer votre position'); return }
    onValidate(position)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* Barre supérieure */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary-600" size={20} />
          <h2 className="font-display font-bold text-gray-900 text-base">{title}</h2>
        </div>
        <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Instruction */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
        <p className="text-sm text-blue-700 font-body">
          Cliquez sur la carte pour placer votre position, ou faites glisser le marqueur pour ajuster.
        </p>
      </div>

      {/* Carte plein écran */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Barre inférieure */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 space-y-3">
        {/* Coordonnées */}
        {hasPosition && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <MapPin size={14} className="text-primary-600 flex-shrink-0" />
            <span className="text-xs font-body text-gray-600">
              Position : {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </span>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          {/* Géolocaliser */}
          <button
            onClick={geolocate}
            disabled={gpsLoading}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-semibold text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50 flex-1"
          >
            {gpsLoading
              ? <Loader size={16} className="animate-spin" />
              : <MapPin size={16} className="text-primary-600" />
            }
            {gpsLoading ? 'Localisation...' : 'Ma position GPS'}
          </button>

          {/* Valider */}
          <button
            onClick={handleValidate}
            disabled={!hasPosition}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-bold text-sm px-6 py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-1"
          >
            <Check size={18} />
            Valider cette position
          </button>
        </div>

        {/* Quitter sans valider */}
        <button
          onClick={handleClose}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 font-body transition-colors py-1"
        >
          Fermer la carte sans valider
        </button>
      </div>
    </div>
  )
}
