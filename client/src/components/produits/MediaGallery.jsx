import React, { useState, useRef } from 'react'
import { Upload, Trash2, Play, Image, AlertCircle, GripVertical, Video } from 'lucide-react'
import api from '../../lib/api'
import { getImageUrl } from '../../lib/imageUrl'
import toast from 'react-hot-toast'

/**
 * Composant de gestion des médias d'un produit (admin)
 * - Jusqu'à 4 photos
 * - 1 vidéo max 15 secondes
 */
export default function MediaGallery({ produitId, medias = [], onUpdate, onNeedProduitId }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(null) // 'photos' | 'video'
  const [previewVideo, setPreviewVideo] = useState(null)
  const photoInputRef = useRef()
  const videoInputRef = useRef()

  const photos = medias.filter(m => m.type === 'photo').sort((a, b) => a.ordre - b.ordre)
  const video = medias.find(m => m.type === 'video')

  const uploadFichiers = async (photosFiles, videoFile) => {
    // Si pas encore de produit, en créer un brouillon d'abord
    let pid = produitId
    if (!pid && onNeedProduitId) {
      pid = await onNeedProduitId()
    }
    if (!pid) { toast.error('Impossible de créer le produit. Vérifiez les champs obligatoires.'); return }

    // Validation photos
    if (photosFiles?.length > 0) {
      const remaining = 4 - photos.length
      if (remaining <= 0) { toast.error('Maximum 4 photos atteint. Supprimez des photos pour en ajouter.'); return }
    }

    // Validation vidéo côté client
    if (videoFile) {
      if (videoFile.size > 30 * 1024 * 1024) { toast.error('Vidéo trop lourde (max 30 MB)'); return }
      // Vérification durée via l'élément vidéo HTML
      const ok = await verifierDureeVideo(videoFile)
      if (!ok) return
    }

    setUploading(true)
    try {
      const fd = new FormData()
      if (photosFiles) for (const f of Array.from(photosFiles)) fd.append('photos', f)
      if (videoFile) fd.append('video', videoFile)

      const r = await api.post(`/medias/produit/${pid}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (r.data.errors?.length > 0) {
        r.data.errors.forEach(e => toast.error(e))
      } else {
        toast.success(`${r.data.added.length} média(s) ajouté(s)`)
      }
      onUpdate?.(r.data.medias)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const verifierDureeVideo = (file) => new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.preload = 'metadata'
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      if (vid.duration > 15) {
        toast.error(`Vidéo trop longue : ${Math.round(vid.duration)}s. Maximum 15 secondes autorisées.`)
        resolve(false)
      } else {
        resolve(true)
      }
    }
    vid.onerror = () => { URL.revokeObjectURL(url); resolve(true) } // En cas d'erreur on laisse le serveur décider
    vid.src = url
  })

  const supprimerMedia = async (mediaId, type) => {
    if (!window.confirm(`Supprimer cette ${type === 'video' ? 'vidéo' : 'photo'} ?`)) return
    try {
      await api.delete(`/medias/${mediaId}`)
      toast.success('Média supprimé')
      const updated = medias.filter(m => m.id !== mediaId)
      onUpdate?.(updated)
      if (type === 'video' && previewVideo) setPreviewVideo(null)
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDrop = (e, zone) => {
    e.preventDefault()
    setDragOver(null)
    const files = Array.from(e.dataTransfer.files)
    if (zone === 'photos') {
      const images = files.filter(f => f.type.startsWith('image/'))
      if (images.length > 0) uploadFichiers(images, null)
    } else if (zone === 'video') {
      const vid = files.find(f => f.type.startsWith('video/'))
      if (vid) uploadFichiers(null, vid)
    }
  }

  return (
    <div className="space-y-5">
      {/* Section photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-display font-semibold text-gray-700 flex items-center gap-1.5">
            <Image size={15} className="text-primary-600" />
            Photos du produit
          </label>
          <span className={`text-xs font-body ${photos.length >= 4 ? 'text-red-500' : 'text-gray-400'}`}>
            {photos.length} / 4 photos
          </span>
        </div>

        {/* Grille photos existantes */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {photos.map((m, i) => (
              <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={getImageUrl(m.url)}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = 'https://placehold.co/100x100/E8F5E9/2E7D32?text=AP' }}
                />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-primary-600 text-white text-xs font-display font-semibold px-1.5 py-0.5 rounded">
                    Principale
                  </span>
                )}
                <button
                  onClick={() => supprimerMedia(m.id, 'photo')}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="Supprimer cette photo"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Zone d'upload photos */}
        {photos.length < 4 && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver('photos') }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, 'photos')}
            onClick={() => photoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
              dragOver === 'photos' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <Upload size={20} className="mx-auto text-gray-400 mb-1" />
            <p className="text-sm font-body text-gray-500">
              Glissez vos photos ici ou <span className="text-primary-600 font-semibold">cliquez</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              JPG, PNG, WebP — Encore {4 - photos.length} place(s)
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={e => {
                if (e.target.files?.length) uploadFichiers(e.target.files, null)
                e.target.value = ''
              }}
            />
          </div>
        )}

        {photos.length >= 4 && (
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            Maximum 4 photos atteint. Supprimez une photo pour en ajouter une nouvelle.
          </div>
        )}
      </div>

      {/* Séparateur */}
      <hr className="border-gray-200" />

      {/* Section vidéo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-display font-semibold text-gray-700 flex items-center gap-1.5">
            <Video size={15} className="text-secondary-600" />
            Vidéo courte
          </label>
          <span className="text-xs text-gray-400 font-body">Max 15 secondes — 1 vidéo par produit</span>
        </div>

        {/* Vidéo existante */}
        {video && (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black mb-3">
            <video
              src={getImageUrl(video.url)}
              controls
              autoPlay={false}
              muted
              className="w-full max-h-48 object-contain"
              onError={() => toast.error('Impossible de charger la vidéo')}
            />
            <button
              onClick={() => supprimerMedia(video.id, 'video')}
              className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 size={12} /> Supprimer la vidéo
            </button>
          </div>
        )}

        {/* Zone upload vidéo */}
        {!video && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver('video') }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, 'video')}
            onClick={() => videoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              dragOver === 'video' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-300 hover:border-secondary-400 hover:bg-gray-50'
            }`}
          >
            <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Play size={18} className="text-secondary-600 ml-0.5" />
            </div>
            <p className="text-sm font-body text-gray-500">
              Glissez votre vidéo ici ou <span className="text-secondary-600 font-semibold">cliquez</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">MP4, WebM — Maximum <strong>15 secondes</strong></p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) uploadFichiers(null, e.target.files[0])
                e.target.value = ''
              }}
            />
          </div>
        )}

        {video && (
          <p className="text-xs text-gray-400 font-body mt-2">
            Pour changer la vidéo, supprimez l'actuelle puis uploadez-en une nouvelle.
          </p>
        )}
      </div>

      {/* Overlay upload en cours */}
      {uploading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="font-display font-semibold text-gray-900">Upload en cours...</p>
            <p className="text-sm text-gray-500 font-body">Veuillez patienter</p>
          </div>
        </div>
      )}
    </div>
  )
}
