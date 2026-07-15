import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Crown, FileText, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

function formatF(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA' }

function genererRecuVIP(commande) {
  const code = commande.code_commande || '—'
  const date = commande.date_commande
    ? new Date(commande.date_commande).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'
  const estPaye = commande.statut_paiement === 'PAYE'

  const lignesHtml = (commande.lignes || []).map((l, i) => `
    <tr>
      <td>${i + 1}. ${l.produit?.nom || 'Produit'}</td>
      <td style="text-align:center">${l.type_achat || 'unité'}</td>
      <td style="text-align:center">${l.quantite}</td>
      <td style="text-align:right">${Number(l.prix_unitaire_applique || 0).toLocaleString('fr-FR')} F</td>
      <td style="text-align:right;font-weight:700">${Number(l.sous_total || 0).toLocaleString('fr-FR')} F</td>
    </tr>
  `).join('')

  const adresse = commande.adresse?.description_lieu || commande.description_lieu || ''
  const clientNom = commande.client_nom || '—'
  const clientTel = commande.client_telephone || '—'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Reçu VIP ${code}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; font-size: 13px; color: #1a1000; background: #fff; }
    .page { max-width: 700px; margin: 0 auto; padding: 28px 24px; position: relative; }

    /* === FILIGRANE V.I.P diagonal === */
    @keyframes none {}
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-38deg);
      font-size: 120px;
      font-weight: 900;
      font-family: 'Georgia', serif;
      color: rgba(130,130,130,0.13);
      letter-spacing: 18px;
      pointer-events: none;
      z-index: 0;
      user-select: none;
      white-space: nowrap;
    }
    .watermark2 {
      position: fixed;
      top: 18%; left: 50%;
      transform: translate(-50%, -50%) rotate(-38deg);
      font-size: 90px;
      font-weight: 900;
      font-family: 'Georgia', serif;
      color: rgba(130,130,130,0.08);
      letter-spacing: 14px;
      pointer-events: none;
      z-index: 0;
      user-select: none;
      white-space: nowrap;
    }
    .watermark3 {
      position: fixed;
      top: 80%; left: 50%;
      transform: translate(-50%, -50%) rotate(-38deg);
      font-size: 90px;
      font-weight: 900;
      font-family: 'Georgia', serif;
      color: rgba(130,130,130,0.08);
      letter-spacing: 14px;
      pointer-events: none;
      z-index: 0;
      user-select: none;
      white-space: nowrap;
    }

    .content { position: relative; z-index: 1; }
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #D4AF37; margin-bottom: 18px; }
    .brand-name { font-size: 24px; font-weight: 900; }
    .brand-name .allo { color: #1a1a2e; }
    .brand-name .panier { color: #D4AF37; }
    .vip-badge { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: #D4AF37; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 3px; border: 1px solid #D4AF37; }

    .code-section { background: linear-gradient(135deg, #1a1a2e, #0f3460); border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 18px; }
    .code-label { font-size: 10px; color: rgba(212,175,55,0.7); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
    .code-value { font-size: 26px; font-weight: 900; color: #D4AF37; letter-spacing: 4px; font-family: 'Courier New', monospace; }
    .code-instruction { font-size: 10px; color: rgba(212,175,55,0.5); margin-top: 5px; font-style: italic; }

    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 5px; margin-bottom: 9px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
    .info-item .lbl { font-size: 10px; color: #999; }
    .info-item .val { font-size: 13px; font-weight: 700; color: #1a1000; margin-top: 1px; }
    .adresse-box { background: #fafaf5; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 9px 13px; font-size: 13px; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: #D4AF37; padding: 8px 6px; text-align: left; font-size: 11px; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #fafaf5; }
    tbody td { padding: 6px; border-bottom: 1px solid rgba(212,175,55,0.1); vertical-align: top; }

    .totaux { border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; overflow: hidden; margin-top: 12px; }
    .totaux-row { display: flex; justify-content: space-between; padding: 7px 13px; font-size: 13px; border-bottom: 1px solid rgba(212,175,55,0.08); }
    .totaux-final { background: linear-gradient(135deg, #1a1a2e, #0f3460); color: #D4AF37; font-size: 15px; font-weight: 900; padding: 11px 13px; display: flex; justify-content: space-between; }
    .statut-paye { background: #1B5E20; color: #fff; font-size: 12px; font-weight: 900; padding: 7px 13px; display: flex; justify-content: space-between; }
    .statut-apayer { background: #E65100; color: #fff; font-size: 12px; font-weight: 900; padding: 7px 13px; display: flex; justify-content: space-between; }

    .gold-divider { height: 1px; background: linear-gradient(90deg, transparent, #D4AF37, transparent); margin: 14px 0; }
    .footer { margin-top: 20px; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 14px; text-align: center; }

    .actions { margin-bottom: 18px; display: flex; gap: 10px; }
    .btn { padding: 9px 18px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
    .btn-gold { background: linear-gradient(135deg, #D4AF37, #C09A2F); color: #1a1a2e; }
    .btn-gray { background: #555; color: white; }
    @media print { .actions { display: none !important; } }
  </style>
</head>
<body>
  <!-- Filigranes V.I.P -->
  <div class="watermark">V.I.P</div>
  <div class="watermark2">V.I.P</div>
  <div class="watermark3">V.I.P</div>

<div class="page">
  <div class="content">
    <div class="actions">
      <button class="btn btn-gold" onclick="window.print()">Imprimer le reçu VIP</button>
      <button class="btn btn-gray" onclick="window.close()">Fermer</button>
    </div>

    <div class="header">
      <div class="brand-name"><span class="allo">Allo</span><span class="panier">Panier</span></div>
      <div class="vip-badge">V.I.P</div>
    </div>

    <div class="code-section">
      <div class="code-label">Code de retrait exclusif V.I.P</div>
      <div class="code-value">${code}</div>
      <div class="code-instruction">Présentez ce code au livreur pour valider la remise de votre commande</div>
    </div>

    <div class="gold-divider"></div>

    <div class="section">
      <div class="section-title">Informations client</div>
      <div class="info-grid">
        <div class="info-item"><div class="lbl">Nom et prénom</div><div class="val">${clientNom}</div></div>
        <div class="info-item"><div class="lbl">Téléphone</div><div class="val">${clientTel}</div></div>
        <div class="info-item"><div class="lbl">Date de commande</div><div class="val">${date}</div></div>
        <div class="info-item"><div class="lbl">Statut</div><div class="val">${commande.statut || 'EN_ATTENTE'}</div></div>
        <div class="info-item"><div class="lbl">Jour de livraison</div><div class="val">${commande.jour_livraison || '—'}</div></div>
        <div class="info-item"><div class="lbl">Créneau horaire</div><div class="val">${commande.tranche_horaire || '—'}</div></div>
      </div>
    </div>

    ${adresse ? `
    <div class="section">
      <div class="section-title">Adresse de livraison</div>
      <div class="adresse-box">${adresse}</div>
    </div>` : ''}

    ${(commande.lignes || []).length > 0 ? `
    <div class="section">
      <div class="section-title">Articles commandés</div>
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th>Type</th>
            <th>Qté</th>
            <th>Prix unit.</th>
            <th>Sous-total</th>
          </tr>
        </thead>
        <tbody>${lignesHtml}</tbody>
      </table>
    </div>` : ''}

    <div class="totaux">
      <div class="totaux-row"><span>Sous-total produits</span><span>${Number(commande.sous_total || 0).toLocaleString('fr-FR')} FCFA</span></div>
      <div class="totaux-row"><span>Frais de livraison</span><span>${Number(commande.frais_livraison || 0).toLocaleString('fr-FR')} FCFA</span></div>
      <div class="totaux-final">
        <span>${estPaye ? '✓ DÉJÀ PAYÉ' : 'TOTAL À PAYER AU LIVREUR'}</span>
        <span>${Number(commande.total || 0).toLocaleString('fr-FR')} FCFA</span>
      </div>
      ${estPaye
        ? `<div class="statut-paye"><span>✓ MONTANT RÉGLÉ PAR MOBILE MONEY</span><span>${Number(commande.total || 0).toLocaleString('fr-FR')} FCFA</span></div>`
        : `<div class="statut-apayer"><span>⚡ À PAYER AU LIVREUR EN ESPÈCES</span><span>${Number(commande.total || 0).toLocaleString('fr-FR')} FCFA</span></div>`
      }
    </div>

    ${commande.note_livraison ? `
    <div class="section" style="margin-top:14px">
      <div class="section-title">Note de livraison</div>
      <div class="adresse-box" style="border-color:#F9A825;background:#FFFDE7">${commande.note_livraison}</div>
    </div>` : ''}

    <div class="footer">
      <p style="font-size:11px;color:#888;">Service exclusif AlloPanier V.I.P — Bénin</p>
      <p style="font-size:10px;color:#bbb;margin-top:5px;">Imprimé le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
  </div>
</div>
</body></html>`
}

export default function VIPConfirmationPage() {
  const { codeCommande } = useParams()
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let tries = 0
    function load() {
      tries++
      api.get(`/vip/commandes/code/${codeCommande}`)
        .then(r => { setCommande(r.data.commande); setLoading(false) })
        .catch(() => { if (tries < 4) setTimeout(load, 1000); else setLoading(false) })
    }
    load()
  }, [codeCommande])

  const ouvrirRecu = () => {
    if (!commande) return
    try {
      const html = genererRecuVIP(commande)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (!win) {
        // Fallback : téléchargement direct
        const a = document.createElement('a')
        a.href = url
        a.download = `recu-vip-${commande.code_commande}.html`
        a.click()
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (err) {
      console.error('Erreur reçu VIP:', err)
      alert('Impossible d\'ouvrir le reçu. Vérifiez que les popups sont autorisées.')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Succès */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #D4AF37, #C09A2F)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(212,175,55,0.3)'
          }}>
            <Crown size={36} color="#1a1a2e" />
          </div>
          <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, color: '#D4AF37', fontSize: 26, margin: '0 0 8px' }}>
            Commande VIP Confirmée
          </h1>
          <p style={{ color: '#8a8a9a', fontFamily: 'Inter', fontSize: 14 }}>
            Votre commande exclusive a été enregistrée avec succès.
          </p>
        </div>

        {/* Code commande */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
          border: '2px solid rgba(212,175,55,0.4)',
          borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 24
        }}>
          <p style={{ color: 'rgba(212,175,55,0.6)', fontFamily: 'Poppins', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Votre code de retrait VIP
          </p>
          <p style={{ fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 30, color: '#D4AF37', letterSpacing: 5, margin: '0 0 8px' }}>
            {codeCommande}
          </p>
          <p style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Inter', fontSize: 12 }}>
            Présentez ce code au livreur pour récupérer votre commande
          </p>
        </div>

        {/* Détails */}
        {commande && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                ['Jour', commande.jour_livraison],
                ['Créneau', commande.tranche_horaire],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(212,175,55,0.05)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ color: 'rgba(212,175,55,0.5)', fontFamily: 'Inter', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3px' }}>{k}</p>
                  <p style={{ color: '#E8D5A3', fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, margin: 0 }}>{v || '—'}</p>
                </div>
              ))}
            </div>

            {commande.lignes?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {commande.lignes.map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'Inter', color: '#8a8a9a', marginBottom: 6 }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                      {l.produit?.nom} × {l.quantite}
                    </span>
                    <span style={{ color: '#E8D5A3', fontWeight: 600 }}>{formatF(l.sous_total)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(212,175,55,0.15)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontFamily: 'Poppins', fontWeight: 900, fontSize: 18 }}>
              <span style={{ color: '#E8D5A3' }}>Total à payer</span>
              <span style={{ color: '#D4AF37' }}>{formatF(commande.total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commande && (
            <button onClick={ouvrirRecu}
              style={{
                width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)',
                borderRadius: 12, cursor: 'pointer',
                fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, color: '#D4AF37'
              }}>
              <FileText size={18} /> Télécharger mon reçu VIP
            </button>
          )}
          <Link to="/vip/mes-commandes"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', background: 'linear-gradient(135deg, #D4AF37, #C09A2F)',
              borderRadius: 12, color: '#1a1a2e', fontFamily: 'Poppins', fontWeight: 800, fontSize: 14,
              textDecoration: 'none'
            }}>
            <Crown size={16} /> Mes commandes VIP
          </Link>
          <Link to="/vip"
            style={{
              display: 'block', textAlign: 'center', padding: '12px',
              border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12,
              color: 'rgba(212,175,55,0.6)', fontFamily: 'Poppins', fontWeight: 600, fontSize: 14,
              textDecoration: 'none'
            }}>
            Continuer mes achats VIP
          </Link>
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontFamily: 'Inter', fontSize: 12, marginTop: 20 }}>
          Paiement en espèces à la livraison — Service exclusif AlloPanier VIP
        </p>
      </div>
    </div>
  )
}
