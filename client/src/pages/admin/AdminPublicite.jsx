import React, { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Video, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminPublicite() {
  const [data, setData] = useState({ video_url: null, actif: false })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const load = () => {
    api.get('/publicite/admin')
      .then(r => setData(r.data))
      .catch(() => toast.error('Impossible de charger la publicité'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Seules les vidéos sont acceptées (MP4, WebM, MOV)')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('video', file)

    try {
      const r = await api.post('/publicite/admin/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setData({ video_url: r.data.video_url, actif: r.data.actif })
      toast.success('Vidéo publicitaire enregistrée')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const toggleActif = async () => {
    try {
      const r = await api.put('/publicite/admin/actif', { actif: !data.actif })
      setData(p => ({ ...p, actif: r.data.actif }))
      toast.success(r.data.actif ? 'Publicité activée' : 'Publicité désactivée')
    } catch {
      toast.error('Erreur')
    }
  }

  const supprimer = async () => {
    if (!window.confirm('Supprimer la vidéo publicitaire ?')) return
    try {
      await api.delete('/publicite/admin/video')
      setData({ video_url: null, actif: false })
      toast.success('Vidéo supprimée')
    } catch {
      toast.error('Erreur')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Vidéo publicitaire</h1>
      <p className="text-sm text-gray-500 font-body mb-6">
        Ajoutez une vidéo muette affichée sur la page d'accueil, sous les boutons « Voir le catalogue » et « Créer un compte ».
        Seules les vidéos sont acceptées (sans son à la lecture).
      </p>

      <div className="card p-6 space-y-5">
        {data.video_url ? (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
              <video
                src={data.video_url}
                className="w-full max-h-72 object-contain"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={toggleActif}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-semibold text-sm transition-colors ${
                  data.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {data.actif ? <Eye size={16} /> : <EyeOff size={16} />}
                {data.actif ? 'Visible sur l\'accueil' : 'Masquée'}
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-display font-semibold text-sm hover:bg-primary-700">
                <Upload size={16} /> Remplacer
              </button>
              <button onClick={supprimer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-display font-semibold text-sm ml-auto">
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl py-12 flex flex-col items-center gap-3 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
          >
            <Video size={36} className="opacity-50" />
            <span className="font-display font-semibold">
              {uploading ? 'Upload en cours...' : 'Cliquez pour ajouter une vidéo'}
            </span>
            <span className="text-xs font-body">MP4, WebM ou MOV — max 80 Mo</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleUpload}
        />

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 font-body">
          La vidéo sera lue en boucle, sans son, sur la page d'accueil. Les images ne sont pas acceptées ici — uniquement des fichiers vidéo.
        </div>
      </div>
    </div>
  )
}
