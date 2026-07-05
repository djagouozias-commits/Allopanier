const express = require('express')
const pool = require('../db')
const { adminMiddleware } = require('../middleware/auth')
const router = express.Router()

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true'
    const { rows } = await pool.query(
      `SELECT * FROM categories ${all ? '' : 'WHERE actif = TRUE'} ORDER BY ordre_affichage ASC, nom ASC`
    )
    res.json({ categories: rows })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/categories (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { nom, icone, ordre_affichage, actif } = req.body
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (nom, icone, ordre_affichage, actif) VALUES ($1,$2,$3,$4) RETURNING *',
      [nom, icone || '🛒', ordre_affichage || 0, actif !== false]
    )
    res.status(201).json({ categorie: rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/categories/:id (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { nom, icone, ordre_affichage, actif } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE categories SET nom=$1, icone=$2, ordre_affichage=$3, actif=$4 WHERE id=$5 RETURNING *',
      [nom, icone, ordre_affichage, actif, req.params.id]
    )
    res.json({ categorie: rows[0] })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/categories/:id (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const check = await pool.query('SELECT COUNT(*) FROM produits WHERE categorie_id=$1', [req.params.id])
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(409).json({ message: 'Des produits utilisent cette catégorie' })
    }
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
