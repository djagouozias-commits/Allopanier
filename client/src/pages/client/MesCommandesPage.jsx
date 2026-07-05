import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ChevronDown, ChevronUp, RotateCcw, Search, FileText } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix, formatPoids } from '../../lib/utils'
import useCartStore from '../../store/useCartStore'
import { PageLoader } from '../../components/ui/Spinner'
import { ouvrirRecuClient } from '../../lib/genererRecuPDF'
import toast from 'react-hot-toast'

// Statuts avec couleurs et libellés
const STATUTS_CONFIG = {
  EN_ATTENTE:    { label: 'En attente',       bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', ordre: 1 },
  CONFIRMEE:     { label: 'Confirmée',         bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500',   ordre: 2 },
  EN_LIVRAISON:  { label: 'En livraison',      bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', ordre: 3 },
  LIVREE:        { label: 'Livrée',            bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  ordre: 4 },
  ANNULEE:       { label: 'Annulée',           bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400',    ordre: 5 },
  PROBLEME:      { label: 'Problème signalé',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-600',    ordre: 5 },
}

// Barre de progression du statut
function ProgressStatut({ statut }) {
  const etapes = ['EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON', 'LIVREE']
  const annule = statut === 'ANNULEE' || statut === 'PROBLEME'
  const currentIdx = etapes.indexOf(statut)

  if (annule) return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 bg-red-200 rounded-full" />
      <span className="text-xs text-red-600 font-body">{STATUTS_CONFIG[statut]?.label}</span>
    </div>
  )

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1">
        {etapes.map((e, i) => {
          const cfg = STATUTS_CONFIG[e]
          const done = i <= currentIdx
          const active = i === currentIdx
          return (
            <React.Fragment key={e}>
              <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${
                  done ? `${cfg.dot} border-transparent` : 'bg-white border-gray-300'
                } ${active ? 'ring-2 ring-offset-1 ring-current scale-125' : ''}`} />
                <span className={`text-xs mt-1 font-body whitespace-nowrap ${done ? cfg.text : 'text-gray-400'}`}
                  style={{ fontSize: '9px' }}>
                  {cfg.label}
                </span>
              </div>
              {i < etapes.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 rounded-full transition-all ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default function MesCommandesPage() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const rechargerCommande = useCartStore(s => s.rechargerCommande)

  const chargerCommandes = useCallback((silencieux = false) => {
    if (!silencieux) setLoading(true)
    api.get('/commandes/mes-commandes')
      .then(r => {
        setCommandes(r.data.commandes || [])
        setLastUpdate(new Date())
        if (!silencieux) setLoading(false)
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    chargerCommandes()
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(() => chargerCommandes(true), 30000)
    return () => clearInterval(interval)
  }, [chargerCommandes])

  const handleRenouveler = async (commande) => {
    try {
      const r = await api.get(`/commandes/code/${commande.code_commande}`)
      const detail = r.data.commande
      if (detail.lignes?.length > 0) {
        rechargerCommande(detail.lignes)
        toast.success('Articles rechargés dans le panier')
      }
    } catch {
      toast.error('Impossible de recharger la commande')
    }
  }

  const handleRecu = async (commande) => {
    try {
      const r = await api.get(`/commandes/code/${commande.code_commande}`)
      ouvrirRecuClient(r.data.commande)
    } catch {
      toast.error('Impossible de générer le reçu')
    }
  }

  const commandesFiltrees = commandes.filter(c =>
    !recherche ||
    c.code_commande.toLowerCase().includes(recherche.toLowerCase()) ||
    c.statut.toLowerCase().includes(recherche.toLowerCase())
  )

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Mes commandes</h1>
          {lastUpdate && (
            <p className="text-xs text-gray-400 font-body mt-0.5">
              Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              <span className="ml-1 text-green-500">(actualisation auto toutes les 30s)</span>
            </p>
          )}
        </div>
        <button
          onClick={() => chargerCommandes()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-body transition-colors"
        >
          <RotateCcw size={14} />
          Actualiser
        </button>
      </div>

      {/* Recherche */}
      {commandes.length > 3 && (
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

      {commandesFiltrees.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 font-body text-lg mb-3">Aucune commande pour l'instant</p>
          <Link to="/catalogue"
            className="bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-6 py-3 rounded-xl transition-colors">
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {commandesFiltrees.map(cmd => {
            const cfg = STATUTS_CONFIG[cmd.statut] || { label: cmd.statut, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
            const isExpanded = expandedId === cmd.id

            return (
              <div key={cmd.id} className="card overflow-hidden">
                <div className="p-4">
                  {/* En-tête carte commande */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display font-bold text-primary-600 tracking-wide">{cmd.code_commande}</p>
                        {/* Indicateur clignotant si en livraison */}
                        {cmd.statut === 'EN_LIVRAISON' && (
                          <span className="flex items-center gap-1 text-xs text-orange-600 font-body bg-orange-50 px-2 py-0.5 rounded-full">
                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            En route
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-body mt-0.5">
                        {new Date(cmd.date_commande).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Badge statut */}
                    <span className={`text-xs font-display font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Barre de progression */}
                  <ProgressStatut statut={cmd.statut} />

                  {/* Infos commande */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-gray-400 font-body">Total à payer</p>
                      <p className="font-display font-bold text-gray-900">{formatPrix(cmd.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-body">Livraison</p>
                      <p className="font-body font-semibold text-gray-700 text-sm">
                        {cmd.jour_livraison} — {cmd.tranche_horaire}
                      </p>
                    </div>
                    {cmd.poids_total_kg > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 font-body">Poids</p>
                        <p className="font-body font-semibold text-gray-700 text-sm">{formatPoids(cmd.poids_total_kg)}</p>
                      </div>
                    )}
                  </div>

                  {/* Message contextuel selon statut */}
                  {cmd.statut === 'CONFIRMEE' && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-blue-700 font-body">
                        Votre commande est confirmée. La livraison est planifiée pour {cmd.jour_livraison}.
                      </p>
                    </div>
                  )}
                  {cmd.statut === 'EN_LIVRAISON' && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-orange-700 font-body font-semibold">
                        Votre livreur est en route ! Préparez le montant de {formatPrix(cmd.total)} en espèces.
                      </p>
                    </div>
                  )}
                  {cmd.statut === 'LIVREE' && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-green-700 font-body">
                        Commande livrée. Merci pour votre confiance !
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : cmd.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600 font-display font-semibold transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {isExpanded ? 'Masquer' : 'Voir le détail'}
                    </button>
                    <button
                      onClick={() => handleRecu(cmd)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-display font-semibold transition-colors"
                    >
                      <FileText size={14} />
                      Mon reçu
                    </button>
                    <button
                      onClick={() => handleRenouveler(cmd)}
                      className="flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-700 font-display font-semibold transition-colors ml-auto"
                    >
                      <RefreshCw size={14} />
                      Commander à nouveau
                    </button>
                  </div>
                </div>

                {/* Détail expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <DetailCommande codeCommande={cmd.code_commande} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DetailCommande({ codeCommande }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/commandes/code/${codeCommande}`)
      .then(r => { setDetail(r.data.commande); setLoading(false) })
      .catch(() => setLoading(false))
  }, [codeCommande])

  if (loading) return (
    <div className="flex justify-center py-4">
      <span className="w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
  if (!detail) return <p className="text-sm text-gray-400 font-body">Détails non disponibles</p>

  return (
    <div className="space-y-4">
      {/* Code de retrait mis en avant */}
      <div className="bg-white border-2 border-primary-200 rounded-xl p-3 text-center">
        <p className="text-xs text-gray-500 font-body mb-1">Code de retrait à présenter au livreur</p>
        <p className="font-display font-extrabold text-xl text-primary-600 tracking-widest">{detail.code_commande}</p>
      </div>

      {/* Adresse */}
      {detail.adresse?.description_lieu && (
        <div>
          <p className="text-xs font-display font-semibold text-gray-500 uppercase mb-1">Adresse</p>
          <p className="text-sm text-gray-700 font-body bg-white border border-gray-200 rounded-lg px-3 py-2">
            {detail.adresse.description_lieu}
          </p>
        </div>
      )}

      {/* Articles */}
      {detail.lignes?.length > 0 && (
        <div>
          <p className="text-xs font-display font-semibold text-gray-500 uppercase mb-2">Articles</p>
          <div className="space-y-2">
            {detail.lignes.map((l, i) => (
              <div key={i} className="flex justify-between items-start bg-white border border-gray-100 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm font-body text-gray-800">{l.produit?.nom || 'Produit'}</span>
                  <span className="text-xs text-gray-400 ml-2">× {l.quantite} ({l.type_achat})</span>
                  {l.est_prix_gros && (
                    <span className="ml-2 text-xs text-primary-600 font-display font-semibold">Prix gros</span>
                  )}
                </div>
                <span className="font-display font-bold text-gray-900 ml-4 flex-shrink-0">
                  {formatPrix(l.sous_total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totaux */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1.5 text-sm font-body">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total</span><span className="font-semibold">{formatPrix(detail.sous_total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Frais de livraison</span><span className="font-semibold">{formatPrix(detail.frais_livraison)}</span>
        </div>
        <div className="flex justify-between font-display font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
          <span>Total à payer</span>
          <span className="text-primary-600">{formatPrix(detail.total)}</span>
        </div>
      </div>

      {detail.note_livraison && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 font-body mb-1">Note de livraison</p>
          <p className="text-sm text-gray-700 font-body">{detail.note_livraison}</p>
        </div>
      )}
    </div>
  )
}
