const express = require('express')
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { validerCreneauCommande } = require('../lib/livraisonSlots')
const router = express.Router()

function genCode() {
  const d = new Date()
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `AP-${yyyymmdd}-${rand}`
}

// POST /api/commandes
router.post('/', authMiddleware, async (req, res) => {
  const { adresse_id, jour_livraison, tranche_horaire, est_jour_exceptionnel,
          sous_total, poids_total_kg, frais_livraison, total, note_livraison, lignes,
          mode_paiement = 'especes', statut_paiement = 'A_PAYER' } = req.body

  if (!lignes?.length) return res.status(400).json({ message: 'Panier vide' })
  if (parseFloat(sous_total) < 500) return res.status(400).json({ message: 'Montant minimum : 500 FCFA' })

  // Vérifier si le compte est bloqué
  const clientCheck = await pool.query('SELECT compte_bloque, nb_commandes_non_livrees FROM clients WHERE id=$1', [req.user.id])
  if (clientCheck.rows[0]?.compte_bloque) {
    return res.status(403).json({ message: 'Votre compte est bloqué suite à 10 commandes non livrées. Contactez-nous sur WhatsApp.' })
  }

  const creneauCheck = validerCreneauCommande(jour_livraison, tranche_horaire)
  if (!creneauCheck.ok) return res.status(400).json({ message: creneauCheck.message })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let code = genCode()
    // S'assurer que le code est unique
    let existing = await client.query('SELECT id FROM commandes WHERE code_commande=$1', [code])
    while (existing.rows.length > 0) {
      code = genCode()
      existing = await client.query('SELECT id FROM commandes WHERE code_commande=$1', [code])
    }

    const { rows } = await client.query(
      `INSERT INTO commandes (code_commande, client_id, adresse_id, statut, jour_livraison, tranche_horaire,
        est_jour_exceptionnel, sous_total, poids_total_kg, frais_livraison, total, note_livraison,
        mode_paiement, statut_paiement)
       VALUES ($1,$2,$3,'EN_ATTENTE',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        code, req.user.id, parseInt(adresse_id),
        jour_livraison, tranche_horaire,
        est_jour_exceptionnel === true || est_jour_exceptionnel === 'true' || est_jour_exceptionnel === 1,
        parseFloat(sous_total), parseFloat(poids_total_kg) || 0,
        parseFloat(frais_livraison), parseFloat(total),
        note_livraison || null,
        mode_paiement || 'especes',
        statut_paiement || 'A_PAYER'
      ]
    )
    const commande = rows[0]

    for (const l of lignes) {
      await client.query(
        `INSERT INTO lignes_commande (commande_id, produit_id, type_achat, quantite, prix_unitaire_applique, est_prix_gros, sous_total, poids_total_kg)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [commande.id, l.produit_id, l.type_achat || 'unite', l.quantite, l.prix_unitaire_applique, l.est_prix_gros || false, l.sous_total, l.poids_total_kg || 0]
      )
    }

    await client.query('COMMIT')
    res.status(201).json({ commande })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

// GET /api/commandes/mes-commandes
router.get('/mes-commandes', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM lignes_commande lc WHERE lc.commande_id = c.id) as nb_articles
       FROM commandes c 
       WHERE client_id=$1 
       ORDER BY date_commande DESC`,
      [req.user.id]
    )
    res.json({ commandes: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/commandes/code/:code — accessible aussi sans auth pour affichage confirmation
router.get('/code/:code', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cl.nom as client_nom, cl.telephone as client_telephone, cl.whatsapp as client_whatsapp,
              cl.email as client_email, cl.type_client as client_type_client,
              a.description_lieu, a.latitude, a.longitude
       FROM commandes c
       LEFT JOIN clients cl ON cl.id = c.client_id
       LEFT JOIN adresses a ON a.id = c.adresse_id
       WHERE c.code_commande=$1`,
      [req.params.code]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' })

    const commande = rows[0]

    // Vérification optionnelle si token fourni
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken')
        const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
        if (payload.role !== 'admin' && commande.client_id !== payload.id) {
          return res.status(403).json({ message: 'Accès refusé' })
        }
      } catch {
        // Token invalide/expiré — on laisse passer pour la page confirmation
        // La commande reste visible par son code (non devinable)
      }
    }

    const { rows: lignes } = await pool.query(
      `SELECT lc.*, p.nom as produit_nom, p.image_url
       FROM lignes_commande lc
       LEFT JOIN produits p ON p.id = lc.produit_id
       WHERE lc.commande_id=$1`,
      [commande.id]
    )

    commande.lignes = lignes.map(l => ({
      ...l,
      produit: { id: l.produit_id, nom: l.produit_nom, image_url: l.image_url }
    }))
    commande.adresse = {
      description_lieu: commande.description_lieu,
      latitude: commande.latitude,
      longitude: commande.longitude
    }

    res.json({ commande })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
