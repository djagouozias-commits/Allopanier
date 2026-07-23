require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const pool = require('./db')

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        /\.netlify\.app$/,
        /\.vercel\.app$/,
        /\.onrender\.com$/,
      ].filter(Boolean)
    : true,
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Fichiers statiques uploads — avec headers CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  next()
}, express.static(path.join(__dirname, 'uploads')))

// Routes API
app.use('/api/auth', require('./routes/auth'))
app.use('/api/categories', require('./routes/categories'))
app.use('/api/produits', require('./routes/produits'))
app.use('/api/commandes', require('./routes/commandes'))
app.use('/api/clients', require('./routes/clients'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/medias', require('./routes/medias'))
app.use('/api/promoflash', require('./routes/promoflash'))
app.use('/api/publicite', require('./routes/publicite'))
app.use('/api/vip', require('./routes/vip'))

// Santé
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// En production : servir le build React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

// Gestion d'erreurs globale
app.use((err, req, res, next) => {
  console.error('Erreur non gérée :', err.message)
  res.status(500).json({ message: 'Erreur serveur interne' })
})

// Initialisation DB et démarrage
async function start() {
  try {
    await pool.query('SELECT 1')
    console.log('PostgreSQL connecté')

    // Tables complémentaires (migrations légères)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        cle VARCHAR(100) PRIMARY KEY,
        valeur TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS produit_medias (
        id SERIAL PRIMARY KEY,
        produit_id INTEGER REFERENCES produits(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        url TEXT NOT NULL,
        ordre INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS tranche_horaire VARCHAR(20);
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS depart_latitude DECIMAL(10,7);
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS depart_longitude DECIMAL(10,7);
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS statut_livraison VARCHAR(20) DEFAULT 'PLANIFIE';
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS route_geojson JSONB;
      ALTER TABLE circuits ADD COLUMN IF NOT EXISTS date_termine TIMESTAMP;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS mot_de_passe_clair VARCHAR(255);

      CREATE TABLE IF NOT EXISTS promoflash_vendeurs (
        id SERIAL PRIMARY KEY,
        client_id INTEGER UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
        nom_boutique VARCHAR(200) NOT NULL,
        type_vendeur VARCHAR(50) DEFAULT 'particulier',
        description TEXT,
        photo_url TEXT,
        video_url TEXT,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        description_lieu TEXT,
        actif BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS promoflash_produits (
        id SERIAL PRIMARY KEY,
        vendeur_id INTEGER REFERENCES promoflash_vendeurs(id) ON DELETE CASCADE,
        nom VARCHAR(200) NOT NULL,
        prix_normal DECIMAL(10,0) NOT NULL,
        prix_promo_debut DECIMAL(10,0) NOT NULL,
        prix_promo_fin DECIMAL(10,0) NOT NULL,
        date_expiration DATE NOT NULL,
        quantite INTEGER DEFAULT 1,
        quantite_restante INTEGER DEFAULT 1,
        image_url TEXT,
        video_url TEXT,
        actif BOOLEAN DEFAULT TRUE,
        vendu BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS promoflash_commandes (
        id SERIAL PRIMARY KEY,
        code_commande VARCHAR(30) UNIQUE NOT NULL,
        client_id INTEGER REFERENCES clients(id),
        mode VARCHAR(20) DEFAULT 'retrait',
        statut VARCHAR(40) DEFAULT 'EN_ATTENTE_RETRAIT',
        total DECIMAL(10,0) DEFAULT 0,
        preuve_depot_url TEXT,
        depot_confirme BOOLEAN DEFAULT FALSE,
        client_lat DECIMAL(10,7),
        client_lng DECIMAL(10,7),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS promoflash_lignes (
        id SERIAL PRIMARY KEY,
        commande_id INTEGER REFERENCES promoflash_commandes(id) ON DELETE CASCADE,
        produit_id INTEGER REFERENCES promoflash_produits(id),
        vendeur_id INTEGER REFERENCES promoflash_vendeurs(id),
        prix_applique DECIMAL(10,0),
        quantite INTEGER DEFAULT 1
      );
    `)

    // Créer compte admin si inexistant
    const bcrypt = require('bcryptjs')
    const adminExists = await pool.query("SELECT id FROM clients WHERE role='admin' LIMIT 1")
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2024', 12)
      await pool.query(
        `INSERT INTO clients (nom, telephone, email, mot_de_passe_hash, role, type_client, whatsapp) 
         VALUES ('Administrateur', '0188441122', $1, $2, 'admin', 'admin', '0188441122')
         ON CONFLICT (telephone) DO NOTHING`,
        [process.env.ADMIN_EMAIL || 'admin@allopanier.bj', hash]
      )
      console.log('Compte admin créé — téléphone: 0188441122 / mdp: Admin@2024')
    }

    app.listen(PORT, () => {
      console.log(`Serveur AlloPanier démarré sur http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Impossible de démarrer :', err.message)
    console.log('\nVérifiez que PostgreSQL est démarré et que DATABASE_URL est correct dans .env')
    process.exit(1)
  }
}

start()
