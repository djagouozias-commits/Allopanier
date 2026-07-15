import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, MapPin, Plus, AlertTriangle } from 'lucide-react'
import useVIPCartStore from '../../store/useVIPCartStore'
import useAuthStore from '../../store/useAuthStore'
import { formatPrix, formatPoids, TOUS_JOURS, estJourExceptionnel } from '../../lib/utils'
import { calculerFraisLivraison } from '../../store/useCartStore'
import api from '../../lib/api'
import MapModal from '../../components/ui/MapModal'
import ModalPaiement from '../../components/ui/ModalPaiement'
import toast from 'react-hot-toast'

export default function VIPCommandePage() {
  const { user } = useAuthStore()
  const { getItemsAvecPrix, getSousTotal, getPoidsTotal, clearCart } = useVIPCartStore()
  const navigate = useNavigate()

  const [adresses, setAdresses] = useState([])
  const [adresseId, setAdresseId] = useState('')
  const [jour, setJour] = useState('Mardi')
  const [tranche, setTranche] = useState('8h-12h')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalPaiementOpen, setModalPaiementOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState(null)
  const [showNouvAddr, setShowNouvAddr] = useState(false)
  const [nouvAddr, setNouvAddr] = useState({ libelle: '', description_lieu: '', latitude: null, longitude: null })

  const items = getItemsAvecPrix()
  const sousTotal = getSousTotal()
  const poidsTotal = getPoidsTotal()
  const jourExcep = estJourExceptionnel(jour)
  const fraisLivraison = calculerFraisLivraison(poidsTotal, jourExcep)
  const total = sousTotal + fraisLivraison

  useEffect(() => {
    api.get('/clients/adresses').then(r => {
      const list = r.data.adresses || []
      setAdresses(list)
      const principale = list.find(a => a.principale) || list[0]
      if (principale) setAdresseId(String(principale.id))
    })
  }, [])

  const handleValiderPosition = async ({ lat, lng }) => {
    if (mapTarget === 'nouvelle') {
      setNouvAddr(p => ({ ...p, latitude: lat, longitude: lng }))
    } else {
      try {
        await api.put(`/clients/adresses/${mapTarget}`, { latitude: lat, longitude: lng })
        const r = await api.get('/clients/adresses')
        setAdresses(r.data.adresses)
        toast.success('Position mise à jour')
      } catch { toast.error('Erreur') }
    }
    setMapTarget(null)
  }

  const ajouterAdresse = async () => {
    if (!nouvAddr.description_lieu.trim()) { toast.error('Description requise'); return }
    try {
      const r = await api.post('/clients/adresses', { ...nouvAddr, libelle: nouvAddr.libelle || 'Adresse VIP', principale: false })
      const updated = await api.get('/clients/adresses')
      setAdresses(updated.data.adresses)
      setAdresseId(String(r.data.adresse.id))
      setShowNouvAddr(false)
      setNouvAddr({ libelle: '', description_lieu: '', latitude: null, longitude: null })
      toast.success('Adresse ajoutée')
    } catch { toast.error('Erreur') }
  }

  const handleCommander = () => {
    if (!adresseId) { toast.error('Sélectionnez une adresse'); return }
    if (items.length === 0) { toast.error('Panier vide'); return }
    if (sousTotal < 500) { toast.error('Montant minimum : 500 FCFA'); return }
    setModalPaiementOpen(true)
  }

  const handleConfirmerAvecPaiement = async (mode_paiement, statut_paiement) => {
    setLoading(true)
    try {
      const lignes = items.map(item => ({
        produit_id: parseInt(item.produit.id.toString().replace('vip-', '')),
        type_achat: item.type,
        quantite: item.quantite,
        prix_unitaire_applique: Number(item.prixUnitaire),
        sous_total: Number(item.sousTotal),
        poids_total_kg: Number(item.poids) || 0,
        nom_produit: item.produit.nom, // stocker le nom pour éviter les mélanges
      }))
      const r = await api.post('/vip/commandes', {
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
      })
      clearCart()
      setModalPaiementOpen(false)
      navigate(`/vip/confirmation/${r.data.commande.code_commande}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande')
    } finally { setLoading(false) }
  }

  const mapInitPos = () => {
    if (mapTarget === 'nouvelle') return { lat: nouvAddr.latitude, lng: nouvAddr.longitude }
    const addr = adresses.find(a => String(a.id) === mapTarget)
    return { lat: addr?.latitude ? parseFloat(addr.latitude) : null, lng: addr?.longitude ? parseFloat(addr.longitude) : null }
  }

  return (
    <>
      <MapModal isOpen={mapOpen} onClose={() => { setMapOpen(false); setMapTarget(null) }}
        title="Position de livraison VIP"
        initialLat={mapInitPos().lat} initialLng={mapInitPos().lng}
        onValidate={handleValiderPosition} />
      <ModalPaiement
        isOpen={modalPaiementOpen}
        total={total}
        loading={loading}
        onConfirmer={handleConfirmerAvecPaiement}
        onFermer={() => setModalPaiementOpen(false)}
      />

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '20px 0' }}>
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
            <Crown size={22} style={{ color: '#D4AF37' }} />
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 20, margin: 0 }}>
              Finaliser la commande VIP
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* Adresse */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={16} /> Adresse de livraison
                </h2>

                {adresses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {adresses.map(a => (
                      <label key={a.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px',
                        borderRadius: 10, cursor: 'pointer',
                        border: String(adresseId) === String(a.id) ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                        background: String(adresseId) === String(a.id) ? 'rgba(212,175,55,0.08)' : 'transparent'
                      }}>
                        <input type="radio" name="adresse" value={a.id} checked={String(adresseId) === String(a.id)} onChange={() => setAdresseId(String(a.id))} style={{ marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#E8D5A3', fontSize: 13, margin: '0 0 2px' }}>{a.libelle || 'Adresse'}</p>
                          <p style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 12, margin: 0 }}>{a.description_lieu}</p>
                          {a.latitude && <p style={{ color: '#D4AF37', fontSize: 10, margin: '3px 0 0', fontFamily: 'Inter' }}>GPS enregistré</p>}
                        </div>
                        <button type="button" onClick={e => { e.preventDefault(); setMapTarget(String(a.id)); setMapOpen(true) }}
                          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#D4AF37', fontSize: 11, fontFamily: 'Poppins', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {a.latitude ? 'Modifier GPS' : 'Ajouter GPS'}
                        </button>
                      </label>
                    ))}
                  </div>
                )}

                <button onClick={() => setShowNouvAddr(!showNouvAddr)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                  <Plus size={14} /> Utiliser une autre adresse
                </button>

                {showNouvAddr && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(212,175,55,0.15)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input placeholder="Libellé (ex: Villa, Appartement...)" value={nouvAddr.libelle}
                      onChange={e => setNouvAddr(p => ({ ...p, libelle: e.target.value }))} className="input-field" />
                    <textarea rows={2} placeholder="Description du lieu" value={nouvAddr.description_lieu}
                      onChange={e => setNouvAddr(p => ({ ...p, description_lieu: e.target.value }))} className="input-field resize-none" />
                    <button type="button" onClick={() => { setMapTarget('nouvelle'); setMapOpen(true) }}
                      style={{
                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                        background: nouvAddr.latitude ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
                        border: nouvAddr.latitude ? '1px solid rgba(212,175,55,0.4)' : '2px dashed rgba(212,175,55,0.2)',
                        display: 'flex', alignItems: 'center', gap: 10, color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 600, fontSize: 13
                      }}>
                      <MapPin size={16} />
                      {nouvAddr.latitude ? `GPS : ${nouvAddr.latitude.toFixed(4)}, ${nouvAddr.longitude.toFixed(4)}` : 'Placer sur la carte'}
                    </button>
                    <button onClick={ajouterAdresse}
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #C09A2F)', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 700, fontSize: 13, color: '#1a1a2e', alignSelf: 'flex-start' }}>
                      Enregistrer cette adresse
                    </button>
                  </div>
                )}
              </div>

              {/* Jour et créneau */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 15, marginBottom: 14 }}>
                  Jour et créneau
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                  {TOUS_JOURS.map(j => {
                    const excep = estJourExceptionnel(j)
                    return (
                      <button key={j} onClick={() => setJour(j)}
                        style={{
                          padding: '10px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                          border: jour === j ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.08)',
                          background: jour === j ? 'rgba(212,175,55,0.12)' : 'transparent',
                          fontFamily: 'Poppins', fontWeight: 600, fontSize: 12,
                          color: jour === j ? '#D4AF37' : '#8a8a9a'
                        }}>
                        {j}
                        {excep && <div style={{ fontSize: 10, color: '#F97316', marginTop: 2 }}>×3</div>}
                      </button>
                    )
                  })}
                </div>
                {jourExcep && (
                  <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} style={{ color: '#F97316' }} />
                    <p style={{ color: '#F97316', fontFamily: 'Inter', fontSize: 12, margin: 0 }}>Livraison exceptionnelle — frais triplés</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['8h-12h', '14h-18h'].map(t => (
                    <button key={t} onClick={() => setTranche(t)}
                      style={{
                        padding: '12px', borderRadius: 10, cursor: 'pointer',
                        border: tranche === t ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.08)',
                        background: tranche === t ? 'rgba(212,175,55,0.12)' : 'transparent',
                        fontFamily: 'Poppins', fontWeight: 600, fontSize: 13,
                        color: tranche === t ? '#D4AF37' : '#8a8a9a'
                      }}>
                      {t === '8h-12h' ? 'Matin 8h – 12h' : 'Après-midi 14h – 18h'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: 20 }}>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 15, marginBottom: 10 }}>Instructions</h2>
                <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Instructions particulières pour la livraison..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, padding: '10px 12px', color: '#E8D5A3', fontFamily: 'Inter', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Récap */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: 16, padding: 20, height: 'fit-content',
              position: 'sticky', top: 80
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Crown size={16} style={{ color: '#D4AF37' }} />
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 15, margin: 0 }}>Votre commande</h2>
              </div>
              <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 14 }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'Inter', color: '#8a8a9a', marginBottom: 6 }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{item.produit.nom} × {item.quantite}</span>
                    <span style={{ color: '#E8D5A3', fontWeight: 600, flexShrink: 0 }}>{formatPrix(item.sousTotal)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(212,175,55,0.15)', paddingTop: 12, marginBottom: 12 }}>
                {[['Sous-total', formatPrix(sousTotal)], ['Livraison', formatPrix(fraisLivraison)]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'Inter', color: '#8a8a9a', marginBottom: 6 }}>
                    <span>{k}</span><span style={{ color: '#E8D5A3', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 800, fontSize: 17, marginBottom: 16 }}>
                <span style={{ color: '#E8D5A3' }}>Total</span>
                <span style={{ color: '#D4AF37' }}>{formatPrix(total)}</span>
              </div>
              <button onClick={handleCommander} disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg, #D4AF37, #C09A2F)',
                  border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Poppins', fontWeight: 800, fontSize: 14, color: '#1a1a2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                {loading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
