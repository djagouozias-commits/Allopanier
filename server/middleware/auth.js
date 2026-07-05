const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant' })
  }
  try {
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' })
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Accès réservé aux administrateurs' })
    }
    next()
  })
}

module.exports = { authMiddleware, adminMiddleware }
