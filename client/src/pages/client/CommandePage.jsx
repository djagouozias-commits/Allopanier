import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, AlertTriangle } from 'lucide-react'
import useCartStore, { calculerFraisLivraison } from '../../store/useCartStore'
import useAuthStore from '../../store/useAuthStore'
import { formatPrix, formatPoids, TOUS_JOURS, estJourExceptionnel, estCreneauBloque, getCreneauxBloquesAujourdhui, jourActuel, labelCreneau } from '../../lib/utils'
import api from '../../lib/api'
import MapModal from '../../components/ui/MapModal'
import ModalPaiement from '../../components/ui/ModalPaiement'
import toast from 'react-hot-toast'

export default function CommandePage() {
  const { user } = useAuthStore()
  const { getItemsWithPrix, getSousTotal, getPoidsTotal, clearCart } = useCartStore()
  const navigate = useNavigate()

  const [adresses, setAdresses] = useState([])
  const [adresseId, setAdresseId] = useState('')
  const [jour, setJour] = useState('Mardi')
  const [tranche, setTranche] = useState('8h-12h')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalPaiementOpen, setModalPaiementOpen] = useState(false)

  // Nouvelle adresse
  const [showNouvAddr, setShowNouvAddr] = useState(false)
  const [nouvAddr, setNouvAddr] = useState({ libelle: '', description_lieu: '', latitude: null, longitude: null })
  const [mapOpen, setMapOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState(null) // 'nouvelle' | adresseId string

  const items = getItemsWithPrix()
  const sousTotal = getSousTotal()
  const poidsTotal = getPoidsTotal()
  const jourExcep = estJourExceptionnel(jour)
  const bloquesAujourdhui = getCreneauxBloquesAujourdhui()
  const creneauActuelBloque = estCreneauBloque(jour, tranche)
  const fraisLivraison = calculerFraisLivraison(poidsTotal, jourExcep)
  const total = sousTotal + fraisLivraison

  useEffect(() => {
    api.get('/clients/adresses').then(r => {
      const list = r.data.adresses || []
      setAdresses(list)
      const principale = list.find(a => a.principale) || list[0]
      if (principale) setAdresseId(String(principale.id))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const auj = jourActuel()
    setJour(auj)
    if (!estCreneauBloque(auj, '8h-12h')) setTranche('8h-12h')
    else if (!estCreneauBloque(auj, '14h-18h')) setTranche('14h-18h')
  }, [])

  const ouvrirCarteAdresse = (adresse) => {
    setMapTarget(String(adresse.id))
    setMapOpen(true)
  }

  // Ouvrir carte pour la nouvelle adresse
  const ouvrirCarteNouvelle = () => {
    setMapTarget('nouvelle')
    setMapOpen(true)
  }

  // Callback validation carte
  const handleValidatePosition = async ({ lat, lng }) => {
    if (mapTarget === 'nouvelle') {
      setNouvAddr(p => ({ ...p, latitude: lat, longitude: lng }))
      toast.success('Position enregistrée')
    } else {
      // Mettre à jour l'adresse existante
      try {
        await api.put(`/clients/adresses/${mapTarget}`, {
          latitude: lat,
          longitude: lng,
        })
        const r = await api.get('/clients/adresses')
        setAdresses(r.data.adresses)
        toast.success('Position mise à jour')
      } catch { toast.error('Erreur mise à jour position') }
    }
    setMapTarget(null)
  }

  const ajouterAdresse = async () => {
    if (!nouvAddr.description_lieu.trim()) { toast.error('Décrivez le lieu'); return }
    try {
      const r = await api.post('/clients/adresses', {
        libelle: nouvAddr.libelle || 'Nouvelle adresse',
        description_lieu: nouvAddr.description_lieu,
        latitude: nouvAddr.latitude,
        longitude: nouvAddr.longitude,
        principale: false,
      })
      const updated = await api.get('/clients/adresses')
      setAdresses(updated.data.adresses)
      setAdresseId(String(r.data.adresse.id))
      setShowNouvAddr(false)
      setNouvAddr({ libelle: '', description_lieu: '', latitude: null, longitude: null })
      toast.success('Adresse ajoutée')
    } catch { toast.error("Erreur lors de l'ajout") }
  }

  const handleCommander = () => {
    if (!adresseId) { toast.error('Sélectionnez une adresse de livraison'); return }
    if (items.length === 0) { toast.error('Votre panier est vide'); return }
    if (sousTotal < 500) { toast.error('Montant minimum : 500 FCFA'); return }
    if (estCreneauBloque(jour, tranche)) {
      toast.error(`Livraison ${jour} (${labelCreneau(tranche)}) indisponible — tournée déjà commencée`)
      return
    }
    setModalPaiementOpen(true)
  }

  const handleConfirmerAvecPaiement = async (mode_paiement, statut_paiement) => {
    setLoading(true)
    try {
      const lignes = items.map(item => ({
        produit_id: item.produit.id,
        type_achat: item.type,
        quantite: item.quantite,
        prix_unitaire_applique: Number(item.prixUnitaire),
        est_prix_gros: Boolean(item.estPrixGros),
        sous_total: Number(item.sousTotal),
        poids_total_kg: Number(item.poids) || 0,
      }))

      const payload = {
        adresse_id: parseInt(adresseId),
        jour_livraison: jour,
        tranche_horaire: tranche,
        est_jour_exceptionnel: Boolean(jourExcep),
        sous_total: Number(sousTotal),
        poids_total_kg: Number(poidsTotal) || 0,
        frais_livraison: Number(fraisLivraison),
        total: Number(total),
        note_livraison: note || null,
        lignes,
        mode_paiement,
        statut_paiement,
      }

      const r = await api.post('/commandes', payload)
      clearCart()
      setModalPaiementOpen(false)
      navigate(`/confirmation/${r.data.commande.code_commande}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // Trouver la position initiale pour la carte selon la cible
  const getMapInitPos = () => {
    if (mapTarget === 'nouvelle') {
      return { lat: nouvAddr.latitude, lng: nouvAddr.longitude }
    }
    const addr = adresses.find(a => String(a.id) === mapTarget)
    return { lat: addr?.latitude ? parseFloat(addr.latitude) : null, lng: addr?.longitude ? parseFloat(addr.longitude) : null }
  }

  const mapInitPos = getMapInitPos()

  return (
    <>
      <MapModal
        isOpen={mapOpen}
        onClose={() => { setMapOpen(false); setMapTarget(null) }}
        title={mapTarget === 'nouvelle' ? 'Position de la nouvelle adresse' : 'Modifier la position de livraison'}
        initialLat={mapInitPos.lat}
        initialLng={mapInitPos.lng}
        onValidate={handleValidatePosition}
      />
      <ModalPaiement
        isOpen={modalPaiementOpen}
        total={total}
        loading={loading}
        onConfirmer={handleConfirmerAvecPaiement}
        onFermer={() => setModalPaiementOpen(false)}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Passer la commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Adresse de livraison */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-primary-600" /> Adresse de livraison
              </h2>

              {adresses.length > 0 ? (
                <div className="space-y-2">
                  {adresses.map(a => (
                    <label key={a.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        String(adresseId) === String(a.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="adresse" value={a.id}
                        checked={String(adresseId) === String(a.id)}
                        onChange={() => setAdresseId(String(a.id))} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm text-gray-900">{a.libelle || 'Adresse'}</p>
                        <p className="text-sm text-gray-600 font-body">{a.description_lieu}</p>
                        {a.latitude ? (
                          <p className="text-xs text-green-600 font-body mt-0.5">
                            Position GPS enregistrée
                          </p>
                        ) : (
                          <p className="text-xs text-orange-500 font-body mt-0.5">
                            Pas encore de position GPS
                          </p>
                        )}
                      </div>
                      {/* Bouton modifier position */}
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); ouvrirCarteAdresse(a) }}
                        className="flex-shrink-0 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-display font-semibold bg-primary-50 hover:bg-primary-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <MapPin size={12} />
                        {a.latitude ? 'Modifier GPS' : 'Ajouter GPS'}
                      </button>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 font-body">Aucune adresse enregistrée.</p>
              )}

              <button onClick={() => setShowNouvAddr(!showNouvAddr)}
                className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:underline font-display font-semibold">
                <Plus size={15} /> Utiliser une autre adresse
              </button>

              {showNouvAddr && (
                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  <input type="text" placeholder="Libellé (ex: Bureau, Famille...)"
                    value={nouvAddr.libelle}
                    onChange={e => setNouvAddr(p => ({ ...p, libelle: e.target.value }))}
                    className="input-field" />
                  <textarea rows={2} placeholder="Description du lieu (obligatoire)"
                    value={nouvAddr.description_lieu}
                    onChange={e => setNouvAddr(p => ({ ...p, description_lieu: e.target.value }))}
                    className="input-field resize-none" />

                  {/* Bouton carte plein écran */}
                  <button type="button" onClick={ouvrirCarteNouvelle}
                    className={`w-full flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-4 transition-colors ${
                      nouvAddr.latitude
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-400 text-gray-500 hover:text-primary-600'
                    }`}>
                    <MapPin size={18} className={nouvAddr.latitude ? 'text-primary-600' : 'text-gray-400'} />
                    <div className="text-left">
                      {nouvAddr.latitude ? (
                        <>
                          <p className="font-display font-semibold text-sm">Position GPS enregistrée</p>
                          <p className="text-xs font-body">{nouvAddr.latitude.toFixed(5)}, {nouvAddr.longitude.toFixed(5)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-display font-semibold text-sm">Indiquer la position sur la carte</p>
                          <p className="text-xs font-body">Ouvre une carte plein écran</p>
                        </>
                      )}
                    </div>
                  </button>

                  <button onClick={ajouterAdresse}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-display font-semibold px-5 py-2.5 rounded-lg transition-colors">
                    Enregistrer cette adresse
                  </button>
                </div>
              )}
            </div>

            {/* Jour et créneau */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-base text-gray-900 mb-4">Jour et créneau de livraison</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {TOUS_JOURS.map(j => {
                  const excep = estJourExceptionnel(j)
                  // Vérifier si TOUS les créneaux de ce jour sont bloqués
                  const tousCreneauxBloques = estCreneauBloque(j, '8h-12h') && estCreneauBloque(j, '14h-18h')
                  return (
                    <button key={j}
                      onClick={() => { if (!tousCreneauxBloques) setJour(j) }}
                      disabled={tousCreneauxBloques}
                      className={`p-3 rounded-xl border text-sm font-display font-semibold transition-colors text-center ${
                        tousCreneauxBloques
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                          : jour === j
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {j}
                      {tousCreneauxBloques
                        ? <span className="block text-xs text-red-400 font-normal mt-0.5">Clôturé</span>
                        : excep
                          ? <span className="block text-xs text-orange-500 font-normal mt-0.5">Frais ×3</span>
                          : <span className="block text-xs text-primary-400 font-normal mt-0.5">Standard</span>
                      }
                    </button>
                  )
                })}
              </div>

              {jourExcep && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
                  <p className="text-sm text-orange-700 font-body">
                    Livraison exceptionnelle — frais de livraison triplés ce jour
                  </p>
                </div>
              )}

              {bloquesAujourdhui.tranches.length > 0 && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-body">
                    Livraison en cours aujourd'hui ({bloquesAujourdhui.tranches.map(labelCreneau).join(', ')}).
                    Ces créneaux sont fermés aux nouvelles commandes.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {['8h-12h', '14h-18h'].map(t => {
                  const bloque = estCreneauBloque(jour, t)
                  return (
                    <button key={t} type="button" disabled={bloque}
                      onClick={() => !bloque && setTranche(t)}
                      className={`p-4 rounded-xl border text-sm font-display font-semibold transition-colors relative ${
                        bloque
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : tranche === t
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {t === '8h-12h' ? 'Matin — 8h à 12h' : 'Après-midi — 14h à 18h'}
                      {bloque && <span className="block text-xs font-normal mt-1 text-red-500">Tournée en cours</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Note */}
            <div className="card p-5">
              <h2 className="font-display font-bold text-base text-gray-900 mb-3">Instructions particulières</h2>
              <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Ex: Appeler avant d'arriver, livraison au 2e étage, code portail 1234..."
                className="input-field resize-none" />
              <a href={`https://wa.me/22968204654?text=Bonjour%20AlloPanier%2C%20j%27ai%20une%20demande%20sp%C3%A9ciale...`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-green-600 hover:underline font-body">
                Ou contactez-nous sur WhatsApp pour un cas particulier
              </a>
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="card p-5 sticky top-20 h-fit">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Votre commande</h2>

            <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm font-body text-gray-700">
                  <span className="truncate pr-2">{item.produit.nom} × {item.quantite}</span>
                  <span className="font-semibold flex-shrink-0">{formatPrix(item.sousTotal)}</span>
                </div>
              ))}
            </div>

            <hr className="border-gray-200 mb-3" />
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-semibold">{formatPrix(sousTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Poids total</span>
                <span className="font-semibold">{formatPoids(poidsTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison {jourExcep ? '(×3)' : ''}</span>
                <span className={`font-semibold ${jourExcep ? 'text-orange-600' : ''}`}>{formatPrix(fraisLivraison)}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between font-display font-bold text-base text-gray-900">
                <span>Total à payer</span>
                <span className="text-primary-600">{formatPrix(total)}</span>
              </div>
            </div>

            <button onClick={handleCommander} disabled={loading || creneauActuelBloque}
              className="w-full mt-5 bg-primary-600 hover:bg-primary-700 text-white font-display font-bold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-base">
              {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'En cours...' : 'Confirmer'}
            </button>

            <p className="text-center text-xs text-gray-400 font-body mt-3">
              Espèces à la livraison ou paiement mobile
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
