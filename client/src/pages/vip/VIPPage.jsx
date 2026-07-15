import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Search, ShoppingCart, X, ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react'
import api from '../../lib/api'
import useCartStore from '../../store/useCartStore'
import { formatPrix } from '../../lib/utils'
import { getImageUrl } from '../../lib/imageUrl'
import toast from 'react-hot-toast'

// ===================== LIGHTBOX PRODUIT VIP =====================
function LightboxVIP({ produit, onClose }) {
  const addItem = useCartStore(s => s.addItem)
  const medias = [
    ...(produit.video_url ? [{ type: 'video', url: produit.video_url }] : []),
    ...(produit.images_urls?.length ? produit.images_urls.map(u => ({ type: 'photo', url: u })) : produit.image_url ? [{ type: 'photo', url: produit.image_url }] : [])
  ]
  const [idx, setIdx] = useState(0)
  const [muted, setMuted] = useState(true)

  const current = medias[idx] || { type: 'photo', url: null }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler) }
  }, [onClose])

  const handleAjouter = () => {
    addItem({ ...produit, id: produit.id }, 'unite', 1)
    toast.success('Ajouté au panier')
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ maxWidth: 900, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Media */}
          <div style={{ flex: '1 1 400px', position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#111', minHeight: 360 }}>
            {current.type === 'video' ? (
              <video src={getImageUrl(current.url)} autoPlay muted={muted} loop playsInline controls={false}
                style={{ width: '100%', height: '100%', minHeight: 360, objectFit: 'contain' }} />
            ) : (
              <img src={getImageUrl(current.url) || 'https://placehold.co/600x600/111/D4AF37?text=VIP'} alt={produit.nom}
                style={{ width: '100%', height: '100%', minHeight: 360, objectFit: 'contain' }}
                onError={e => { e.target.src = 'https://placehold.co/600x600/111/D4AF37?text=VIP' }} />
            )}
            {/* Watermark AlloPanier */}
            <div style={{ position: 'absolute', bottom: 8, right: 10, fontFamily: 'Poppins', fontWeight: 800, fontSize: 13, color: 'rgba(212,175,55,0.55)', letterSpacing: 2, pointerEvents: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
              AlloPanier
            </div>
            {/* Contrôle son vidéo */}
            {current.type === 'video' && (
              <button onClick={() => setMuted(m => !m)}
                style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            {/* Navigation médias */}
            {medias.length > 1 && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + medias.length) % medias.length)}
                  style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setIdx(i => (i + 1) % medias.length)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Infos produit */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {produit.categorie_nom && (
              <span style={{ fontFamily: 'Poppins', fontSize: 11, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 2 }}>
                ♦ {produit.categorie_nom}
              </span>
            )}
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 900, color: '#fff', fontSize: 22, margin: 0, lineHeight: 1.2 }}>
              {produit.nom}
            </h2>
            {produit.marque && (
              <p style={{ fontFamily: 'Inter', color: '#D4AF37', fontSize: 14, margin: 0, fontWeight: 600 }}>
                {produit.marque}
              </p>
            )}
            {produit.description && (
              <p style={{ fontFamily: 'Inter', color: '#9a9aaa', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                {produit.description}
              </p>
            )}
            <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontFamily: 'Poppins', fontWeight: 900, color: '#D4AF37', fontSize: 26, margin: 0 }}>
                {formatPrix(produit.prix_unitaire)}
              </p>
              {produit.poids_unitaire_kg > 0 && (
                <p style={{ color: '#666', fontFamily: 'Inter', fontSize: 12, margin: '4px 0 0' }}>{produit.poids_unitaire_kg} kg</p>
              )}
            </div>
            {produit.stock ? (
              <button onClick={handleAjouter}
                style={{ padding: '14px', background: 'linear-gradient(135deg, #D4AF37, #C09A2F)', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, color: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }}>
                <ShoppingCart size={18} /> Ajouter au panier
              </button>
            ) : (
              <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, textAlign: 'center', color: '#666', fontFamily: 'Poppins', fontWeight: 600 }}>
                Indisponible
              </div>
            )}
          </div>
        </div>

        {/* Miniatures */}
        {medias.length > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {medias.map((m, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', border: i === idx ? '2px solid #D4AF37' : '2px solid transparent', background: '#222', cursor: 'pointer', padding: 0, position: 'relative', flexShrink: 0 }}>
                {m.type === 'video' ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                    <Play size={18} color="#D4AF37" />
                  </div>
                ) : (
                  <img src={getImageUrl(m.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose}
          style={{ position: 'fixed', top: 20, right: 20, width: 40, height: 40, background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
          <X size={20} />
        </button>
      </div>
    </div>
  )
}

// ===================== CARTE PRODUIT VIP =====================
function CarteProduitVIP({ produit, onClick }) {
  const mediaUrl = produit.video_url || produit.image_url

  return (
    <div onClick={() => onClick(produit)}
      style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f1f40 100%)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s' }}
      className="group hover:shadow-2xl hover:shadow-yellow-900/20">
      {/* Media */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: '#0a0a1a', overflow: 'hidden' }}>
        {produit.video_url ? (
          <video src={getImageUrl(produit.video_url)} muted autoPlay loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <img src={getImageUrl(produit.image_url)} alt={produit.nom}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
            className="group-hover:scale-105"
            onError={e => { e.target.src = 'https://placehold.co/400x300/1a1a2e/D4AF37?text=VIP' }} />
        )}
        {/* Badge catégorie */}
        {produit.categorie_nom && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#D4AF37', fontSize: 9 }}>♦</span>
            <span style={{ color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 700, fontSize: 10, letterSpacing: 0.5 }}>{produit.categorie_nom}</span>
          </div>
        )}
        {/* Galerie indicator */}
        {(produit.images_urls?.length > 1 || produit.video_url) && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '2px 7px', color: 'rgba(212,175,55,0.8)', fontSize: 10, fontFamily: 'Inter' }}>
            {produit.video_url ? '▶ Vidéo' : `${produit.images_urls?.length || 1} photos`}
          </div>
        )}
        {/* Watermark miniature */}
        <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 8, color: 'rgba(212,175,55,0.4)', fontFamily: 'Poppins', fontWeight: 700, pointerEvents: 'none' }}>AlloPanier</div>
        {/* Overlay hover */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,175,55,0)', transition: 'background 0.3s' }} className="group-hover:bg-yellow-400/5" />
      </div>

      {/* Infos */}
      <div style={{ padding: '12px 14px' }}>
        {produit.marque && (
          <p style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#D4AF37', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 3px' }}>
            {produit.marque}
          </p>
        )}
        <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#E8D5A3', fontSize: 14, lineHeight: 1.3, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {produit.nom}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Poppins', fontWeight: 800, color: '#D4AF37', fontSize: 16 }}>
            {formatPrix(produit.prix_unitaire)}
          </span>
          {!produit.stock && (
            <span style={{ fontFamily: 'Inter', fontSize: 10, color: '#666', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '2px 8px' }}>Indisponible</span>
          )}
        </div>

        {/* Bouton Obtenir cet article */}
        <button
          onClick={e => { e.stopPropagation(); onClick(produit) }}
          disabled={!produit.stock}
          style={{
            width: '100%', padding: '9px 12px',
            background: produit.stock ? 'linear-gradient(135deg, #D4AF37, #B8860B)' : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: 10, cursor: produit.stock ? 'pointer' : 'not-allowed',
            fontFamily: 'Poppins', fontWeight: 700, fontSize: 12,
            color: produit.stock ? '#1a1a2e' : '#555',
            letterSpacing: 0.3, transition: 'opacity 0.2s',
          }}>
          {produit.stock ? 'Obtenir cet article' : 'Indisponible'}
        </button>
      </div>
    </div>
  )
}

// ===================== PAGE PRINCIPALE VIP =====================
export default function VIPPage() {
  const [categories, setCategories] = useState([])
  const [produits, setProduits] = useState([])
  const [categorieActive, setCategorieActive] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState(null)
  const LIMIT = 20

  useEffect(() => {
    api.get('/vip/categories').then(r => setCategories(r.data.categories || []))
  }, [])

  const charger = () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, page })
    if (categorieActive) params.append('categorie', categorieActive)
    if (q) params.append('q', q)
    api.get(`/vip/produits?${params}`)
      .then(r => { setProduits(r.data.produits || []); setTotal(r.data.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(charger, [categorieActive, page])

  const handleSearch = e => {
    e.preventDefault()
    setPage(1)
    charger()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #050510 0%, #0a0a1e 40%, #0f0f2a 100%)' }}>
      {lightbox && <LightboxVIP produit={lightbox} onClose={() => setLightbox(null)} />}

      {/* Hero VIP */}
      <div style={{ background: 'linear-gradient(135deg, #050510, #1a1000, #0a0a1e)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '40px 0 30px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #D4AF37, #C09A2F)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.3)' }}>
                <Crown size={28} color="#1a1a2e" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 28, background: 'linear-gradient(135deg, #D4AF37, #F0D060)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: 1 }}>
                  AlloPanier V.I.P
                </h1>
                <p style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 13, margin: 0 }}>
                  Sélection exclusive — Mode, Luxe & Lifestyle
                </p>
              </div>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', flex: 1, maxWidth: 200, display: 'none' }} className="sm:block" />
          </div>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: 560 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(212,175,55,0.5)' }} />
            <input type="text" placeholder="Rechercher un article, une marque..." value={q}
              onChange={e => setQ(e.target.value)}
              style={{ width: '100%', padding: '13px 50px 13px 42px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 14, color: '#E8D5A3', fontFamily: 'Inter', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            {q && (
              <button type="button" onClick={() => { setQ(''); setPage(1); setTimeout(charger, 50) }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(212,175,55,0.5)' }}>
                <X size={15} />
              </button>
            )}
          </form>

          {/* Filtres catégories */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={() => { setCategorieActive(''); setPage(1) }}
                style={{ padding: '6px 14px', borderRadius: 20, border: !categorieActive ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.15)', background: !categorieActive ? 'rgba(212,175,55,0.15)' : 'transparent', color: !categorieActive ? '#D4AF37' : '#8a8a9a', fontFamily: 'Poppins', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                Tout
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => { setCategorieActive(String(cat.id)); setPage(1) }}
                  style={{ padding: '6px 14px', borderRadius: 20, border: String(categorieActive) === String(cat.id) ? '1px solid rgba(212,175,55,0.6)' : '1px solid rgba(212,175,55,0.15)', background: String(categorieActive) === String(cat.id) ? 'rgba(212,175,55,0.15)' : 'transparent', color: String(categorieActive) === String(cat.id) ? '#D4AF37' : '#8a8a9a', fontFamily: 'Poppins', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{cat.icone}</span>{cat.nom}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grille produits */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 48, height: 48, border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Crown size={56} style={{ color: 'rgba(212,175,55,0.1)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 16 }}>Aucun produit VIP pour le moment</p>
            <p style={{ color: '#555', fontFamily: 'Inter', fontSize: 13, marginTop: 4 }}>L'admin ajoute bientôt de nouvelles pièces</p>
          </div>
        ) : (
          <>
            <p style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Inter', fontSize: 13, marginBottom: 20 }}>
              {total} article{total !== 1 ? 's' : ''} exclusif{total !== 1 ? 's' : ''}
              {categorieActive && categories.find(c => String(c.id) === categorieActive) ? ` dans "${categories.find(c => String(c.id) === categorieActive).nom}"` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {produits.map(p => <CarteProduitVIP key={p.id} produit={p} onClick={setLightbox} />)}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  Précédent
                </button>
                <span style={{ padding: '8px 16px', color: '#8a8a9a', fontFamily: 'Inter', fontSize: 13 }}>
                  {page} / {Math.ceil(total / LIMIT)}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
                  style={{ padding: '8px 16px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, color: '#D4AF37', fontFamily: 'Poppins', fontWeight: 600, cursor: page >= Math.ceil(total / LIMIT) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / LIMIT) ? 0.4 : 1 }}>
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
