import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, RefreshCw, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import api from '../../lib/api'
import useVIPCartStore from '../../store/useVIPCartStore'
import toast from 'react-hot-toast'

function formatF(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA' }

const STATUTS = {
  EN_ATTENTE: { label: 'En attente', color: '#F59E0B' },
  CONFIRMEE: { label: 'Confirmée', color: '#3B82F6' },
  EN_LIVRAISON: { label: 'En livraison', color: '#F97316' },
  LIVREE: { label: 'Livrée', color: '#10B981' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
}

export default function VIPMesCommandesPage() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const addItem = useVIPCartStore(s => s.addItem)
  const clearCart = useVIPCartStore(s => s.clearCart)

  useEffect(() => {
    api.get('/vip/commandes/mes-commandes')
      .then(r => { setCommandes(r.data.commandes || []); setLoading(false) })
      .catch(() => setLoading(false))
    // Rafraîchir toutes les 30s
    const interval = setInterval(() => {
      api.get('/vip/commandes/mes-commandes').then(r => setCommandes(r.data.commandes || []))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)', padding: '0 0 40px' }}>
      <div style={{ borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '20px 0' }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center gap-3">
          <Crown size={22} style={{ color: '#D4AF37' }} />
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 20, margin: 0 }}>Mes commandes VIP</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : commandes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Crown size={48} style={{ color: 'rgba(212,175,55,0.15)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: '#8a8a9a', fontFamily: 'Inter' }}>Aucune commande VIP pour le moment</p>
            <Link to="/vip" style={{ display: 'inline-block', marginTop: 16, color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              Découvrir l'espace VIP
            </Link>
          </div>
        ) : commandes.map(cmd => {
          const st = STATUTS[cmd.statut] || { label: cmd.statut, color: '#D4AF37' }
          const isExp = expanded === cmd.id
          return (
            <div key={cmd.id} style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: 'Courier New', fontWeight: 900, color: '#D4AF37', fontSize: 16, letterSpacing: 2, margin: '0 0 3px' }}>{cmd.code_commande}</p>
                    <p style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 12, margin: 0 }}>
                      {new Date(cmd.date_commande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ background: `${st.color}20`, border: `1px solid ${st.color}40`, borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, ...(cmd.statut === 'EN_LIVRAISON' ? { animation: 'pulse 1s infinite' } : {}) }} />
                    <span style={{ color: st.color, fontFamily: 'Poppins', fontWeight: 700, fontSize: 12 }}>{st.label}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                  {[['Total', formatF(cmd.total)], ['Livraison', `${cmd.jour_livraison} ${cmd.tranche_horaire}`]].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Inter', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 2px' }}>{k}</p>
                      <p style={{ color: '#E8D5A3', fontFamily: 'Poppins', fontWeight: 700, fontSize: 13, margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>

                {cmd.statut === 'EN_LIVRAISON' && (
                  <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '8px 12px', marginTop: 12 }}>
                    <p style={{ color: '#F97316', fontFamily: 'Poppins', fontWeight: 700, fontSize: 12, margin: 0 }}>
                      Votre livreur est en route. Préparez {formatF(cmd.total)}.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                  <button onClick={() => setExpanded(isExp ? null : cmd.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(212,175,55,0.7)', fontFamily: 'Poppins', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {isExp ? 'Masquer' : 'Voir le détail'}
                  </button>
                </div>
              </div>

              {isExp && (
                <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.2)', padding: 14 }}>
                  {/* Code de retrait bien visible */}
                  <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', marginBottom: 12 }}>
                    <p style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Inter', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Code de retrait</p>
                    <p style={{ fontFamily: 'Courier New', fontWeight: 900, color: '#D4AF37', fontSize: 20, letterSpacing: 4, margin: 0 }}>{cmd.code_commande}</p>
                  </div>
                  <DetailCommandeVIP codeCommande={cmd.code_commande} />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

function DetailCommandeVIP({ codeCommande }) {
  const [detail, setDetail] = useState(null)
  useEffect(() => {
    api.get(`/vip/commandes/code/${codeCommande}`).then(r => setDetail(r.data.commande)).catch(() => {})
  }, [codeCommande])

  if (!detail) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}><span style={{ width: 20, height: 20, border: '2px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} /></div>

  return (
    <div style={{ fontSize: 13, fontFamily: 'Inter' }}>
      {detail.adresse?.description_lieu && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ color: 'rgba(212,175,55,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Adresse</p>
          <p style={{ color: '#E8D5A3', margin: 0 }}>{detail.adresse.description_lieu}</p>
        </div>
      )}
      {detail.lignes?.map((l, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8a9a', marginBottom: 5 }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{l.produit?.nom} × {l.quantite}</span>
          <span style={{ color: '#E8D5A3', fontWeight: 600 }}>{Number(l.sous_total).toLocaleString('fr-FR')} F</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid rgba(212,175,55,0.15)', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 15 }}>
        <span>Total</span><span>{Number(detail.total).toLocaleString('fr-FR')} FCFA</span>
      </div>
    </div>
  )
}
