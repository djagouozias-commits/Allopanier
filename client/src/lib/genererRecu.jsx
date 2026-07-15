/**
 * Génère un reçu HTML imprimable (client et admin).
 * Inclut QR code, infos client complètes et poids total.
 */

function qrUrl(code) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(code)}&color=2E7D32`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatMontant(n) {
  return Number(n || 0).toLocaleString('fr-FR')
}

function formatPoidsKg(kg) {
  return `${parseFloat(kg || 0).toFixed(2)} kg`
}

export function genererRecuHTML(commande, { titre = 'Reçu de commande', autoPrint = false } = {}) {
  const code = commande.code_commande || '—'
  const lignesHtml = (commande.lignes || []).map((l, i) => `
    <tr>
      <td>${i + 1}. ${l.produit?.nom || 'Produit'}</td>
      <td style="text-align:center">${l.type_achat || 'unité'}</td>
      <td style="text-align:center">${l.quantite}</td>
      <td style="text-align:right">${formatMontant(l.prix_unitaire_applique)} F</td>
      <td style="text-align:right;font-weight:600">${formatMontant(l.sous_total)} F</td>
    </tr>
  `).join('')

  const adresse = commande.adresse?.description_lieu || commande.description_lieu || ''
  const clientNom = commande.client_nom || '—'
  const clientTel = commande.client_telephone || '—'
  const clientWhatsapp = commande.client_whatsapp || commande.client_telephone || '—'
  const clientEmail = commande.client_email || '—'
  const clientType = commande.client_type_client || commande.type_client || '—'

  const estPaye = commande.statut_paiement === 'PAYE'
  const labelPaiement = estPaye ? '✓ DÉJÀ PAYÉ — REÇU DE PAIEMENT' : 'À PAYER AU LIVREUR'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Reçu ${code} — AlloPanier</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
    .page { max-width: 680px; margin: 0 auto; padding: 24px 20px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #2E7D32; padding-bottom: 14px; margin-bottom: 18px; }
    .brand-name { font-size: 26px; font-weight: 900; color: #2E7D32; }
    .brand-name span { color: #111; }
    .brand-sub { font-size: 11px; color: #777; margin-top: 2px; }
    .qr-block { text-align: center; }
    .qr-block img { display: block; width: 100px; height: 100px; margin: 0 auto; }
    .qr-block p { font-size: 9px; color: #888; margin-top: 3px; }
    .recu-title { font-size: 16px; font-weight: 700; text-align: center; margin: 12px 0; color: #2E7D32; text-transform: uppercase; letter-spacing: 2px; }
    .code-section { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); border: 2px solid #2E7D32; border-radius: 12px; padding: 14px 18px; text-align: center; margin-bottom: 18px; }
    .code-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .code-value { font-size: 28px; font-weight: 900; color: #1B5E20; letter-spacing: 4px; }
    .code-instruction { font-size: 11px; color: #388E3C; margin-top: 6px; font-style: italic; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #888; letter-spacing: 1.5px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item .lbl { font-size: 10px; color: #999; }
    .info-item .val { font-size: 13px; font-weight: 600; color: #222; margin-top: 1px; }
    .adresse { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #374151; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #2E7D32; color: #fff; padding: 8px 6px; font-size: 11px; text-align: left; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    tbody td { padding: 7px 6px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .totaux { margin-top: 12px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .totaux-row { display: flex; justify-content: space-between; padding: 7px 14px; font-size: 13px; border-bottom: 1px solid #f5f5f5; }
    .totaux-row:last-child { border-bottom: none; }
    .totaux-final { background: #2E7D32; color: #fff; font-size: 15px; font-weight: 900; padding: 10px 14px; display: flex; justify-content: space-between; }
    .statut-paye { background: #1B5E20; color: #fff; font-size: 13px; font-weight: 900; padding: 8px 14px; display: flex; justify-content: space-between; letter-spacing: 1px; }
    .statut-apayer { background: #E65100; color: #fff; font-size: 13px; font-weight: 900; padding: 8px 14px; display: flex; justify-content: space-between; letter-spacing: 1px; }
    .footer { margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 14px; text-align: center; }
    .payment-badge { display: inline-block; background: #E8F5E9; border: 1px solid #2E7D32; border-radius: 20px; padding: 5px 16px; font-size: 12px; color: #2E7D32; font-weight: 700; margin-bottom: 8px; }
    .instructions { background: #FFF9C4; border: 1px solid #F9A825; border-radius: 6px; padding: 8px 12px; margin: 10px 0; font-size: 12px; color: #5D4037; text-align: left; }
    .instructions strong { display: block; font-size: 13px; color: #E65100; margin-bottom: 4px; }
    .footer-note { font-size: 10px; color: #aaa; margin-top: 6px; }
    .print-bar { position: sticky; bottom: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 12px 20px; display: flex; gap: 10px; justify-content: center; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
    .btn-green { background: #2E7D32; color: #fff; }
    .btn-outline { background: #fff; color: #555; border: 1px solid #ddd; }
    @media print { .print-bar { display: none !important; } body { padding: 0; } .page { padding: 10px; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <div class="brand-name">Allo<span>Panier</span></div>
      <div class="brand-sub">Livraison à domicile au Bénin</div>
      <div class="brand-sub">+229 68 20 46 54</div>
    </div>
    <div class="qr-block">
      <img src="${qrUrl(code)}" alt="QR Code" onerror="this.style.display='none'"/>
      <p>Scanner pour vérifier</p>
    </div>
  </div>

  <div class="recu-title">${titre}</div>

  <div class="code-section">
    <div class="code-label">Code de commande</div>
    <div class="code-value">${code}</div>
    <div class="code-instruction">Présentez ce code à votre livreur pour récupérer votre commande</div>
  </div>

  <div class="section">
    <div class="section-title">Client</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="lbl">Nom et prénom</div>
        <div class="val">${clientNom}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Téléphone</div>
        <div class="val">${clientTel}</div>
      </div>
      <div class="info-item">
        <div class="lbl">WhatsApp</div>
        <div class="val">${clientWhatsapp}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Email</div>
        <div class="val">${clientEmail}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Type de client</div>
        <div class="val">${clientType}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Statut commande</div>
        <div class="val">${commande.statut || 'EN_ATTENTE'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations de livraison</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="lbl">Date de commande</div>
        <div class="val">${formatDate(commande.date_commande)}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Jour de livraison</div>
        <div class="val">${commande.jour_livraison || '—'}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Créneau horaire</div>
        <div class="val">${commande.tranche_horaire || '—'}</div>
      </div>
      <div class="info-item">
        <div class="lbl">Poids total</div>
        <div class="val">${formatPoidsKg(commande.poids_total_kg)}</div>
      </div>
    </div>
  </div>

  ${adresse ? `
  <div class="section">
    <div class="section-title">Adresse de livraison</div>
    <div class="adresse">${adresse}</div>
  </div>` : ''}

  ${(commande.lignes || []).length > 0 ? `
  <div class="section">
    <div class="section-title">Détail des articles</div>
    <table>
      <thead>
        <tr>
          <th>Produit</th>
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
    <div class="totaux-row">
      <span>Sous-total produits</span>
      <span>${formatMontant(commande.sous_total)} FCFA</span>
    </div>
    <div class="totaux-row">
      <span>Poids total</span>
      <span>${formatPoidsKg(commande.poids_total_kg)}</span>
    </div>
    <div class="totaux-row">
      <span>Frais de livraison</span>
      <span>${formatMontant(commande.frais_livraison)} FCFA</span>
    </div>
    <div class="totaux-final">
      <span>${labelPaiement}</span>
      <span>${formatMontant(commande.total)} FCFA</span>
    </div>
    ${estPaye ? `<div class="statut-paye"><span>✓ MONTANT DÉJÀ RÉGLÉ PAR MOBILE MONEY</span><span>${formatMontant(commande.total)} FCFA</span></div>` : `<div class="statut-apayer"><span>⚡ À PAYER AU LIVREUR EN ESPÈCES</span><span>${formatMontant(commande.total)} FCFA</span></div>`}
  </div>

  ${commande.note_livraison ? `
  <div class="section" style="margin-top:14px">
    <div class="section-title">Note de livraison</div>
    <div class="adresse" style="border-color:#FCD34D;background:#FFFDE7">${commande.note_livraison}</div>
  </div>` : ''}

  <div class="footer">
    <div class="instructions">
      <strong>Important</strong>
      Le client doit présenter le code <strong>${code}</strong> au livreur pour confirmer l'identité et valider la remise des produits.
    </div>
    <div class="payment-badge" style="${estPaye ? 'background:#1B5E20;border-color:#1B5E20;color:#fff;' : ''}">
      ${estPaye ? '✓ DÉJÀ PAYÉ — Mobile Money' : 'À PAYER — Espèces à la livraison'}
    </div>
    <p class="footer-note">Merci de votre confiance — AlloPanier | Bénin</p>
    <p class="footer-note">Imprimé le ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
</div>

<div class="print-bar">
  <button class="btn btn-green" onclick="window.print()">Imprimer le reçu</button>
  <button class="btn btn-outline" onclick="window.close()">Fermer</button>
</div>

${autoPrint ? '<script>window.onload = function() { window.print(); }</script>' : ''}
</body>
</html>`
}

function ouvrirHtml(html, filename = 'recu.html') {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (!win) {
      // Fallback téléchargement direct si popup bloquée
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } catch (err) {
    console.error('Erreur ouverture reçu:', err)
  }
}

export function ouvrirRecuClient(commande) {
  const html = genererRecuHTML(commande, { titre: 'Reçu de commande' })
  ouvrirHtml(html, `recu-${commande.code_commande || 'commande'}.html`)
}

export function ouvrirRecuAdmin(commande) {
  const html = genererRecuHTML(commande, { titre: 'Reçu de commande', autoPrint: true })
  ouvrirHtml(html, `recu-admin-${commande.code_commande || 'commande'}.html`)
}
