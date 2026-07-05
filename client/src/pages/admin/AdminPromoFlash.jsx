import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, MessageCircle, Eye } from 'lucide-react'
import api from '../../lib/api'
import { getImageUrl } from '../../lib/imageUrl'
import Modal from '../../components/ui/Modal'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminPromoFlash() {
  const [vendeurs, setVendeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)

  const load = () => {
    api.get('/promoflash/admin/vendeurs')
      .then(r => { setVendeurs(r.data.vendeurs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleValidation = async (v) => {
    const valide = !v.valide_admin
    await api.put(`/promoflash/admin/vendeurs/${v.id}`, { valide_admin: valide })
    toast.success(valide ? 'Compte vendeur validé' : 'Validation retirée')
    load()
  }

  const toggleActif = async (v) => {
    await api.put(`/promoflash/admin/vendeurs/${v.id}`, { actif: !v.actif })
    toast.success(v.actif ? 'Vendeur désactivé' : 'Vendeur activé')
    load()
  }

  const voirFiche = async (v) => {
    // Charger les produits du vendeur
    const r = await api.get(`/promoflash/vendeurs/${v.id}/produits`)
    setSelected({ ...v, produits: r.data.produits || [] })
    setModal(true)
  }

  if (loading) return <PageLoader />

  const enAttente = vendeurs.filter(v => v.actif && !v.valide_admin)
  const valides = vendeurs.filter(v => v.actif && v.valide_admin)
  const desactives = vendeurs.filter(v => !v.actif)

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">PromoFlash — Vendeurs</h1>

      {/* En attente de validation */}
      {enAttente.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-semibold text-base text-orange-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            En attente de validation ({enAttente.length})
          </h2>
          <div className="space-y-2">
            {enAttente.map(v => <CarteVendeur key={v.id} vendeur={v} onValider={toggleValidation} onActif={toggleActif} onVoir={voirFiche} />)}
          </div>
        </div>
      )}

      {/* Validés */}
      {valides.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-semibold text-base text-green-700 mb-3">
            Vendeurs actifs et validés ({valides.length})
          </h2>
          <div className="space-y-2">
            {valides.map(v => <CarteVendeur key={v.id} vendeur={v} onValider={toggleValidation} onActif={toggleActif} onVoir={voirFiche} />)}
          </div>
        </div>
      )}

      {/* Désactivés */}
      {desactives.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base text-gray-500 mb-3">
            Désactivés ({desactives.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {desactives.map(v => <CarteVendeur key={v.id} vendeur={v} onValider={toggleValidation} onActif={toggleActif} onVoir={voirFiche} />)}
          </div>
        </div>
      )}

      {vendeurs.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-body">
          Aucun vendeur PromoFlash inscrit pour le moment.
        </div>
      )}

      {/* Modal fiche vendeur */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={selected?.nom} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm font-body">
              <div><span className="text-gray-400">Type :</span> <span className="font-semibold capitalize">{selected.type_vendeur}</span></div>
              <div><span className="text-gray-400">Téléphone :</span> <span>{selected.telephone}</span></div>
              <div><span className="text-gray-400">Inscrit le :</span> <span>{new Date(selected.date_inscription).toLocaleDateString('fr-FR')}</span></div>
              <div><span className="text-gray-400">Produits actifs :</span> <span className="font-semibold text-purple-600">{selected.nb_produits}</span></div>
            </div>

            {selected.adresse_description && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Adresse</p>
                <p className="text-sm text-gray-700 font-body">{selected.adresse_description}</p>
              </div>
            )}

            {selected.description && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700 font-body">{selected.description}</p>
              </div>
            )}

            {selected.photo_url && (
              <img src={getImageUrl(selected.photo_url)} alt="" className="w-full h-40 object-cover rounded-xl" />
            )}

            {/* Produits */}
            {selected.produits?.length > 0 && (
              <div>
                <p className="text-sm font-display font-semibold text-gray-700 mb-2">Produits en promo ({selected.produits.length})</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.produits.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 text-sm font-body">
                      <span className="text-gray-800 truncate flex-1">{p.nom}</span>
                      <span className="text-purple-600 font-semibold ml-2 flex-shrink-0">{Number(p.prix_promo_debut).toLocaleString('fr-FR')} FCFA</span>
                      <span className={`ml-2 text-xs flex-shrink-0 ${new Date(p.date_expiration) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                        {new Date(p.date_expiration) < new Date() ? 'Expiré' : `→ ${new Date(p.date_expiration).toLocaleDateString('fr-FR')}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => { toggleValidation(selected); setModal(false) }}
                className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors ${
                  selected.valide_admin
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}>
                {selected.valide_admin ? 'Retirer la validation' : 'Valider ce vendeur'}
              </button>
              <button onClick={() => { toggleActif(selected); setModal(false) }}
                className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors ${
                  selected.actif ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {selected.actif ? 'Désactiver' : 'Réactiver'}
              </button>
              {selected.telephone && (
                <a href={`https://wa.me/${selected.telephone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm hover:bg-green-700 transition-colors">
                  <MessageCircle size={15} /> WA
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function CarteVendeur({ vendeur, onValider, onActif, onVoir }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      {vendeur.photo_url ? (
        <img src={getImageUrl(vendeur.photo_url)} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-purple-600 font-display font-bold text-lg">{vendeur.nom?.[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-gray-900 text-sm truncate">{vendeur.nom}</p>
        <p className="text-xs text-gray-500 font-body">{vendeur.type_vendeur} — {vendeur.telephone}</p>
        <p className="text-xs text-purple-600 font-body">{vendeur.nb_produits || 0} produit(s)</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onVoir(vendeur)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Voir fiche">
          <Eye size={16} />
        </button>
        <button onClick={() => onValider(vendeur)}
          className={`p-2 transition-colors ${vendeur.valide_admin ? 'text-green-500 hover:text-orange-500' : 'text-gray-300 hover:text-green-500'}`}
          title={vendeur.valide_admin ? 'Retirer validation' : 'Valider'}>
          <CheckCircle size={18} />
        </button>
        <button onClick={() => onActif(vendeur)}
          className={`p-2 transition-colors ${vendeur.actif ? 'text-gray-300 hover:text-red-500' : 'text-red-300 hover:text-green-500'}`}
          title={vendeur.actif ? 'Désactiver' : 'Activer'}>
          <XCircle size={18} />
        </button>
      </div>
    </div>
  )
}
