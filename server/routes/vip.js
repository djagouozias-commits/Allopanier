const express = require('express')
const pool = require('../db')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// Upload images VIP
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'vip')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `vip-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

// ===== CATÉGORIES VIP =====

// GET /api/vip/categories
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vip_categories WHERE actif = TRUE ORDER BY ordre_affichage ASC'
    )
    res.json({ categories: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// POST /api/vip/categories (admin)
router.post('/categories', adminMiddleware, async (req, res) => {
  const { nom, icone, ordre_affichage } = req.body
  try {
    const { rows } = await pool.query(
      'INSERT INTO vip_categories (nom, icone, ordre_affichage) VALUES ($1,$2,$3) RETURNING *',
      [nom, icone || '♦', ordre_affichage || 0]
    )
    res.status(201).json({ categorie: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/vip/categories/:id (admin)
router.put('/categories/:id', adminMiddleware, async (req, res) => {
  const { nom, icone, ordre_affichage, actif } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE vip_categories SET nom=$1, icone=$2, ordre_affichage=$3, actif=$4 WHERE id=$5 RETURNING *',
      [nom, icone, ordre_affichage, actif !== false, req.params.id]
    )
    res.json({ categorie: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// DELETE /api/vip/categories/:id (admin)
router.delete('/categories/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE vip_categories SET actif=FALSE WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// ===== PRODUITS VIP =====

// GET /api/vip/produits — accessible à tous (pour voir la liste floue)
router.get('/produits', async (req, res) => {
  try {
    const { categorie, q, limit = 20, page = 1 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conds = ['vp.actif = TRUE']
    const params = []
    let pi = 1
    if (categorie) { conds.push(`vp.categorie_id=$${pi++}`); params.push(parseInt(categorie)) }
    if (q) { conds.push(`vp.nom ILIKE $${pi++}`); params.push(`%${q}%`) }
    const where = 'WHERE ' + conds.join(' AND ')
    const count = await pool.query(
      `SELECT COUNT(*) FROM vip_produits vp ${where}`, params
    )
    const { rows } = await pool.query(
      `SELECT vp.*, vc.nom as categorie_nom, vc.icone as categorie_icone
       FROM vip_produits vp
       LEFT JOIN vip_categories vc ON vc.id = vp.categorie_id
       ${where}
       ORDER BY vp.date_creation DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ produits: rows, total: parseInt(count.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/vip/produits/:id
router.get('/produits/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT vp.*, vc.nom as categorie_nom FROM vip_produits vp
       LEFT JOIN vip_categories vc ON vc.id=vp.categorie_id
       WHERE vp.id=$1`, [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Produit introuvable' })
    res.json({ produit: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// POST /api/vip/produits (admin)
router.post('/produits', adminMiddleware, upload.fields([{ name: 'photos', maxCount: 4 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const d = req.body
    const imageUrls = req.files?.photos?.map(f => `/uploads/vip/${f.filename}`) || []
    const videoUrl = req.files?.video?.[0] ? `/uploads/vip/${req.files.video[0].filename}` : null
    const imageUrl = imageUrls[0] || null

    const { rows } = await pool.query(
      `INSERT INTO vip_produits (categorie_id, nom, marque, description, image_url, images_urls, video_url, poids_unitaire_kg, prix_unitaire, stock, stock_min, actif)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        d.categorie_id || null, d.nom, d.marque || null, d.description || null, imageUrl,
        imageUrls.length > 0 ? imageUrls : null, videoUrl,
        parseFloat(d.poids_unitaire_kg) || 0,
        parseFloat(d.prix_unitaire),
        d.stock !== 'false' && d.stock !== false,
        parseInt(d.stock_min) || 0,
        d.actif !== 'false' && d.actif !== false
      ]
    )
    res.status(201).json({ produit: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/vip/produits/:id (admin)
router.put('/produits/:id', adminMiddleware, upload.fields([{ name: 'photos', maxCount: 4 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const d = req.body
    const existing = await pool.query('SELECT * FROM vip_produits WHERE id=$1', [req.params.id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Produit introuvable' })

    // Si seulement actif envoyé → toggle simple sans toucher aux médias
    if (Object.keys(d).length === 1 && d.actif !== undefined && !req.files?.photos && !req.files?.video) {
      await pool.query('UPDATE vip_produits SET actif=$1 WHERE id=$2', [d.actif === 'true' || d.actif === true, req.params.id])
      return res.json({ success: true })
    }

    const newImages = req.files?.photos?.map(f => `/uploads/vip/${f.filename}`) || []
    const videoUrl = req.files?.video?.[0] ? `/uploads/vip/${req.files.video[0].filename}` : existing.rows[0].video_url
    const existingImages = existing.rows[0].images_urls || []
    const allImages = [...existingImages, ...newImages].slice(0, 4)
    const imageUrl = allImages[0] || existing.rows[0].image_url

    await pool.query(
      `UPDATE vip_produits SET categorie_id=$1, nom=$2, marque=$3, description=$4, image_url=$5, images_urls=$6, video_url=$7,
       poids_unitaire_kg=$8, prix_unitaire=$9, stock=$10, stock_min=$11, actif=$12 WHERE id=$13`,
      [
        d.categorie_id || null, d.nom, d.marque || null, d.description || null, imageUrl, allImages, videoUrl,
        parseFloat(d.poids_unitaire_kg) || 0, parseFloat(d.prix_unitaire),
        d.stock !== 'false' && d.stock !== false,
        parseInt(d.stock_min) || 0,
        d.actif !== 'false' && d.actif !== false,
        req.params.id
      ]
    )
    const updated = await pool.query('SELECT * FROM vip_produits WHERE id=$1', [req.params.id])
    res.json({ produit: updated.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE image d'un produit VIP
router.delete('/produits/:id/image', adminMiddleware, async (req, res) => {
  const { imageUrl } = req.body
  try {
    const { rows } = await pool.query('SELECT images_urls FROM vip_produits WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Produit introuvable' })
    const images = (rows[0].images_urls || []).filter(u => u !== imageUrl)
    const filePath = path.join(__dirname, '..', imageUrl)
    if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath) } catch {}
    await pool.query(
      'UPDATE vip_produits SET images_urls=$1, image_url=$2 WHERE id=$3',
      [images, images[0] || null, req.params.id]
    )
    res.json({ success: true, images })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// ===== MEMBRES VIP =====

// GET /api/vip/membres (admin)
router.get('/membres', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, telephone, email, type_client, est_vip, vip_depuis, date_inscription
       FROM clients WHERE role='client' ORDER BY est_vip DESC, nom ASC`
    )
    res.json({ membres: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/vip/membres/:id — activer/désactiver accès VIP
router.put('/membres/:id', adminMiddleware, async (req, res) => {
  const { est_vip } = req.body
  try {
    await pool.query(
      'UPDATE clients SET est_vip=$1, vip_depuis=$2 WHERE id=$3',
      [est_vip, est_vip ? new Date() : null, req.params.id]
    )
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/vip/mon-statut — statut VIP du client connecté
router.get('/mon-statut', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT est_vip, vip_depuis FROM clients WHERE id=$1', [req.user.id]
    )
    res.json({ est_vip: rows[0]?.est_vip || false, vip_depuis: rows[0]?.vip_depuis })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// ===== COMMANDES VIP =====

function genCodeVIP() {
  const d = new Date()
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `VIP-${yyyymmdd}-${rand}`
}

// POST /api/vip/commandes
router.post('/commandes', authMiddleware, async (req, res) => {
  const { adresse_id, jour_livraison, tranche_horaire, est_jour_exceptionnel,
          sous_total, poids_total_kg, frais_livraison, total, note_livraison, lignes,
          mode_paiement = 'especes', statut_paiement = 'A_PAYER' } = req.body

  if (!lignes?.length) return res.status(400).json({ message: 'Panier VIP vide' })
  if (parseFloat(sous_total) < 500) return res.status(400).json({ message: 'Montant minimum : 500 FCFA' })

  // Vérifier si le compte est bloqué
  const clientCheck = await pool.query('SELECT compte_bloque FROM clients WHERE id=$1', [req.user.id])
  if (clientCheck.rows[0]?.compte_bloque) {
    return res.status(403).json({ message: 'Votre compte est bloqué. Contactez-nous sur WhatsApp.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Générer code unique VIP
    let code = genCodeVIP()
    let existing = await client.query('SELECT id FROM commandes WHERE code_commande=$1', [code])
    while (existing.rows.length > 0) {
      code = genCodeVIP()
      existing = await client.query('SELECT id FROM commandes WHERE code_commande=$1', [code])
    }

    const { rows } = await client.query(
      `INSERT INTO commandes (code_commande, client_id, adresse_id, statut, jour_livraison, tranche_horaire,
        est_jour_exceptionnel, sous_total, poids_total_kg, frais_livraison, total, note_livraison,
        mode_paiement, statut_paiement)
       VALUES ($1,$2,$3,'EN_ATTENTE',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        code, req.user.id, parseInt(adresse_id), jour_livraison, tranche_horaire,
        est_jour_exceptionnel === true || est_jour_exceptionnel === 'true',
        parseFloat(sous_total), parseFloat(poids_total_kg) || 0,
        parseFloat(frais_livraison), parseFloat(total), note_livraison || null,
        mode_paiement || 'especes', statut_paiement || 'A_PAYER'
      ]
    )
    const commande = rows[0]

    for (const l of lignes) {
      // Utiliser le nom_produit envoyé par le client, sinon chercher en base
      let nomProduit = l.nom_produit || null
      if (!nomProduit && l.produit_id) {
        try {
          const p = await client.query('SELECT nom FROM vip_produits WHERE id=$1', [l.produit_id])
          nomProduit = p.rows[0]?.nom || null
        } catch {}
      }
      await client.query(
        `INSERT INTO lignes_commande (commande_id, produit_id, type_achat, quantite, prix_unitaire_applique, est_prix_gros, sous_total, poids_total_kg, nom_produit, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'vip')`,
        [commande.id, l.produit_id, l.type_achat || 'unite', l.quantite,
         l.prix_unitaire_applique, false, l.sous_total, l.poids_total_kg || 0, nomProduit]
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

// GET /api/vip/commandes/mes-commandes
router.get('/commandes/mes-commandes', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM commandes WHERE client_id=$1 AND code_commande LIKE 'VIP-%' ORDER BY date_commande DESC`,
      [req.user.id]
    )
    res.json({ commandes: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/vip/commandes/code/:code
router.get('/commandes/code/:code', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cl.nom as client_nom, cl.telephone as client_telephone, cl.whatsapp as client_whatsapp,
              a.description_lieu, a.latitude, a.longitude
       FROM commandes c
       LEFT JOIN clients cl ON cl.id=c.client_id
       LEFT JOIN adresses a ON a.id=c.adresse_id
       WHERE c.code_commande=$1`, [req.params.code]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' })
    const commande = rows[0]

    const { rows: lignes } = await pool.query(
      `SELECT lc.*,
              COALESCE(lc.nom_produit, vp.nom) as produit_nom,
              vp.image_url
       FROM lignes_commande lc
       LEFT JOIN vip_produits vp ON vp.id = lc.produit_id
       WHERE lc.commande_id=$1 AND (lc.source = 'vip' OR lc.nom_produit IS NOT NULL)`, [commande.id]
    )
    commande.lignes = lignes.map(l => ({ ...l, produit: { id: l.produit_id, nom: l.produit_nom, image_url: l.image_url } }))
    commande.adresse = { description_lieu: commande.description_lieu, latitude: commande.latitude, longitude: commande.longitude }
    res.json({ commande })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
