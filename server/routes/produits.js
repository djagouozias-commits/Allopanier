const express = require('express')
const pool = require('../db')
const { adminMiddleware } = require('../middleware/auth')
const router = express.Router()

// GET /api/produits
router.get('/', async (req, res) => {
  try {
    const { q, categorie, limit = 20, page = 1, admin } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conditions = []
    const params = []
    let pi = 1

    if (!admin) {
      conditions.push(`p.actif = TRUE`)
    }
    if (q) {
      conditions.push(`(p.nom ILIKE $${pi} OR c.nom ILIKE $${pi})`)
      params.push(`%${q}%`)
      pi++
    }
    if (categorie) {
      conditions.push(`p.categorie_id = $${pi}`)
      params.push(parseInt(categorie))
      pi++
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const countQ = await pool.query(
      `SELECT COUNT(*) FROM produits p LEFT JOIN categories c ON c.id = p.categorie_id ${where}`,
      params
    )
    const { rows } = await pool.query(
      `SELECT p.*, c.nom as categorie_nom FROM produits p 
       LEFT JOIN categories c ON c.id = p.categorie_id
       ${where} ORDER BY p.date_creation DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    )

    res.json({ produits: rows, total: parseInt(countQ.rows[0].count), page: parseInt(page) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/produits/suggestions
router.get('/suggestions', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ suggestions: [] })
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT nom FROM produits WHERE actif = TRUE AND nom ILIKE $1 ORDER BY nom LIMIT 10`,
      [`%${q}%`]
    )
    res.json({ suggestions: rows.map(r => r.nom) })
  } catch {
    res.json({ suggestions: [] })
  }
})

// GET /api/produits/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.nom as categorie_nom FROM produits p
       LEFT JOIN categories c ON c.id = p.categorie_id
       WHERE p.id = $1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Produit introuvable' })
    res.json({ produit: rows[0] })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/produits (admin) — JSON body, sans image (médias gérés séparément)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const d = req.body

    const bool = v => v === true || v === 'true' || v === 1
    const num = v => (v !== null && v !== undefined && v !== '') ? parseFloat(v) : null
    const int = v => (v !== null && v !== undefined && v !== '') ? parseInt(v) : null

    const { rows } = await pool.query(
      `INSERT INTO produits (
        categorie_id, nom, description, image_url, poids_unitaire_kg,
        prix_unitaire, prix_gros, seuil_gros, label_gros,
        has_sachet, prix_sachet, qte_sachet, poids_sachet_kg,
        has_boite, prix_boite, qte_boite, poids_boite_kg,
        has_sac, prix_sac, qte_sac, poids_sac_kg,
        has_carton, prix_carton, qte_carton, poids_carton_kg,
        stock, stock_min, actif
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17,
        $18,$19,$20,$21,$22,$23,$24,$25,
        $26,$27,$28
      ) RETURNING *`,
      [
        int(d.categorie_id), d.nom?.trim(), d.description || null, d.image_url || null,
        num(d.poids_unitaire_kg) || 0,
        num(d.prix_unitaire), num(d.prix_gros), int(d.seuil_gros), d.label_gros || null,
        bool(d.has_sachet), num(d.prix_sachet), int(d.qte_sachet), num(d.poids_sachet_kg),
        bool(d.has_boite), num(d.prix_boite), int(d.qte_boite), num(d.poids_boite_kg),
        bool(d.has_sac), num(d.prix_sac), int(d.qte_sac), num(d.poids_sac_kg),
        bool(d.has_carton), num(d.prix_carton), int(d.qte_carton), num(d.poids_carton_kg),
        bool(d.stock) !== false, int(d.stock_min) || 0,
        bool(d.actif) !== false
      ]
    )
    res.status(201).json({ produit: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

// PUT /api/produits/:id (admin) — JSON body
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const d = req.body
    const existing = await pool.query('SELECT * FROM produits WHERE id=$1', [req.params.id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Produit introuvable' })

    const bool = v => v === true || v === 'true' || v === 1
    const num = v => (v !== null && v !== undefined && v !== '') ? parseFloat(v) : null
    const int = v => (v !== null && v !== undefined && v !== '') ? parseInt(v) : null

    await pool.query(
      `UPDATE produits SET
        categorie_id=$1, nom=$2, description=$3, poids_unitaire_kg=$4,
        prix_unitaire=$5, prix_gros=$6, seuil_gros=$7, label_gros=$8,
        has_sachet=$9, prix_sachet=$10, qte_sachet=$11, poids_sachet_kg=$12,
        has_boite=$13, prix_boite=$14, qte_boite=$15, poids_boite_kg=$16,
        has_sac=$17, prix_sac=$18, qte_sac=$19, poids_sac_kg=$20,
        has_carton=$21, prix_carton=$22, qte_carton=$23, poids_carton_kg=$24,
        stock=$25, stock_min=$26, actif=$27
      WHERE id=$28`,
      [
        int(d.categorie_id), d.nom?.trim(), d.description || null,
        num(d.poids_unitaire_kg) || 0,
        num(d.prix_unitaire), num(d.prix_gros), int(d.seuil_gros), d.label_gros || null,
        bool(d.has_sachet), num(d.prix_sachet), int(d.qte_sachet), num(d.poids_sachet_kg),
        bool(d.has_boite), num(d.prix_boite), int(d.qte_boite), num(d.poids_boite_kg),
        bool(d.has_sac), num(d.prix_sac), int(d.qte_sac), num(d.poids_sac_kg),
        bool(d.has_carton), num(d.prix_carton), int(d.qte_carton), num(d.poids_carton_kg),
        d.stock !== false && d.stock !== 'false',
        int(d.stock_min) || 0,
        d.actif !== false && d.actif !== 'false',
        req.params.id
      ]
    )
    const updated = await pool.query(
      'SELECT p.*, c.nom as categorie_nom FROM produits p LEFT JOIN categories c ON c.id=p.categorie_id WHERE p.id=$1',
      [req.params.id]
    )
    res.json({ produit: updated.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

// DELETE /api/produits/:id (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM produits WHERE id=$1', [req.params.id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Produit introuvable' })

    const cmd = await pool.query('SELECT COUNT(*) FROM lignes_commande WHERE produit_id=$1', [req.params.id])
    if (parseInt(cmd.rows[0].count) > 0) {
      await pool.query('UPDATE produits SET actif=FALSE WHERE id=$1', [req.params.id])
      return res.json({ success: true, desactive: true, message: 'Produit désactivé (présent dans des commandes passées)' })
    }

    await pool.query('DELETE FROM produit_medias WHERE produit_id=$1', [req.params.id])
    await pool.query('DELETE FROM produits WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
