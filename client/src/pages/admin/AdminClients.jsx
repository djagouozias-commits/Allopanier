import React, { useEffect, useState } from 'react'
import { Search, Eye, Ban, MessageCircle, Trash2, Phone, Key, Save } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix } from '../../lib/utils'
import Modal from '../../components/ui/Modal'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, page })
    if (q) params.append('q', q)
    api.get(`/admin/clients?${params}`).then(r => {
      setClients(r.data.clients || [])
      setTotal(r.data.total || 0)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(load, [q, page])

  const openFiche = async (c) => {
    const r = await api.get(`/admin/clients/${c.id}`)
    setSelected(r.data.client)
    setModal(true)
  }

  const toggleBloc = async (c) => {
    if (!window.confirm(`${c.actif ? 'Bloquer' : 'Débloquer'} ce client ?`)) return
    await api.put(`/admin/clients/${c.id}`, { actif: !c.actif })
    toast.success(c.actif ? 'Client bloqué' : 'Client débloqué')
    load()
  }

  const supprimer = async (c) => {
    if (!window.confirm(`Supprimer définitivement ${c.nom} ?`)) return
    try {
      await api.delete(`/admin/clients/${c.id}`)
      toast.success('Client supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  if (loading && clients.length === 0) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Clients ({total})</h1>
      </div>

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input type="text" placeholder="Rechercher..." value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }} className="input-field pl-9 text-sm" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nom', 'Téléphone', 'Mot de passe', 'Type', 'Inscrit le', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-sm font-display font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-display font-semibold text-gray-900 text-sm">{c.nom}</td>
                  <td className="px-3 py-3 text-sm text-gray-600 font-body">
                    <a href={`tel:${c.telephone}`} className="hover:text-primary-600">{c.telephone}</a>
                  </td>
                  <td className="px-3 py-3 text-sm font-mono text-gray-700">
                    {c.mot_de_passe_clair || <span className="text-gray-400 italic font-body">Non enregistré</span>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-500 font-body capitalize">{c.type_client}</td>
                  <td className="px-3 py-3 text-sm text-gray-400 font-body">
                    {new Date(c.date_inscription).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-sm font-display font-semibold px-2 py-0.5 rounded-full ${c.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {c.actif ? 'Actif' : 'Bloqué'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openFiche(c)} className="p-1.5 text-gray-400 hover:text-primary-600" title="Fiche client">
                        <Eye size={15} />
                      </button>
                      <a href={`tel:${c.telephone}`} className="p-1.5 text-gray-400 hover:text-blue-600" title="Appeler">
                        <Phone size={15} />
                      </a>
                      {c.whatsapp && (
                        <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-green-600" title="WhatsApp">
                          <MessageCircle size={15} />
                        </a>
                      )}
                      <button onClick={() => toggleBloc(c)} className="p-1.5 text-gray-400 hover:text-orange-500" title={c.actif ? 'Bloquer' : 'Débloquer'}>
                        <Ban size={15} />
                      </button>
                      <button onClick={() => supprimer(c)} className="p-1.5 text-gray-400 hover:text-red-600" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && <div className="text-center py-12 text-gray-400 font-body">Aucun client</div>}

        {total > LIMIT && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-body disabled:opacity-40">Préc.</button>
            <span className="px-3 py-1.5 text-sm text-gray-600 font-body">Page {page} / {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
              className="px-3 py-1.5 border border-gray-200 rounded text-sm font-body disabled:opacity-40">Suiv.</button>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Fiche client" size="lg">
        {selected && (
          <FicheClient
            client={selected}
            onUpdate={(updated) => { setSelected(updated); load() }}
          />
        )}
      </Modal>
    </div>
  )
}

function FicheClient({ client, onUpdate }) {
  const [mdp, setMdp] = useState(client.mot_de_passe_clair || '')
  const [saving, setSaving] = useState(false)

  const enregistrerMdp = async () => {
    if (!mdp || mdp.length < 6) { toast.error('Mot de passe min. 6 caractères'); return }
    setSaving(true)
    try {
      await api.put(`/admin/clients/${client.id}`, { mot_de_passe: mdp })
      toast.success('Mot de passe mis à jour')
      const r = await api.get(`/admin/clients/${client.id}`)
      onUpdate(r.data.client)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 text-sm font-body">
        <div><span className="text-gray-400">Nom :</span> <span className="font-semibold text-gray-900">{client.nom}</span></div>
        <div>
          <span className="text-gray-400">Téléphone :</span>{' '}
          <a href={`tel:${client.telephone}`} className="text-primary-600 font-semibold hover:underline">{client.telephone}</a>
        </div>
        <div><span className="text-gray-400">WhatsApp :</span> <span className="text-gray-900">{client.whatsapp || '—'}</span></div>
        <div><span className="text-gray-400">Email :</span> <span className="text-gray-900">{client.email || '—'}</span></div>
        <div><span className="text-gray-400">Type :</span> <span className="text-gray-900 capitalize">{client.type_client}</span></div>
        <div><span className="text-gray-400">Total acheté :</span> <span className="font-bold text-primary-600">{formatPrix(client.total_achats || 0)}</span></div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Key size={16} className="text-amber-700" />
          <h4 className="font-display font-semibold text-sm text-amber-800">Mot de passe du client</h4>
        </div>
        <p className="text-sm text-amber-700 font-body mb-3">
          {client.mot_de_passe_clair
            ? 'Mot de passe enregistré à l\'inscription. Modifiez-le puis appelez le client pour le lui communiquer.'
            : 'Mot de passe non enregistré (compte créé avant cette fonction). Définissez-en un nouveau et appelez le client.'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={mdp}
            onChange={e => setMdp(e.target.value)}
            placeholder="Nouveau mot de passe (min. 6 car.)"
            className="input-field text-sm flex-1 font-mono"
          />
          <button onClick={enregistrerMdp} disabled={saving}
            className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            <Save size={14} /> {saving ? '...' : 'Enregistrer'}
          </button>
        </div>
        <a href={`tel:${client.telephone}`}
          className="inline-flex items-center gap-2 mt-3 text-sm text-primary-600 hover:text-primary-700 font-display font-semibold">
          <Phone size={14} /> Appeler {client.telephone}
        </a>
      </div>

      {client.adresses?.length > 0 && (
        <div>
          <h4 className="font-display font-semibold text-sm text-gray-700 mb-2">Adresses</h4>
          {client.adresses.map(a => (
            <div key={a.id} className="bg-gray-50 rounded-lg p-3 mb-2">
              <p className="text-sm text-gray-400">{a.libelle || 'Adresse'}</p>
              <p className="text-sm text-gray-800 font-body">{a.description_lieu}</p>
              {a.latitude && <p className="text-sm text-gray-400">GPS: {parseFloat(a.latitude).toFixed(4)}, {parseFloat(a.longitude).toFixed(4)}</p>}
            </div>
          ))}
        </div>
      )}

      {client.dernieres_commandes?.length > 0 && (
        <div>
          <h4 className="font-display font-semibold text-sm text-gray-700 mb-2">Dernières commandes</h4>
          <div className="space-y-2">
            {client.dernieres_commandes.map(c => (
              <div key={c.id} className="flex justify-between text-sm font-body text-gray-700">
                <span className="text-primary-600 font-semibold">{c.code_commande}</span>
                <span>{new Date(c.date_commande).toLocaleDateString('fr-FR')}</span>
                <span className="font-semibold">{formatPrix(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
