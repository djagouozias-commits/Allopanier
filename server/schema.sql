-- AlloPanier — Schéma PostgreSQL complet

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  telephone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(200),
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  mot_de_passe_clair VARCHAR(255),
  type_client VARCHAR(50) DEFAULT 'particulier',
  whatsapp VARCHAR(20),
  role VARCHAR(20) DEFAULT 'client',
  date_inscription TIMESTAMP DEFAULT NOW(),
  actif BOOLEAN DEFAULT TRUE
);

-- Adresses clients
CREATE TABLE IF NOT EXISTS adresses (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  libelle VARCHAR(100),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  description_lieu TEXT NOT NULL,
  principale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Catégories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  icone VARCHAR(10) DEFAULT '🛒',
  ordre_affichage INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Produits
CREATE TABLE IF NOT EXISTS produits (
  id SERIAL PRIMARY KEY,
  categorie_id INTEGER REFERENCES categories(id),
  nom VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  poids_unitaire_kg DECIMAL(8,3) DEFAULT 0,
  prix_unitaire DECIMAL(10,0) NOT NULL,
  prix_gros DECIMAL(10,0),
  seuil_gros INTEGER,
  label_gros VARCHAR(100),
  has_sachet BOOLEAN DEFAULT FALSE,
  prix_sachet DECIMAL(10,0),
  qte_sachet INTEGER,
  poids_sachet_kg DECIMAL(8,3),
  has_boite BOOLEAN DEFAULT FALSE,
  prix_boite DECIMAL(10,0),
  qte_boite INTEGER,
  poids_boite_kg DECIMAL(8,3),
  has_sac BOOLEAN DEFAULT FALSE,
  prix_sac DECIMAL(10,0),
  qte_sac INTEGER,
  poids_sac_kg DECIMAL(8,3),
  has_carton BOOLEAN DEFAULT FALSE,
  prix_carton DECIMAL(10,0),
  qte_carton INTEGER,
  poids_carton_kg DECIMAL(8,3),
  stock BOOLEAN DEFAULT TRUE,
  stock_min INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT TRUE,
  date_creation TIMESTAMP DEFAULT NOW()
);

-- Circuits
CREATE TABLE IF NOT EXISTS circuits (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  couleur VARCHAR(20) DEFAULT '#2E7D32',
  zone_geojson JSONB,
  jour VARCHAR(20),
  tranche_horaire VARCHAR(20),
  depart_latitude DECIMAL(10,7),
  depart_longitude DECIMAL(10,7),
  statut_livraison VARCHAR(20) DEFAULT 'PLANIFIE',
  route_geojson JSONB,
  date_termine TIMESTAMP,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Commandes
CREATE TABLE IF NOT EXISTS commandes (
  id SERIAL PRIMARY KEY,
  code_commande VARCHAR(20) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  adresse_id INTEGER REFERENCES adresses(id),
  statut VARCHAR(20) DEFAULT 'EN_ATTENTE',
  jour_livraison VARCHAR(20),
  tranche_horaire VARCHAR(20),
  est_jour_exceptionnel BOOLEAN DEFAULT FALSE,
  sous_total DECIMAL(10,0) DEFAULT 0,
  poids_total_kg DECIMAL(10,3) DEFAULT 0,
  frais_livraison DECIMAL(10,0) DEFAULT 0,
  total DECIMAL(10,0) DEFAULT 0,
  note_livraison TEXT,
  circuit_id INTEGER REFERENCES circuits(id),
  ordre_dans_circuit INTEGER,
  date_commande TIMESTAMP DEFAULT NOW(),
  date_livraison_effective TIMESTAMP
);

-- Lignes de commande
CREATE TABLE IF NOT EXISTS lignes_commande (
  id SERIAL PRIMARY KEY,
  commande_id INTEGER REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id INTEGER REFERENCES produits(id),
  type_achat VARCHAR(20) DEFAULT 'unite',
  quantite INTEGER NOT NULL,
  prix_unitaire_applique DECIMAL(10,0),
  est_prix_gros BOOLEAN DEFAULT FALSE,
  sous_total DECIMAL(10,0),
  poids_total_kg DECIMAL(10,3)
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_commandes_client ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_jour ON commandes(jour_livraison);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_adresses_client ON adresses(client_id);

-- Paramètres du site (vidéo publicitaire, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  cle VARCHAR(100) PRIMARY KEY,
  valeur TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Médias produits
CREATE TABLE IF NOT EXISTS produit_medias (
  id SERIAL PRIMARY KEY,
  produit_id INTEGER REFERENCES produits(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Données de départ : catégories
INSERT INTO categories (nom, icone, ordre_affichage) VALUES
  ('Céréales et féculents', '🌽', 1),
  ('Légumes frais', '🥬', 2),
  ('Fruits frais', '🍎', 3),
  ('Produits de nettoyage', '🧹', 4),
  ('Savons et hygiène', '🧼', 5),
  ('Électronique de cuisine', '🔌', 6),
  ('Ventilateurs', '💨', 7),
  ('Réfrigérateurs et congélateurs', '❄️', 8),
  ('Lave-linges', '👕', 9),
  ('Autres électroménagers', '🏠', 10)
ON CONFLICT DO NOTHING;
