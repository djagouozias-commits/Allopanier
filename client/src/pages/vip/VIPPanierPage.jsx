import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, Crown, ShoppingBag, ArrowRight } from 'lucide-react'
import useVIPCartStore from '../../store/useVIPCartStore'
import useAuthStore from '../../store/useAuthStore'
import { formatPrix, formatPoids } from '../../lib/utils'
import { calculerFraisLivraison } from '../../store/useCartStore'
import { getImageUrl } from '../../lib/imageUrl'
import toast from 'react-hot-toast'

export default function VIPPanierPage() {
  const { user } = useAuthStore()
  const { items, updateQuantite, removeItem, getItemsAvecPrix, getSousTotal, getPoidsTotal } = useVIPCartStore()
  const navigate = useNavigate()

  const itemsAvecPrix = getItemsAvecPrix()
  const sousTotal = getSousTotal()
  const poidsTotal = getPoidsTotal()
  const fraisLivraison = calculerFraisLivraison(poidsTotal)
  const total = sousTotal + fraisLivraison

  const handleCommander = () => {
    if (!user) { toast.error('Connectez-vous pour commander'); navigate('/connexion'); return }
    if (sousTotal < 500) { toast.error('Montant minimum : 500 FCFA'); return }
    navigate('/vip/commande')
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Crown size={64} style={{ color: 'rgba(212,175,55,0.2)', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 22, marginBottom: 8 }}>
            Votre panier VIP est vide
          </h2>
          <p style={{ color: '#8a8a9a', fontFamily: 'Inter', marginBottom: 24 }}>
            Découvrez notre sélection exclusive
          </p>
          <Link to="/vip" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
            background: 'linear-gradient(135deg, #D4AF37, #C09A2F)',
            borderRadius: 12, color: '#1a1a2e', fontFamily: 'Poppins', fontWeight: 700,
            textDecoration: 'none', fontSize: 14
          }}>
            <Crown size={16} /> Retour à l'espace VIP
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '20px 0', background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
          <Crown size={22} style={{ color: '#D4AF37' }} />
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 20, margin: 0 }}>
            Panier VIP
          </h1>
          <span style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 13 }}>
            {items.length} article{items.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Articles */}
          <div className="lg:col-span-2 space-y-3">
            {itemsAvecPrix.map(item => (
              <div key={item.id} style={{
                background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 14, padding: 16,
                display: 'flex', alignItems: 'flex-start', gap: 12
              }}>
                {/* Image */}
                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', background: '#0a0a0f', flexShrink: 0, position: 'relative' }}>
                  <img src={getImageUrl(item.produit.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 1, right: 2, fontSize: '7px', color: 'rgba(212,175,55,0.6)', fontWeight: 700 }}>AP</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#E8D5A3', fontSize: 14, margin: '0 0 4px' }}>
                    {item.produit.nom}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {/* Quantité */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => updateQuantite(item.id, item.quantite - 1)}
                        style={{ width: 32, height: 32, background: 'rgba(212,175,55,0.1)', border: 'none', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ width: 36, textAlign: 'center', fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 13 }}>
                        {item.quantite}
                      </span>
                      <button onClick={() => updateQuantite(item.id, item.quantite + 1)}
                        style={{ width: 32, height: 32, background: 'rgba(212,175,55,0.1)', border: 'none', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Prix */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 16, margin: 0 }}>
                        {formatPrix(item.sousTotal)}
                      </p>
                      <p style={{ color: '#666', fontFamily: 'Inter', fontSize: 11, margin: 0 }}>
                        {formatPrix(item.prixUnitaire)} / u.
                      </p>
                    </div>

                    <button onClick={() => removeItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.5)', padding: 4 }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 16, padding: 20, height: 'fit-content',
            position: 'sticky', top: 80
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Crown size={16} style={{ color: '#D4AF37' }} />
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 16, margin: 0 }}>
                Récapitulatif VIP
              </h2>
            </div>

            <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: 12, marginBottom: 12, fontSize: 13, fontFamily: 'Inter' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8a9a', marginBottom: 6 }}>
                <span>Sous-total</span><span style={{ color: '#E8D5A3', fontWeight: 600 }}>{formatPrix(sousTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8a9a', marginBottom: 6 }}>
                <span>Poids total</span><span style={{ color: '#E8D5A3', fontWeight: 600 }}>{formatPoids(poidsTotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8a9a' }}>
                <span>Frais de livraison</span><span style={{ color: '#E8D5A3', fontWeight: 600 }}>{formatPrix(fraisLivraison)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 800, fontSize: 17, marginBottom: 16 }}>
              <span style={{ color: '#E8D5A3' }}>Total</span>
              <span style={{ color: '#D4AF37' }}>{formatPrix(total)}</span>
            </div>

            <button onClick={handleCommander} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #D4AF37, #C09A2F)',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontFamily: 'Poppins', fontWeight: 800, fontSize: 14,
              color: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              Confirmer la commande VIP <ArrowRight size={16} />
            </button>

            <p style={{ textAlign: 'center', color: '#666', fontFamily: 'Inter', fontSize: 11, marginTop: 10 }}>
              Paiement en espèces à la livraison
            </p>

            <Link to="/vip" style={{
              display: 'block', textAlign: 'center', color: 'rgba(212,175,55,0.6)',
              fontFamily: 'Inter', fontSize: 12, marginTop: 12, textDecoration: 'none'
            }}>
              Continuer mes achats VIP
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
