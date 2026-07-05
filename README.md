# AlloPanier — Guide de démarrage

## DEMARRAGE RAPIDE (recommandé)

Double-cliquez sur le fichier :

```
start.bat
```

Le site s'ouvre automatiquement sur http://localhost:3000

Pour arrêter :
```
stop.bat
```

---

## DEMARRAGE MANUEL (2 terminaux séparés)

### Terminal 1 — Backend
```
cd c:\Users\DJAGOZ\Desktop\alopanier\server
node index.js
```
Message attendu : `PostgreSQL connecté` + `Serveur AlloPanier démarré sur http://localhost:5000`

### Terminal 2 — Frontend
```
cd c:\Users\DJAGOZ\Desktop\alopanier\client
npm run dev
```
Message attendu : `VITE ready` + `Local: http://localhost:3000/`

---

## ACCES

| Page              | URL                              |
|-------------------|----------------------------------|
| Site client       | http://localhost:3000            |
| Administration    | http://localhost:3000/admin      |

**Connexion admin :**
- Téléphone : `0000000000`
- Mot de passe : `Admin@2024`

---

## SI LE SITE NE FONCTIONNE PAS

### Vérifier PostgreSQL
```
sc query postgresql-x64-18
```
Si STATUS n'est pas RUNNING :
```
net start postgresql-x64-18
```

### Vérifier que la base existe
```
set PGPASSWORD=1234
psql -U postgres -c "\l" | findstr allopanier
```
Si elle n'existe pas :
```
psql -U postgres -c "CREATE DATABASE allopanier"
psql -U postgres -d allopanier -f c:\Users\DJAGOZ\Desktop\alopanier\server\schema.sql
```

### Port déjà utilisé
```
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```
Tuer le processus qui bloque :
```
taskkill /f /pid NUMERO_DU_PID
```

### Réinstaller les dépendances
```
cd c:\Users\DJAGOZ\Desktop\alopanier\server
npm install

cd c:\Users\DJAGOZ\Desktop\alopanier\client
npm install
```

---

## STRUCTURE DU PROJET

```
alopanier/
├── start.bat         ← Double-cliquez pour démarrer
├── stop.bat          ← Double-cliquez pour arrêter
├── client/           ← React + Tailwind (port 3000)
│   └── src/
│       ├── pages/
│       │   ├── auth/         (connexion, inscription)
│       │   ├── client/       (panier, commande, mes commandes)
│       │   └── admin/        (dashboard, produits, commandes...)
│       ├── store/            (Zustand : auth, panier)
│       ├── lib/              (api, utils, leaflet, recuPDF)
│       └── components/
├── server/           ← Node.js + Express (port 5000)
│   ├── routes/       (auth, produits, commandes, clients, admin, medias)
│   ├── schema.sql    ← Structure base de données
│   ├── .env          ← Configuration (mot de passe BDD, JWT...)
│   └── index.js      ← Point d'entrée
└── .kiro/specs/      ← Documentation technique
```

---

## FICHIER .ENV (configuration)

```
c:\Users\DJAGOZ\Desktop\alopanier\server\.env
```

Contenu actuel :
```
PORT=5000
DATABASE_URL=postgresql://postgres:1234@localhost:5432/allopanier
JWT_SECRET=allopanier_secret_jwt_2024_changez_en_production
JWT_EXPIRES=30d
ADMIN_EMAIL=admin@allopanier.bj
ADMIN_PASSWORD=Admin@2024
```

---

## FONCTIONNALITES DISPONIBLES

### Espace client
- Inscription avec position GPS (carte plein écran)
- Connexion automatique (token valable 30 jours)
- Catalogue avec recherche auto-complétion
- Panier intelligent (prix gros par paliers automatiques)
- Commande avec choix jour/créneau
- Reçu PDF téléchargeable avec QR code
- Suivi de commande en temps réel (actualisation toutes les 30s)
- Historique avec Commander à nouveau

### Espace admin (http://localhost:3000/admin)
- Dashboard avec statistiques
- Gestion produits (photos + vidéo 15s max, prix gros, conditionnements)
- Gestion catégories
- Gestion commandes (statuts, reçu imprimable complet)
- Carte GPS des livraisons
- Circuits de livraison
- Feuilles de route imprimables
- Comptabilité + export CSV
- Gestion clients (total achats, adresses GPS)
