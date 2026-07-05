const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const pool = require('../db')
const { adminMiddleware } = require('../middleware/auth')
const router = express.Router()

// Config stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const prefix = file.mimetype.startsWith('video/') ? 'video' : 'photo'
    cb(null, `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif',
                   'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  if (allowed.includes(file.mimetype)) cb(null, true)
  else cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
})

// Obtenir la durée d'une vidéo en secondes (via ffprobe si disponible, sinon skip)
function getVideoDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).toString().trim()
    return parseFloat(result)
  } catch {
    // ffprobe non disponible — on accepte sans vérifier
    return null
  }
}

// POST /api/medias/produit/:id — Upload photos/vidéo
router.post('/produit/:id', adminMiddleware, upload.fields([
  { name: 'photos', maxCount: 4 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  const produitId = req.params.id
  const { remplacer } = req.body // "true" = supprimer anciens médias avant

  try {
    // Vérifier que le produit existe
    const prodCheck = await pool.query('SELECT id FROM produits WHERE id=$1', [produitId])
    if (!prodCheck.rows[0]) return res.status(404).json({ message: 'Produit introuvable' })

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Supprimer les anciens médias si demandé
      if (remplacer === 'true') {
        const old = await client.query('SELECT url FROM produit_medias WHERE produit_id=$1', [produitId])
        for (const row of old.rows) {
          const filePath = path.join(__dirname, '..', row.url)
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath) } catch {}
          }
        }
        await client.query('DELETE FROM produit_medias WHERE produit_id=$1', [produitId])
      }

      // Compter les médias existants
      const existing = await client.query(
        'SELECT COUNT(*) FROM produit_medias WHERE produit_id=$1 AND type=$2',
        [produitId, 'photo']
      )
      const photoCount = parseInt(existing.rows[0].count)

      const errors = []
      const added = []

      // Traiter les photos
      if (req.files?.photos) {
        const remaining = 4 - photoCount
        const photosToAdd = req.files.photos.slice(0, remaining)

        if (req.files.photos.length > remaining) {
          errors.push(`Maximum 4 photos par produit. Seules ${remaining} photo(s) ajoutée(s).`)
          // Supprimer les photos en trop
          for (let i = remaining; i < req.files.photos.length; i++) {
            try { fs.unlinkSync(req.files.photos[i].path) } catch {}
          }
        }

        for (let i = 0; i < photosToAdd.length; i++) {
          const file = photosToAdd[i]
          const url = `/uploads/${file.filename}`
          const ordre = photoCount + i
          await client.query(
            'INSERT INTO produit_medias (produit_id, type, url, ordre) VALUES ($1,$2,$3,$4)',
            [produitId, 'photo', url, ordre]
          )
          added.push({ type: 'photo', url })
        }

        // Mettre à jour image_url principale avec la première photo
        if (photosToAdd.length > 0 && photoCount === 0) {
          await client.query(
            'UPDATE produits SET image_url=$1 WHERE id=$2',
            [`/uploads/${photosToAdd[0].filename}`, produitId]
          )
        }
      }

      // Traiter la vidéo
      if (req.files?.video?.[0]) {
        const videoFile = req.files.video[0]
        const videoPath = videoFile.path

        // Vérifier la durée (max 15 secondes)
        const duree = getVideoDuration(videoPath)
        if (duree !== null && duree > 15) {
          fs.unlinkSync(videoPath)
          errors.push(`La vidéo dépasse 15 secondes (${Math.round(duree)}s). Elle n'a pas été enregistrée.`)
        } else {
          // Supprimer l'ancienne vidéo si elle existe
          const oldVideo = await client.query(
            'SELECT url FROM produit_medias WHERE produit_id=$1 AND type=$2',
            [produitId, 'video']
          )
          if (oldVideo.rows[0]) {
            const oldPath = path.join(__dirname, '..', oldVideo.rows[0].url)
            if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath) } catch {}
            await client.query('DELETE FROM produit_medias WHERE produit_id=$1 AND type=$2', [produitId, 'video'])
          }

          const url = `/uploads/${videoFile.filename}`
          await client.query(
            'INSERT INTO produit_medias (produit_id, type, url, ordre) VALUES ($1,$2,$3,$4)',
            [produitId, 'video', url, 0]
          )
          added.push({ type: 'video', url })
        }
      }

      await client.query('COMMIT')

      // Retourner tous les médias du produit
      const { rows: medias } = await pool.query(
        'SELECT * FROM produit_medias WHERE produit_id=$1 ORDER BY type DESC, ordre ASC',
        [produitId]
      )

      res.json({ success: true, medias, added, errors: errors.length > 0 ? errors : undefined })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Erreur upload médias:', err)
    // Nettoyer les fichiers uploadés en cas d'erreur
    if (req.files?.photos) req.files.photos.forEach(f => { try { fs.unlinkSync(f.path) } catch {} })
    if (req.files?.video) req.files.video.forEach(f => { try { fs.unlinkSync(f.path) } catch {} })
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

// GET /api/medias/produit/:id — Récupérer les médias
router.get('/produit/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM produit_medias WHERE produit_id=$1 ORDER BY type DESC, ordre ASC',
      [req.params.id]
    )
    res.json({ medias: rows })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/medias/:id — Supprimer un média
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produit_medias WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Média introuvable' })

    const media = rows[0]
    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', media.url)
    if (fs.existsSync(filePath)) try { fs.unlinkSync(filePath) } catch {}

    await pool.query('DELETE FROM produit_medias WHERE id=$1', [req.params.id])

    // Si c'était une photo, mettre à jour image_url du produit
    if (media.type === 'photo') {
      const { rows: remaining } = await pool.query(
        'SELECT url FROM produit_medias WHERE produit_id=$1 AND type=$2 ORDER BY ordre ASC LIMIT 1',
        [media.produit_id, 'photo']
      )
      const newImageUrl = remaining[0]?.url || null
      await pool.query('UPDATE produits SET image_url=$1 WHERE id=$2', [newImageUrl, media.produit_id])
    }

    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/medias/produit/:id/ordre — Réordonner les photos
router.put('/produit/:id/ordre', adminMiddleware, async (req, res) => {
  const { ordre } = req.body // [{ id: 1, ordre: 0 }, { id: 2, ordre: 1 }]
  try {
    for (const item of ordre) {
      await pool.query('UPDATE produit_medias SET ordre=$1 WHERE id=$2 AND produit_id=$3',
        [item.ordre, item.id, req.params.id])
    }
    // Mettre à jour image_url avec la première photo
    const { rows } = await pool.query(
      'SELECT url FROM produit_medias WHERE produit_id=$1 AND type=$2 ORDER BY ordre ASC LIMIT 1',
      [req.params.id, 'photo']
    )
    if (rows[0]) await pool.query('UPDATE produits SET image_url=$1 WHERE id=$2', [rows[0].url, req.params.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
