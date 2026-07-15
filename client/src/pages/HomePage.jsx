import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Clock, Star } from 'lucide-react'
import api from '../lib/api'
import CarteProduit from '../components/produits/CartesProduit'
import { PageLoader } from '../components/ui/Spinner'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [publicite, setPublicite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/categories').catch(() => ({ data: { categories: [] } })),
      api.get('/produits?limit=8').catch(() => ({ data: { produits: [] } })),
      api.get('/publicite').catch(() => ({ data: { actif: false } })),
    ]).then(([catRes, prodRes, pubRes]) => {
      setCategories(catRes.data.categories || [])
      setProduits(prodRes.data.produits || [])
      setPublicite(pubRes.data?.actif ? pubRes.data : null)
      setLoading(false)
    })
  }, [])

  if (loading) return <PageLoader />

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
          <div className="max-w-2xl">
            <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-tight mb-3 md:mb-4">
              Vos produits livrés à domicile au Bénin
            </h1>
            <p className="font-body text-base md:text-lg text-primary-100 mb-6 md:mb-8 leading-relaxed">
              Céréales, légumes, électroménager — commandez en ligne, livré chez vous dès le prochain jour.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-display font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors text-base"
              >
                Voir le catalogue
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/inscription"
                className="inline-flex items-center justify-center gap-2 border border-white text-white font-display font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-base"
              >
                Créer un compte
              </Link>
            </div>

            {publicite?.video_url && (
              <div className="mt-6 max-w-xl rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-black/20">
                <video
                  src={publicite.video_url}
                  className="w-full aspect-video object-cover"
                  autoPlay loop muted playsInline controls={false}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Truck className="text-primary-600" size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 text-sm md:text-base">Livraison rapide</h3>
                <p className="text-xs md:text-sm text-gray-500 font-body">Mardi, Jeudi, Samedi, Dimanche</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="text-secondary-600" size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 text-sm md:text-base">Paiement à la livraison</h3>
                <p className="text-xs md:text-sm text-gray-500 font-body">Payez uniquement à la réception</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-gray-900 text-sm md:text-base">Horaires flexibles</h3>
                <p className="text-xs md:text-sm text-gray-500 font-body">8h–12h ou 14h–18h</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10 md:space-y-12">
        {/* Catégories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="font-display font-bold text-xl md:text-2xl text-gray-900">Nos catégories</h2>
              <Link to="/catalogue" className="text-primary-600 text-sm font-display font-semibold hover:underline flex items-center gap-1">
                Tout voir <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/catalogue/${cat.id}`}
                  className="card p-3 md:p-4 text-center hover:shadow-md hover:border-primary-200 transition-all group active:scale-95"
                >
                  <div className="text-2xl md:text-3xl mb-1.5">{cat.icone || '🛒'}</div>
                  <p className="text-xs md:text-sm font-display font-semibold text-gray-800 group-hover:text-primary-600 transition-colors leading-tight">
                    {cat.nom}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Produits vedettes */}
        {produits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="font-display font-bold text-xl md:text-2xl text-gray-900">Produits du moment</h2>
              <Link to="/catalogue" className="text-primary-600 text-sm font-display font-semibold hover:underline flex items-center gap-1">
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {produits.map(p => <CarteProduit key={p.id} produit={p} />)}
            </div>
          </section>
        )}

        {/* Zone de couverture */}
        <section className="bg-primary-50 rounded-2xl p-5 md:p-8">
          <h2 className="font-display font-bold text-lg md:text-xl text-gray-900 mb-2 md:mb-3">Zone de livraison</h2>
          <p className="text-gray-600 font-body text-sm md:text-base mb-3 md:mb-4">
            Nous livrons actuellement dans les zones suivantes :
          </p>
          <div className="flex flex-wrap gap-2">
            {['Abomey-Calavi', 'Godomey', 'Akpakpa', 'Cadjehoun', 'Fidjrossè', 'Sèmè-Kpodji', 'Porto-Novo', 'Parakou'].map(zone => (
              <span key={zone} className="bg-white border border-primary-200 text-primary-700 text-xs md:text-sm font-body px-2.5 py-1 rounded-full">
                {zone}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
