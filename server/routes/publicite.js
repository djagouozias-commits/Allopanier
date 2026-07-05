const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const pool = require('../db')
const { adminMiddleware } = require('../middleware/auth')
const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'publicite')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `pub-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Seules les vidéos MP4, WebM ou MOV sont acceptées'), false)
  },
})

async function getSetting(cle) {
  const { rows } = await pool.query('SELECT valeur FROM site_settings WHERE cle=$1', [cle])
  return rows[0]?.valeur || null
}

async function setSetting(cle, valeur) {
  await pool.query(
    `INSERT INTO site_settings (cle, valeur, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (cle) DO UPDATE SET valeur=$2, updated_at=NOW()`,
    [cle, valeur]
  )
}

// GET /api/publicite — public
router.get('/', async (req, res) => {
  try {
    const [videoUrl, actif] = await Promise.all([
      getSetting('video_pub_url'),
      getSetting('video_pub_actif'),
    ])
    res.json({
      video_url: videoUrl,
      actif: actif !== 'false' && !!videoUrl,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/publicite/admin
router.get('/admin', adminMiddleware, async (req, res) => {
  try {
    const [videoUrl, actif] = await Promise.all([
      getSetting('video_pub_url'),
      getSetting('video_pub_actif'),
    ])
    res.json({
      video_url: videoUrl,
      actif: actif !== 'false',
    })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/publicite/admin/video
router.post('/admin/video', adminMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucune vidéo reçue' })

    const oldUrl = await getSetting('video_pub_url')
    if (oldUrl) {
      const oldPath = path.join(__dirname, '..', oldUrl.replace(/^\//, ''))
      if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath) } catch {}
    }

    const url = `/uploads/publicite/${req.file.filename}`
    await setSetting('video_pub_url', url)
    await setSetting('video_pub_actif', 'true')

    res.json({ success: true, video_url: url, actif: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message || 'Erreur serveur' })
  }
})

// PUT /api/publicite/admin/actif
router.put('/admin/actif', adminMiddleware, async (req, res) => {
  try {
    const { actif } = req.body
    await setSetting('video_pub_actif', actif ? 'true' : 'false')
    res.json({ success: true, actif: !!actif })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/publicite/admin/video
router.delete('/admin/video', adminMiddleware, async (req, res) => {
  try {
    const oldUrl = await getSetting('video_pub_url')
    if (oldUrl) {
      const oldPath = path.join(__dirname, '..', oldUrl.replace(/^\//, ''))
      if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath) } catch {}
    }
    await setSetting('video_pub_url', '')
    await setSetting('video_pub_actif', 'false')
    res.json({ success: true })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
