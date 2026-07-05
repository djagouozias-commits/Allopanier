import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { getImageUrl } from '../../lib/imageUrl'

/**
 * Carousel photos + vidéo pour la fiche produit côté client.
 * - Vidéo en premier si présente (autoplay muet, contrôles)
 * - Puis photos navigables
 * - Indicateurs de position
 */
export default function MediaCarousel({ medias = [], nomProduit = '' }) {
  const photos = medias.filter(m => m.type === 'photo').sort((a, b) => a.ordre - b.ordre)
  const video = medias.find(m => m.type === 'video')

  // Construire la liste ordonnée : vidéo d'abord si présente
  const items = [
    ...(video ? [{ ...video }] : []),
    ...photos,
  ]

  const [index, setIndex] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)

  const current = items[index]
  const isVideo = current?.type === 'video'

  // Auto-play vidéo quand on arrive dessus
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [index, isVideo])

  // Pause vidéo quand on quitte
  useEffect(() => {
    if (!isVideo && videoRef.current) {
      videoRef.current.pause()
      setPlaying(false)
    }
  }, [index, isVideo])

  if (items.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400 font-body text-sm">Aucune image disponible</p>
      </div>
    )
  }

  if (items.length === 1) {
    return <SingleMedia item={items[0]} nomProduit={nomProduit} videoRef={videoRef} muted={muted} setMuted={setMuted} />
  }

  const prev = () => setIndex(i => (i - 1 + items.length) % items.length)
  const next = () => setIndex(i => (i + 1) % items.length)

  const togglePlay = () => {
    if (!videoRef.current) return
    if (playing) { videoRef.current.pause(); setPlaying(false) }
    else { videoRef.current.play(); setPlaying(true) }
  }

  return (
    <div className="relative w-full group">
      {/* Media principal */}
      <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden">
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={getImageUrl(current.url)}
              muted={muted}
              loop
              playsInline
              className="w-full h-full object-contain"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            {/* Contrôles vidéo */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={() => setMuted(m => !m)}
                className="w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <span className="text-white text-xs font-body bg-black/60 px-2 py-1 rounded-full">
                Vidéo produit
              </span>
            </div>
          </>
        ) : (
          <img
            src={getImageUrl(current.url)}
            alt={`${nomProduit} — photo ${index + 1}`}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://placehold.co/600x600/E8F5E9/2E7D32?text=AlloPanier' }}
          />
        )}

        {/* Flèches navigation */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={18} className="text-gray-700" />
        </button>

        {/* Badge vidéo */}
        {isVideo && !playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
              <Play size={28} className="text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Miniatures */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setIndex(i)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === index ? 'border-primary-600 shadow-md' : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            {item.type === 'video' ? (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                <video
                  src={getImageUrl(item.url)}
                  className="w-full h-full object-cover opacity-70"
                  muted
                  preload="metadata"
                />
                <Play size={14} className="text-white absolute" />
              </div>
            ) : (
              <img
                src={getImageUrl(item.url)}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { e.target.src = 'https://placehold.co/64x64/E8F5E9/2E7D32?text=AP' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Indicateurs dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`rounded-full transition-all ${
              i === index ? 'w-4 h-2 bg-primary-600' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function SingleMedia({ item, nomProduit, videoRef, muted, setMuted }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [item])

  if (item.type === 'video') {
    return (
      <div className="relative w-full aspect-square bg-gray-900 rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          src={getImageUrl(item.url)}
          muted={muted}
          loop
          playsInline
          className="w-full h-full object-contain"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <button
            onClick={() => setMuted(m => !m)}
            className="w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <span className="text-white text-xs font-body bg-black/60 px-2 py-1 rounded-full">Vidéo produit</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
      <img
        src={getImageUrl(item.url)}
        alt={nomProduit}
        className="w-full h-full object-cover"
        onError={e => { e.target.src = 'https://placehold.co/600x600/E8F5E9/2E7D32?text=AlloPanier' }}
      />
    </div>
  )
}
