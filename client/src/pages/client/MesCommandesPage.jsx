import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RotateCcw, Search, FileText, ShoppingCart, ArrowRight, RefreshCw, Lock } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix, formatPoids } from '../../lib/utils'
import useCartStore from '../../store/useCartStore'
import { PageLoader } from '../../components/ui/Spinner'
import { ouvrirRecuClient } from '../../lib/genererRecuPDF'
import toast from 'react-hot-toast'

const STATUTS_CONFIG = {
  EN_ATTENTE:   { label: 'En attente',      bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
  CONFIRMEE:    { label: 'Confirmée',        bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  EN_LIVRAISON: { label: 'En livraison',     bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  LIVREE:       { label: 'Livrée',           bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  ANNULEE:      { label: 'Annulée',          bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400'    },
  PROBLEME:     { label: 'Problème',         bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-600'    },
}

export default function MesCommandesPage() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [renouvellementId, setRenouvellementId] = useState(null)
  const [onglet, setOnglet] = useState('commandes')
  const { rechargerCommande } = useCartStore()
  const navigate = useNavigate()

  const charger = useCallback((silencieux = false) => {
    if (!silencieux) setLoading(true)
    api.get('/commandes/mes-commandes')
      .then(r => {
        setCommandes(r.data.commandes || [])
        setLastUpdate(new Date())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    charger()
    const interval = setInterval(() => charger(true), 30000)
    return () => clearInterval(interval)
  }, [charger])

  // Recharge les articles dans le panier puis redirige vers /panier pour compléter
  const handleRenouveler = async (commande) => {
    setRenouvellementId(commande.id)
    try {
      const r = await api.get(`/commandes/code/${commande.code_commande}`)
      const detail = r.data.commande
      if (!detail.lignes?.length) { toast.error('Aucun article dans cette commande'); return }

      // Récupérer les données complètes de chaque produit (avec prix, poids, etc.)
      const lignesCompletes = await Promise.all(
        detail.lignes.map(async (l) => {
          try {
            const rp = await api.get(`/produits/${l.produit_id}`)
            return { ...l, produit: rp.data.produit }
          } catch {
            // Si le produit n'existe plus, garder les données partielles
            return l
          }
        })
      )

      // Filtrer les lignes dont le produit a bien un prix
      const lignesValides = lignesCompletes.filter(l => l.produit?.prix_unitaire)
      if (!lignesValides.length) { toast.error('Produits introuvables ou plus disponibles'); return }

      rechargerCommande(lignesValides)
      toast.success(`${lignesValides.length} article(s) chargés — modifiez si besoin puis confirmez`)
      setTimeout(() => navigate('/panier'), 500)
    } catch {
      toast.error('Impossible de charger la commande')
    } finally {
      setRenouvellementId(null)
    }
  }

  const handleRecu = async (commande) => {
    try {
      const r = await api.get(`/commandes/code/${commande.code_commande}`)
      ouvrirRecuClient(r.data.commande)
    } catch { toast.error('Impossible de générer le reçu') }
  }

  const commandesFiltrees = commandes.filter(c =>
    !recherche ||
    c.code_commande.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.statut || '').toLowerCase().includes(recherche.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-gray-900">Mes commandes</h1>
          {lastUpdate && (
            <p className="text-xs text-gray-400 font-body mt-0.5">
              Mis à jour {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button onClick={() => charger()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-body transition-colors p-2 rounded-lg hover:bg-gray-100">
          <RotateCcw size={15} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setOnglet('commandes')}
          className={`flex-1 py-2.5 rounded-xl font-display font-bold text-sm transition-colors ${onglet === 'commandes' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Mes commandes ({commandes.length})
        </button>
        {/* PromoFlash bloqué */}
        <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed select-none font-display font-bold text-sm opacity-60">
          <Lock size={12} />
          PromoFlash
        </div>
      </div>

      {/* Barre de recherche */}
      {commandes.length > 2 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Rechercher par code ou statut..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
      )}

      {/* Aucune commande */}
      {commandesFiltrees.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-body text-base mb-4">Aucune commande pour l'instant</p>
          <Link to="/catalogue"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-6 py-3 rounded-xl transition-colors">
            Parcourir le catalogue <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Tableau transactions */}
      {commandesFiltrees.length > 0 && (
        <>
          {/* Vue tableau — desktop */}
          <div className="hidden md:block card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Code', 'Date', 'Livraison', 'Total', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commandesFiltrees.map(cmd => {
                    const cfg = STATUTS_CONFIG[cmd.statut] || { label: cmd.statut, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
                    return (
                      <tr key={cmd.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-display font-bold text-primary-600 text-sm">{cmd.code_commande}</p>
                          {cmd.statut === 'EN_LIVRAISON' && (
                            <span className="flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                              En route
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-body">
                          {new Date(cmd.date_commande).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-body">
                          {cmd.jour_livraison}<br/>
                          <span className="text-xs text-gray-400">{cmd.tranche_horaire}</span>
                        </td>
                        <td className="px-4 py-3 font-display font-bold text-gray-900 text-sm">
                          {formatPrix(cmd.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-display font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRenouveler(cmd)}
                              disabled={renouvellementId === cmd.id}
                              className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Recharger dans le panier"
                            >
                              {renouvellementId === cmd.id
                                ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                : <RefreshCw size={12} />
                              }
                              Recommander
                            </button>
                            <button onClick={() => handleRecu(cmd)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded"
                              title="Télécharger le reçu">
                              <FileText size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vue cartes — mobile */}
          <div className="md:hidden space-y-3">
            {commandesFiltrees.map(cmd => {
              const cfg = STATUTS_CONFIG[cmd.statut] || { label: cmd.statut, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
              return (
                <div key={cmd.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-primary-600">{cmd.code_commande}</p>
                      <p className="text-xs text-gray-400 font-body mt-0.5">
                        {new Date(cmd.date_commande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-xs font-display font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-body">Total</p>
                      <p className="font-display font-bold text-gray-900">{formatPrix(cmd.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-body">Livraison</p>
                      <p className="font-body font-semibold text-gray-700 text-xs">{cmd.jour_livraison} · {cmd.tranche_horaire}</p>
                    </div>
                  </div>

                  {cmd.statut === 'EN_LIVRAISON' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-orange-700 font-body font-semibold">Livreur en route — préparez {formatPrix(cmd.total)}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleRenouveler(cmd)}
                      disabled={renouvellementId === cmd.id}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {renouvellementId === cmd.id
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <RefreshCw size={14} />
                      }
                      Recommander
                    </button>
                    <button onClick={() => handleRecu(cmd)}
                      className="flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-2.5 rounded-xl transition-colors">
                      <FileText size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Info Recommander */}
          <p className="text-xs text-gray-400 font-body text-center mt-3">
            "Recommander" charge les articles dans le panier — modifiez si besoin avant de confirmer
          </p>
        </>
      )}
    </div>
  )
}
