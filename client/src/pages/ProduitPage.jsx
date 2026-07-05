import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Package, ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import { formatPrix, formatPoids } from '../lib/utils'
import { getImageUrl } from '../lib/imageUrl'
import useCartStore from '../store/useCartStore'
import { PageLoader } from '../components/ui/Spinner'
import MediaCarousel from '../components/produits/MediaCarousel'
import toast from 'react-hot-toast'

export default function ProduitPage() {
  const { id } = useParams()
  const [produit, setProduit] = useState(null)
  const [medias, setMedias] = useState([])
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    Promise.all([
      api.get(`/produits/${id}`),
      api.get(`/medias/produit/${id}`).catch(() => ({ data: { medias: [] } })),
    ]).then(([prodRes, mediaRes]) => {
      setProduit(prodRes.data.produit)
      setMedias(mediaRes.data.medias || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!produit) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 font-body">Produit introuvable.</p>
      <Link to="/catalogue" className="text-primary-600 font-semibold hover:underline mt-2 inline-block">Retour au catalogue</Link>
    </div>
  )

  const handleAdd = (type) => {
    addItem(produit, type, 1)
    toast.success('Ajouté au panier')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/catalogue" className="inline-flex items-center gap-1 text-gray-500 hover:text-primary-600 text-sm font-body mb-6 transition-colors">
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Carousel médias — photos + vidéo */}
        <div>
          <MediaCarousel medias={medias} nomProduit={produit.nom} />
        </div>

        {/* Infos */}
        <div className="space-y-5">
          {produit.categorie_nom && (
            <span className="text-xs font-display font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              {produit.categorie_nom}
            </span>
          )}

          <h1 className="font-display font-bold text-2xl text-gray-900">{produit.nom}</h1>

          {produit.description && (
            <p className="text-gray-600 font-body leading-relaxed">{produit.description}</p>
          )}

          {produit.poids_unitaire_kg && (
            <p className="text-sm text-gray-500 font-body">
              Poids unitaire : <span className="font-semibold text-gray-700">{formatPoids(produit.poids_unitaire_kg)}</span>
            </p>
          )}

          {!produit.stock && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <span className="text-red-700 font-display font-semibold text-sm">Rupture de stock — indisponible</span>
            </div>
          )}

          {/* Prix et boutons */}
          <div className="space-y-3">
            {/* Unitaire */}
            <div className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 font-body mb-0.5">Prix unitaire</p>
                <p className="font-display font-bold text-xl text-primary-600">{formatPrix(produit.prix_unitaire)}</p>
                {produit.poids_unitaire_kg && <p className="text-xs text-gray-400 font-body">{produit.poids_unitaire_kg} kg</p>}
              </div>
              <button
                onClick={() => handleAdd('unite')}
                disabled={!produit.stock}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={16} /> Ajouter
              </button>
            </div>

            {/* Gros */}
            {produit.prix_gros && produit.seuil_gros && (
              <div className="card p-4 bg-secondary-50 border-secondary-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-secondary-600 font-body mb-0.5">Prix en gros</p>
                  <p className="font-display font-bold text-xl text-secondary-600">{formatPrix(produit.prix_gros)}</p>
                  <p className="text-xs text-gray-500 font-body">{produit.label_gros || `Dès ${produit.seuil_gros} unités`}</p>
                </div>
                <button
                  onClick={() => handleAdd('gros')}
                  disabled={!produit.stock}
                  className="flex items-center gap-2 bg-secondary-600 hover:bg-secondary-700 text-white font-display font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={16} /> Ajouter gros
                </button>
              </div>
            )}

            {/* Carton */}
            {produit.has_carton && produit.prix_carton && (
              <div className="card p-4 bg-blue-50 border-blue-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-blue-600 font-body mb-0.5">Prix carton</p>
                  <p className="font-display font-bold text-xl text-blue-700">{formatPrix(produit.prix_carton)}</p>
                  {produit.qte_carton && <p className="text-xs text-gray-500 font-body">{produit.qte_carton} unités — {formatPoids(produit.poids_carton_kg)}</p>}
                </div>
                <button
                  onClick={() => handleAdd('carton')}
                  disabled={!produit.stock}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-display font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Package size={16} /> Carton
                </button>
              </div>
            )}

            {/* Sac */}
            {produit.has_sac && produit.prix_sac && (
              <div className="card p-4 bg-purple-50 border-purple-200 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-purple-600 font-body mb-0.5">Prix sac</p>
                  <p className="font-display font-bold text-xl text-purple-700">{formatPrix(produit.prix_sac)}</p>
                  {produit.qte_sac && <p className="text-xs text-gray-500 font-body">{produit.qte_sac} unités — {formatPoids(produit.poids_sac_kg)}</p>}
                </div>
                <button
                  onClick={() => handleAdd('sac')}
                  disabled={!produit.stock}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-display font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Package size={16} /> Sac
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
