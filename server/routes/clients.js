const express = require('express')
const bcrypt = require('bcryptjs')
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

// GET /api/clients/adresses
router.get('/adresses', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM adresses WHERE client_id=$1 ORDER BY principale DESC, id ASC',
      [req.user.id]
    )
    res.json({ adresses: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// POST /api/clients/adresses
router.post('/adresses', authMiddleware, async (req, res) => {
  const { libelle, latitude, longitude, description_lieu, principale } = req.body
  if (!description_lieu?.trim()) return res.status(400).json({ message: 'Description requise' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO adresses (client_id, libelle, latitude, longitude, description_lieu, principale) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.id, libelle || 'Adresse', latitude, longitude, description_lieu, principale || false]
    )
    res.status(201).json({ adresse: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/clients/adresses/:id
router.put('/adresses/:id', authMiddleware, async (req, res) => {
  const { libelle, latitude, longitude, description_lieu } = req.body
  try {
    // Construire la mise à jour dynamiquement
    const updates = []
    const values = []
    let pi = 1

    if (libelle !== undefined) { updates.push(`libelle=$${pi++}`); values.push(libelle) }
    if (latitude !== undefined) { updates.push(`latitude=$${pi++}`); values.push(latitude) }
    if (longitude !== undefined) { updates.push(`longitude=$${pi++}`); values.push(longitude) }
    if (description_lieu !== undefined) { updates.push(`description_lieu=$${pi++}`); values.push(description_lieu) }

    if (updates.length === 0) return res.status(400).json({ message: 'Aucun champ à mettre à jour' })

    values.push(req.params.id)
    values.push(req.user.id)

    const { rows } = await pool.query(
      `UPDATE adresses SET ${updates.join(', ')} WHERE id=$${pi} AND client_id=$${pi + 1} RETURNING *`,
      values
    )
    if (!rows[0]) return res.status(404).json({ message: 'Adresse introuvable' })
    res.json({ adresse: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/clients/adresses/:id
router.delete('/adresses/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM adresses WHERE id=$1 AND client_id=$2', [req.params.id, req.user.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/clients/profil
router.put('/profil', authMiddleware, async (req, res) => {
  const { nom, whatsapp } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE clients SET nom=$1, whatsapp=$2 WHERE id=$3 RETURNING id, nom, telephone, email, type_client, whatsapp, role',
      [nom, whatsapp, req.user.id]
    )
    res.json({ client: rows[0] })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/clients/mot-de-passe
router.put('/mot-de-passe', authMiddleware, async (req, res) => {
  const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body
  if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
    return res.status(400).json({ message: 'Mot de passe trop court' })
  }
  try {
    const { rows } = await pool.query('SELECT mot_de_passe_hash FROM clients WHERE id=$1', [req.user.id])
    const valid = await bcrypt.compare(mot_de_passe_actuel, rows[0].mot_de_passe_hash)
    if (!valid) return res.status(401).json({ message: 'Mot de passe actuel incorrect' })
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 12)
    await pool.query('UPDATE clients SET mot_de_passe_hash=$1, mot_de_passe_clair=$2 WHERE id=$3', [hash, nouveau_mot_de_passe, req.user.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

module.exports = router
