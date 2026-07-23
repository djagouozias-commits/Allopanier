import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Search, X, LayoutGrid, ChevronDown } from 'lucide-react'
import api from '../lib/api'
import CarteProduit from '../components/produits/CartesProduit'
import { PageLoader } from '../components/ui/Spinner'

export default function CataloguePage() {
  const { categorieSlug } = useParams()
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [categorieActive, setCategorieActive] = useState(categorieSlug || '')
  const [recherche, setRecherche] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // Ouverture du panneau catégories sur mobile
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false)
  const categoriesPanelRef = useRef(null)
  const LIMIT = 20

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, page })
    if (categorieActive) params.append('categorie', categorieActive)
    if (recherche.length >= 2) params.append('q', recherche)

    api.get(`/produits?${params.toString()}`)
      .then(r => {
        setProduits(r.data.produits || [])
        setTotal(r.data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [categorieActive, page])

  // Auto-complétion
  useEffect(() => {
    if (recherche.length < 2) { setSuggestions([]); return }
    const timer = setTimeout(() => {
      api.get(`/produits/suggestions?q=${encodeURIComponent(recherche)}`)
        .then(r => setSuggestions(r.data.suggestions || []))
        .catch(() => setSuggestions([]))
    }, 300)
    return () => clearTimeout(timer)
  }, [recherche])

  // Fermer le panneau catégories si on clique ailleurs
  useEffect(() => {
    if (!categoriesOuvertes) return
    const handleClickOutside = (e) => {
      if (categoriesPanelRef.current && !categoriesPanelRef.current.contains(e.target)) {
        setCategoriesOuvertes(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [categoriesOuvertes])

  const handleSearch = (e) => {
    e.preventDefault()
    setSuggestions([])
    setPage(1)
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, page: 1 })
    if (categorieActive) params.append('categorie', categorieActive)
    if (recherche.length >= 2) params.append('q', recherche)
    api.get(`/produits?${params.toString()}`)
      .then(r => { setProduits(r.data.produits || []); setTotal(r.data.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const handleSuggestionClick = (nom) => {
    setRecherche(nom)
    setSuggestions([])
    handleSearch({ preventDefault: () => {} })
  }

  const handleCategorieClick = (id) => {
    setCategorieActive(id)
    setPage(1)
    setCategoriesOuvertes(false)
  }

  const categorieNom = categories.find(c => String(c.id) === String(categorieActive))?.nom

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* En-tête */}
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-1">
          {categorieNom || 'Catalogue'}
        </h1>
        <p className="text-gray-500 font-body text-sm">{total} produit{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Bouton catégories mobile */}
      <div className="lg:hidden mb-4 relative" ref={categoriesPanelRef}>
        <button
          onClick={() => setCategoriesOuvertes(v => !v)}
          className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl border font-display font-semibold text-sm transition-colors ${
            categoriesOuvertes
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-200 shadow-sm'
          }`}
        >
          <LayoutGrid size={18} />
          <span className="flex-1 text-left">
            {categorieNom ? `Catégorie : ${categorieNom}` : 'Toutes les catégories'}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${categoriesOuvertes ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Panneau catégories déroulant */}
        {categoriesOuvertes && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden">
            <div className="p-2 max-h-72 overflow-y-auto">
              <button
                onClick={() => handleCategorieClick('')}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-body transition-colors mb-0.5 ${
                  !categorieActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                🛒 Tous les produits
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorieClick(String(cat.id))}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-body transition-colors mb-0.5 ${
                    String(categorieActive) === String(cat.id)
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <span className="mr-1.5">{cat.icone}</span>{cat.nom}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filtres sidebar — desktop uniquement, jamais visible sur mobile */}
        <aside className="hidden lg:block lg:w-56 flex-shrink-0">
          <div className="card p-4">
            <h3 className="font-display font-semibold text-sm text-gray-700 mb-3">Catégories</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { setCategorieActive(''); setPage(1) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                    !categorieActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Tous les produits
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => { setCategorieActive(String(cat.id)); setPage(1) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-colors ${
                      String(categorieActive) === String(cat.id)
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{cat.icone}</span> {cat.nom}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Produits */}
        <div className="flex-1 min-w-0">
          {/* Barre de recherche */}
          <div className="relative mb-5">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="input-field pl-10 pr-10"
                />
                {recherche && (
                  <button
                    type="button"
                    onClick={() => { setRecherche(''); setSuggestions([]) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button"
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Search size={14} className="text-gray-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors whitespace-nowrap"
              >
                Rechercher
              </button>
            </form>
          </div>

          {loading ? (
            <PageLoader />
          ) : produits.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-body text-lg mb-2">Aucun produit trouvé</p>
              <p className="text-gray-400 font-body text-sm">Essayez d'autres mots-clés ou parcourez les catégories</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {produits.map(p => <CarteProduit key={p.id} produit={p} />)}
              </div>
              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-body disabled:opacity-40 hover:bg-gray-50 active:bg-gray-100"
                  >
                    Précédent
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600 font-body">
                    Page {page} / {Math.ceil(total / LIMIT)}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / LIMIT)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-body disabled:opacity-40 hover:bg-gray-50 active:bg-gray-100"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
