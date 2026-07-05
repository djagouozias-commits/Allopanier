const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const router = express.Router()

function normaliserTelephone(tel) {
  const clean = String(tel || '').replace(/\D/g, '')
  if (!/^01[0-9]{8}$/.test(clean)) return null
  return clean
}

function genToken(client) {
  return jwt.sign(
    { id: client.id, telephone: client.telephone, role: client.role || 'client' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  )
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nom, telephone, email, mot_de_passe, type_client, whatsapp, adresse } = req.body

  if (!nom?.trim()) return res.status(400).json({ message: 'Nom requis' })
  const telNorm = normaliserTelephone(telephone)
  if (!telNorm) return res.status(400).json({ message: 'Numéro invalide — format : 01 + 8 chiffres (ex: 0168204654)' })
  if (!mot_de_passe || mot_de_passe.length < 6) return res.status(400).json({ message: 'Mot de passe trop court (min. 6 caractères)' })

  const whatsappNorm = whatsapp ? normaliserTelephone(whatsapp) : telNorm
  if (whatsapp && !whatsappNorm) return res.status(400).json({ message: 'Numéro WhatsApp invalide' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const existing = await client.query('SELECT id FROM clients WHERE telephone = $1', [telNorm])
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ message: 'Ce numéro est déjà associé à un compte' })
    }

    const hash = await bcrypt.hash(mot_de_passe, 12)
    const { rows } = await client.query(
      `INSERT INTO clients (nom, telephone, email, mot_de_passe_hash, mot_de_passe_clair, type_client, whatsapp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nom, telephone, email, type_client, whatsapp, role`,
      [nom.trim(), telNorm, email || null, hash, mot_de_passe, type_client || 'particulier', whatsappNorm || telNorm]
    )
    const newClient = rows[0]

    if (adresse?.description_lieu) {
      await client.query(
        `INSERT INTO adresses (client_id, libelle, latitude, longitude, description_lieu, principale)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [newClient.id, adresse.libelle || 'Adresse principale', adresse.latitude, adresse.longitude, adresse.description_lieu]
      )
    }

    await client.query('COMMIT')
    const token = genToken(newClient)
    res.status(201).json({ token, client: newClient })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Erreur register:', err)
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' })
  } finally {
    client.release()
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { telephone, mot_de_passe } = req.body
  const telNorm = normaliserTelephone(telephone)
  if (!telNorm || !mot_de_passe) return res.status(400).json({ message: 'Identifiants requis' })

  try {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE telephone = $1',
      [telNorm]
    )
    const client = rows[0]
    if (!client) return res.status(401).json({ message: 'Identifiants incorrects' })
    if (!client.actif) return res.status(403).json({ message: 'Ce compte est désactivé' })

    const valid = await bcrypt.compare(mot_de_passe, client.mot_de_passe_hash)
    if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })

    const { mot_de_passe_hash, ...safeClient } = client
    const token = genToken(safeClient)
    res.json({ token, client: safeClient })
  } catch (err) {
    console.error('Erreur login:', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
