const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// Upload médias vendeurs/produits promo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'promo')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `promo-${Date.now()}${ext}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 30 * 1024 * 1024 } })

// Calcul prix du jour pour un produit promo
function calculerPrixDuJour(produit) {
  const auj = new Date()
  const expiration = new Date(produit.date_expiration)
  const creation = new Date(produit.date_creation)

  const totalJours = Math.max(1, Math.ceil((expiration - creation) / (1000 * 60 * 60 * 24)))
  const joursEcoules = Math.max(0, Math.ceil((auj - creation) / (1000 * 60 * 60 * 24)))
  const joursRestants = Math.max(0, Math.ceil((expiration - auj) / (1000 * 60 * 60 * 24)))

  const prixDebut = parseFloat(produit.prix_promo_debut)
  const prixFin = parseFloat(produit.prix_promo_fin)

  // Interpolation linéaire décroissante
  const progression = Math.min(1, joursEcoules / totalJours)
  const prixDuJour = Math.round(prixDebut - (prixDebut - prixFin) * progression)

  // Pourcentage de réduction par rapport au prix normal
  const prixNormal = parseFloat(produit.prix_normal) || prixDebut
  const reductionPct = prixNormal > 0 ? Math.round(((prixNormal - prixDuJour) / prixNormal) * 100) : 0

  return { prixDuJour, joursRestants, reductionPct, prixDebut, prixFin }
}

// === VENDEURS ===

// POST /api/promoflash/vendeurs/register
router.post('/vendeurs/register', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { nom, telephone, email, mot_de_passe, type_vendeur, description, adresse_description, latitude, longitude } = req.body
  if (!nom?.trim()) return res.status(400).json({ message: 'Nom requis' })
  if (!telephone) return res.status(400).json({ message: 'Téléphone requis' })
  if (!mot_de_passe || mot_de_passe.length < 6) return res.status(400).json({ message: 'Mot de passe trop court' })

  try {
    const ex = await pool.query('SELECT id FROM vendeurs WHERE telephone=$1', [telephone])
    if (ex.rows.length > 0) return res.status(409).json({ message: 'Ce numéro est déjà utilisé' })

    const hash = await bcrypt.hash(mot_de_passe, 12)
    const photoUrl = req.files?.photo?.[0] ? `/uploads/promo/${req.files.photo[0].filename}` : null
    const videoUrl = req.files?.video?.[0] ? `/uploads/promo/${req.files.video[0].filename}` : null

    const { rows } = await pool.query(
      `INSERT INTO vendeurs (nom, telephone, email, mot_de_passe_hash, type_vendeur, description, photo_url, video_url, adresse_description, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, nom, telephone, type_vendeur, actif, valide_admin`,
      [nom.trim(), telephone, email || null, hash, type_vendeur || 'particulier', description || null, photoUrl, videoUrl, adresse_description || null, latitude || null, longitude || null]
    )
    const token = jwt.sign({ id: rows[0].id, role: 'vendeur', telephone }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ vendeur: rows[0], token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/promoflash/vendeurs/login
router.post('/vendeurs/login', async (req, res) => {
  const { telephone, mot_de_passe } = req.body
  try {
    const { rows } = await pool.query('SELECT * FROM vendeurs WHERE telephone=$1', [telephone])
    if (!rows[0]) return res.status(401).json({ message: 'Identifiants incorrects' })
    if (!rows[0].actif) return res.status(403).json({ message: 'Compte désactivé' })
    const valid = await bcrypt.compare(mot_de_passe, rows[0].mot_de_passe_hash)
    if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })
    const { mot_de_passe_hash, ...v } = rows[0]
    const token = jwt.sign({ id: v.id, role: 'vendeur', telephone }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.json({ vendeur: v, token })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// Middleware vendeur
function vendeurMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Token requis' })
  try {
    const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    if (payload.role !== 'vendeur' && payload.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
    req.vendeur = payload
    next()
  } catch { res.status(401).json({ message: 'Token invalide' }) }
}

// GET /api/promoflash/vendeurs/moi
router.get('/vendeurs/moi', vendeurMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nom, telephone, email, type_vendeur, description, photo_url, video_url, adresse_description, latitude, longitude, actif, valide_admin FROM vendeurs WHERE id=$1', [req.vendeur.id])
    res.json({ vendeur: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// === PRODUITS PROMO ===

// GET /api/promoflash/produits — liste publique (actifs + non expirés)
router.get('/produits', async (req, res) => {
  try {
    const { q, vendeur_id, limit = 20, page = 1 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conds = ['pp.actif = TRUE', 'pp.date_expiration >= CURRENT_DATE', 'v.actif = TRUE', 'v.valide_admin = TRUE']
    const params = []
    let pi = 1
    if (q) { conds.push(`(pp.nom ILIKE $${pi} OR v.nom ILIKE $${pi})`); params.push(`%${q}%`); pi++ }
    if (vendeur_id) { conds.push(`pp.vendeur_id=$${pi++}`); params.push(parseInt(vendeur_id)) }

    const count = await pool.query(`SELECT COUNT(*) FROM promo_produits pp JOIN vendeurs v ON v.id=pp.vendeur_id WHERE ${conds.join(' AND ')}`, params)
    const { rows } = await pool.query(
      `SELECT pp.*, v.nom as vendeur_nom, v.type_vendeur, v.photo_url as vendeur_photo, v.adresse_description as vendeur_adresse, v.latitude as vendeur_lat, v.longitude as vendeur_lng
       FROM promo_produits pp
       JOIN vendeurs v ON v.id = pp.vendeur_id
       WHERE ${conds.join(' AND ')}
       ORDER BY pp.date_expiration ASC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    )
    const produitsAvecPrix = rows.map(p => ({ ...p, ...calculerPrixDuJour(p) }))
    res.json({ produits: produitsAvecPrix, total: parseInt(count.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/promoflash/produits/:id
router.get('/produits/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pp.*, v.nom as vendeur_nom, v.type_vendeur, v.telephone as vendeur_telephone, v.photo_url as vendeur_photo, v.video_url as vendeur_video, v.adresse_description as vendeur_adresse, v.latitude as vendeur_lat, v.longitude as vendeur_lng, v.description as vendeur_description
       FROM promo_produits pp JOIN vendeurs v ON v.id=pp.vendeur_id
       WHERE pp.id=$1`, [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Produit introuvable' })
    res.json({ produit: { ...rows[0], ...calculerPrixDuJour(rows[0]) } })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// POST /api/promoflash/produits (vendeur)
router.post('/produits', vendeurMiddleware, upload.fields([{ name: 'photo', maxCount: 4 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  const { nom, description, date_expiration, prix_normal, prix_promo_debut, prix_promo_fin, quantite_disponible } = req.body

  if (!nom?.trim()) return res.status(400).json({ message: 'Nom requis' })
  if (!date_expiration) return res.status(400).json({ message: 'Date expiration requise' })
  if (!prix_promo_debut || !prix_promo_fin) return res.status(400).json({ message: 'Prix promo requis' })

  // Vérifier max 10 jours
  const exp = new Date(date_expiration)
  const auj = new Date()
  const diffJours = Math.ceil((exp - auj) / (1000 * 60 * 60 * 24))
  if (diffJours > 10) return res.status(400).json({ message: `Date d'expiration trop lointaine (${diffJours} jours). Maximum 10 jours.` })
  if (diffJours < 0) return res.status(400).json({ message: 'Date d\'expiration déjà passée' })

  const photoUrl = req.files?.photo?.[0] ? `/uploads/promo/${req.files.photo[0].filename}` : null
  const videoUrl = req.files?.video?.[0] ? `/uploads/promo/${req.files.video[0].filename}` : null

  try {
    const { rows } = await pool.query(
      `INSERT INTO promo_produits (vendeur_id, nom, description, photo_url, video_url, date_expiration, prix_normal, prix_promo_debut, prix_promo_fin, quantite_disponible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.vendeur.id, nom.trim(), description || null, photoUrl, videoUrl, date_expiration, prix_normal || null, parseFloat(prix_promo_debut), parseFloat(prix_promo_fin), parseInt(quantite_disponible) || 1]
    )
    res.status(201).json({ produit: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/promoflash/vendeurs/:id/produits
router.get('/vendeurs/:id/produits', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pp.*, v.nom as vendeur_nom FROM promo_produits pp JOIN vendeurs v ON v.id=pp.vendeur_id WHERE pp.vendeur_id=$1 ORDER BY pp.date_expiration ASC`,
      [req.params.id]
    )
    const produitsAvecPrix = rows.map(p => ({ ...p, ...calculerPrixDuJour(p) }))
    res.json({ produits: produitsAvecPrix })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/promoflash/mes-produits (vendeur connecté)
router.get('/mes-produits', vendeurMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM promo_produits WHERE vendeur_id=$1 ORDER BY date_expiration ASC`,
      [req.vendeur.id]
    )
    res.json({ produits: rows.map(p => ({ ...p, ...calculerPrixDuJour(p) })) })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// DELETE /api/promoflash/produits/:id (vendeur)
router.delete('/produits/:id', vendeurMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE promo_produits SET actif=FALSE WHERE id=$1 AND vendeur_id=$2', [req.params.id, req.vendeur.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// === ADMIN PROMOFLASH ===

// GET /api/promoflash/admin/vendeurs
router.get('/admin/vendeurs', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT v.*, COUNT(pp.id) as nb_produits
      FROM vendeurs v LEFT JOIN promo_produits pp ON pp.vendeur_id=v.id AND pp.actif=TRUE
      GROUP BY v.id ORDER BY v.date_inscription DESC
    `)
    res.json({ vendeurs: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/promoflash/admin/vendeurs/:id — activer/désactiver/valider
router.put('/admin/vendeurs/:id', adminMiddleware, async (req, res) => {
  const { actif, valide_admin } = req.body
  try {
    const sets = []
    const params = []
    let pi = 1
    if (actif !== undefined) { sets.push(`actif=$${pi++}`); params.push(actif) }
    if (valide_admin !== undefined) { sets.push(`valide_admin=$${pi++}`); params.push(valide_admin) }
    if (sets.length === 0) return res.status(400).json({ message: 'Rien à modifier' })
    params.push(req.params.id)
    await pool.query(`UPDATE vendeurs SET ${sets.join(',')} WHERE id=$${pi}`, params)
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// POST /api/promoflash/commandes — enregistrer une commande PromoFlash (retrait soi-même ou AlloPanier)
router.post('/commandes', async (req, res) => {
  const { mode = 'retrait_soi_meme', total = 0, lignes = [], nb_boutiques_visitees, nb_boutiques_total, client_id } = req.body

  // Récupérer le client depuis le token si disponible
  let clientId = client_id || null
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
      clientId = payload.id
    } catch {}
  }

  try {
    // Générer un code unique
    const code = `PF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`

    const { rows } = await pool.query(
      `INSERT INTO promoflash_commandes (code_commande, client_id, mode, statut, total, nb_boutiques_visitees, nb_boutiques_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code, clientId, mode, 'TERMINE', parseFloat(total) || 0, nb_boutiques_visitees || 0, nb_boutiques_total || 0]
    )
    const commande = rows[0]

    // Insérer les lignes
    for (const l of lignes) {
      await pool.query(
        `INSERT INTO promoflash_lignes (commande_id, produit_id, vendeur_id, prix_applique, quantite, nom_produit, vendeur_nom)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [commande.id, l.produit_id || null, l.vendeur_id || null, parseFloat(l.prix_applique) || 0, parseInt(l.quantite) || 1, l.nom_produit || '', l.vendeur_nom || '']
      )
    }

    res.status(201).json({ commande, code })
  } catch (err) {
    console.error('Erreur commande PromoFlash:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/promoflash/mes-commandes — historique PromoFlash du client connecté
router.get('/mes-commandes', async (req, res) => {
  let clientId = null
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
      clientId = payload.id
    } catch {}
  }
  if (!clientId) return res.status(401).json({ message: 'Non authentifié' })

  try {
    const { rows } = await pool.query(
      `SELECT * FROM promoflash_commandes WHERE client_id=$1 ORDER BY created_at DESC`,
      [clientId]
    )
    // Charger les lignes pour chaque commande
    for (const cmd of rows) {
      const { rows: lignes } = await pool.query(
        `SELECT * FROM promoflash_lignes WHERE commande_id=$1`,
        [cmd.id]
      )
      cmd.lignes = lignes
    }
    res.json({ commandes: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
module.exports.calculerPrixDuJour = calculerPrixDuJour
