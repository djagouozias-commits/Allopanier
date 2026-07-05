import React, { useEffect, useState } from 'react'
import { Search, Eye, Printer, MessageCircle, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix, formatPoids, STATUTS } from '../../lib/utils'
import { ouvrirRecuAdmin } from '../../lib/genererRecu'
import Modal from '../../components/ui/Modal'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

const STATUTS_LIST = Object.entries(STATUTS).map(([k, v]) => ({ value: k, ...v }))

export default function AdminCommandes() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailModal, setDetailModal] = useState(false)
  const [filtres, setFiltres] = useState({ statut: '', jour: '', q: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const load = () => {
    const params = new URLSearchParams({ limit: LIMIT, page })
    if (filtres.statut) params.append('statut', filtres.statut)
    if (filtres.jour) params.append('jour', filtres.jour)
    if (filtres.q) params.append('q', filtres.q)
    api.get(`/admin/commandes?${params}`).then(r => {
      setCommandes(r.data.commandes || [])
      setTotal(r.data.total || 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(load, [filtres, page])

  const openDetail = async (cmd) => {
    try {
      setSelected(null)
      setDetailModal(true)
      const r = await api.get(`/admin/commandes/${cmd.id}`)
      setSelected(r.data.commande)
    } catch (err) {
      toast.error('Impossible de charger le détail')
      setDetailModal(false)
    }
  }

  const changerStatut = async (id, statut) => {
    await api.put(`/admin/commandes/${id}/statut`, { statut })
    toast.success('Statut mis à jour')
    load()
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut }))
  }

  const imprimerRecu = async (cmd) => {
    let cmdComplete = cmd
    if (!cmd.lignes || cmd.lignes.length === 0) {
      try {
        const r = await api.get(`/admin/commandes/${cmd.id}`)
        cmdComplete = r.data.commande
      } catch {
        toast.error('Impossible de charger le reçu')
        return
      }
    }
    ouvrirRecuAdmin(cmdComplete)
  }

  const supprimer = async (cmd) => {
    if (!window.confirm(`Supprimer la commande ${cmd.code_commande} ?`)) return
    try {
      await api.delete(`/admin/commandes/${cmd.id}`)
      toast.success('Commande supprimée')
      if (selected?.id === cmd.id) setDetailModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Commandes ({total})</h1>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input type="text" placeholder="Code ou client..." value={filtres.q}
            onChange={e => setFiltres(p => ({ ...p, q: e.target.value }))}
            className="input-field pl-9 text-sm w-48" />
        </div>
        <select value={filtres.statut} onChange={e => setFiltres(p => ({ ...p, statut: e.target.value }))}
          className="input-field text-sm">
          <option value="">Tous les statuts</option>
          {STATUTS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filtres.jour} onChange={e => setFiltres(p => ({ ...p, jour: e.target.value }))}
          className="input-field text-sm">
          <option value="">Tous les jours</option>
          {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(j => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Client', 'Date', 'Livraison', 'Total', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-display font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commandes.map(cmd => {
                const st = STATUTS[cmd.statut] || { label: cmd.statut, color: 'bg-gray-100 text-gray-700' }
                return (
                  <tr key={cmd.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-display font-bold text-primary-600 text-sm">{cmd.code_commande}</td>
                    <td className="px-3 py-3 text-sm font-body text-gray-700">{cmd.client_nom || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 font-body">
                      {new Date(cmd.date_commande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 font-body">
                      {cmd.jour_livraison}<br />{cmd.tranche_horaire}
                    </td>
                    <td className="px-3 py-3 font-display font-bold text-sm text-gray-900">{formatPrix(cmd.total)}</td>
                    <td className="px-3 py-3">
                      <select value={cmd.statut}
                        onChange={e => changerStatut(cmd.id, e.target.value)}
                        className={`text-xs font-display font-semibold px-2 py-1 rounded-full border-0 ${st.color} cursor-pointer`}>
                        {STATUTS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openDetail(cmd)} className="p-1.5 text-gray-400 hover:text-primary-600" title="Voir détails">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => imprimerRecu(cmd)} className="p-1.5 text-gray-400 hover:text-gray-700" title="Imprimer reçu">
                          <Printer size={15} />
                        </button>
                        {cmd.client_whatsapp && (
                          <a href={`https://wa.me/${cmd.client_whatsapp.replace(/\D/g, '')}?text=Bonjour%20${cmd.client_nom}%2C%20votre%20commande%20${cmd.code_commande}...`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-green-600" title="WhatsApp">
                            <MessageCircle size={15} />
                          </a>
                        )}
                        {cmd.statut !== 'LIVREE' && (
                          <button onClick={() => supprimer(cmd)} className="p-1.5 text-gray-400 hover:text-red-600" title="Supprimer">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {commandes.length === 0 && <div className="text-center py-12 text-gray-400 font-body">Aucune commande</div>}
      </div>

      {/* Détail commande */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={`Commande ${selected?.code_commande || '...'}`} size="lg">
        {selected
          ? <DetailCommande commande={selected} onChangerStatut={changerStatut} onImprimer={imprimerRecu} onSupprimer={supprimer} />
          : <div className="flex justify-center py-10"><span className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" /></div>
        }
      </Modal>
    </div>
  )
}

function DetailCommande({ commande, onChangerStatut, onImprimer, onSupprimer }) {
  const statut = STATUTS[commande.statut] || { label: commande.statut, color: 'bg-gray-100 text-gray-700' }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`text-sm font-display font-semibold px-3 py-1 rounded-full ${statut.color}`}>{statut.label}</span>
        <div className="flex gap-2">
          <select value={commande.statut} onChange={e => onChangerStatut(commande.id, e.target.value)}
            className="input-field text-sm py-1.5">
            {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => onImprimer(commande)}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-display font-semibold px-3 py-1.5 rounded-lg transition-colors">
            <Printer size={14} /> Imprimer
          </button>
          {commande.statut !== 'LIVREE' && (
            <button onClick={() => onSupprimer(commande)}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-display font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 size={14} /> Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-body">
        <div><span className="text-gray-400">Client :</span> <span className="text-gray-900">{commande.client_nom}</span></div>
        <div><span className="text-gray-400">Téléphone :</span> <span className="text-gray-900">{commande.client_telephone}</span></div>
        <div><span className="text-gray-400">WhatsApp :</span> <span className="text-gray-900">{commande.client_whatsapp || '—'}</span></div>
        <div><span className="text-gray-400">Email :</span> <span className="text-gray-900">{commande.client_email || '—'}</span></div>
        <div><span className="text-gray-400">Livraison :</span> <span className="text-gray-900">{commande.jour_livraison} — {commande.tranche_horaire}</span></div>
        <div><span className="text-gray-400">Poids :</span> <span className="text-gray-900">{formatPoids(commande.poids_total_kg)}</span></div>
      </div>

      {commande.adresse && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-body mb-1">Adresse de livraison</p>
          <p className="text-sm text-gray-800 font-body">{commande.adresse.description_lieu}</p>
        </div>
      )}

      {commande.note_livraison && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-body mb-1">Note de livraison</p>
          <p className="text-sm text-gray-800 font-body">{commande.note_livraison}</p>
        </div>
      )}

      {commande.lignes && (
        <div>
          <h4 className="font-display font-semibold text-sm text-gray-700 mb-2">Articles</h4>
          <div className="space-y-2">
            {commande.lignes.map((l, i) => (
              <div key={i} className="flex justify-between text-sm font-body">
                <span>{l.produit?.nom} × {l.quantite} {l.est_prix_gros ? '(prix gros)' : ''}</span>
                <span className="font-semibold">{formatPrix(l.sous_total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-3 space-y-1 text-sm font-body">
        <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{formatPrix(commande.sous_total)}</span></div>
        <div className="flex justify-between text-gray-600"><span>Frais de livraison</span><span>{formatPrix(commande.frais_livraison)}</span></div>
        <div className="flex justify-between font-display font-bold text-base text-gray-900">
          <span>Total à collecter</span><span className="text-primary-600">{formatPrix(commande.total)}</span>
        </div>
      </div>
    </div>
  )
}
