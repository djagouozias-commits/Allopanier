const express = require('express')
const pool = require('../db')
const { adminMiddleware } = require('../middleware/auth')
const { optimizeRouteNearestNeighbor } = require('../lib/routeOptimizer')
const router = express.Router()

// Toutes les routes admin
router.use(adminMiddleware)

// GET /api/admin/stats — Dashboard
router.get('/stats', async (req, res) => {
  try {
    const [cmdJour, caJour, clients, enCours, parStatut, topProduits, alertes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM commandes WHERE DATE(date_commande) = CURRENT_DATE`),
      pool.query(`SELECT COALESCE(SUM(total), 0) as ca FROM commandes WHERE DATE(date_commande) = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*) FROM clients WHERE role='client'`),
      pool.query(`SELECT COUNT(*) FROM commandes WHERE statut='EN_LIVRAISON'`),
      pool.query(`
        SELECT statut, COUNT(*) as count FROM commandes GROUP BY statut
      `),
      pool.query(`
        SELECT p.nom, SUM(lc.quantite) as total_vendu
        FROM lignes_commande lc JOIN produits p ON p.id = lc.produit_id
        GROUP BY p.id, p.nom ORDER BY total_vendu DESC LIMIT 10
      `),
      pool.query(`SELECT id, nom, stock_min FROM produits WHERE stock = FALSE AND actif = TRUE LIMIT 10`),
    ])

    const parStatutObj = {}
    parStatut.rows.forEach(r => {
      parStatutObj[r.statut.toLowerCase().replace('_', '_')] = parseInt(r.count)
    })
    // Mapping pour le front
    const mapped = {
      en_attente: parStatutObj['en_attente'] || 0,
      confirmees: parStatutObj['confirmee'] || 0,
      en_livraison: parStatutObj['en_livraison'] || 0,
      livrees: parStatutObj['livree'] || 0,
    }

    res.json({
      commandes_jour: parseInt(cmdJour.rows[0].count),
      ca_jour: parseFloat(caJour.rows[0].ca),
      total_clients: parseInt(clients.rows[0].count),
      livraisons_en_cours: parseInt(enCours.rows[0].count),
      par_statut: mapped,
      top_produits: topProduits.rows,
      alertes_stock: alertes.rows,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/commandes
router.get('/commandes', async (req, res) => {
  try {
    const { statut, jour, q, limit = 20, page = 1 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conds = []
    const params = []
    let pi = 1

    if (statut) { conds.push(`c.statut=$${pi++}`); params.push(statut) }
    if (jour) { conds.push(`c.jour_livraison=$${pi++}`); params.push(jour) }
    if (q) { conds.push(`(c.code_commande ILIKE $${pi} OR cl.nom ILIKE $${pi})`); params.push(`%${q}%`); pi++ }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const count = await pool.query(
      `SELECT COUNT(*) FROM commandes c LEFT JOIN clients cl ON cl.id=c.client_id ${where}`, params
    )
    const { rows } = await pool.query(
      `SELECT c.*, cl.nom as client_nom, cl.telephone as client_telephone, cl.whatsapp as client_whatsapp
       FROM commandes c LEFT JOIN clients cl ON cl.id=c.client_id
       ${where} ORDER BY c.date_commande DESC LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ commandes: rows, total: parseInt(count.rows[0].count) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// PUT /api/admin/commandes/:id/statut
router.put('/commandes/:id/statut', async (req, res) => {
  const { statut } = req.body
  const valides = ['EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON', 'LIVREE', 'ANNULEE', 'PROBLEME']
  if (!valides.includes(statut)) return res.status(400).json({ message: 'Statut invalide' })
  try {
    // Récupérer l'ancienne commande pour comparer
    const { rows: avant } = await pool.query('SELECT statut, client_id, jour_livraison, tranche_horaire FROM commandes WHERE id=$1', [req.params.id])
    if (!avant[0]) return res.status(404).json({ message: 'Commande introuvable' })

    const extra = statut === 'LIVREE' ? ', date_livraison_effective=NOW()' : ''
    await pool.query(`UPDATE commandes SET statut=$1${extra} WHERE id=$2`, [statut, req.params.id])

    const clientId = avant[0].client_id
    if (clientId) {
      // Recompter les commandes non livrées de ce client
      // = commandes dont le jour/heure prévus sont dépassés ET statut != LIVREE et != ANNULEE
      // Compter toutes les commandes EN_ATTENTE/CONFIRMEE créées il y a plus de 7 jours (non livrées dans les temps)
      const { rows: retardees } = await pool.query(`
        SELECT COUNT(*) FROM commandes
        WHERE client_id=$1
          AND statut NOT IN ('LIVREE','ANNULEE')
          AND date_commande < NOW() - INTERVAL '7 days'
      `, [clientId])
      const nb = parseInt(retardees[0]?.count || 0)
      const bloque = nb >= 10
      await pool.query(
        'UPDATE clients SET nb_commandes_non_livrees=$1, compte_bloque=$2 WHERE id=$3',
        [nb, bloque, clientId]
      )
    }

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// DELETE /api/admin/commandes/:id
router.delete('/commandes/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ message: 'Commande introuvable' })
  }
  try {
    const { rows } = await pool.query('SELECT id, statut FROM commandes WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' })
    if (rows[0].statut === 'LIVREE') {
      return res.status(400).json({ message: 'Impossible de supprimer une commande déjà livrée' })
    }
    await pool.query('DELETE FROM commandes WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/commandes/carte
router.get('/commandes/carte', async (req, res) => {
  try {
    const { statut, jour } = req.query
    const conds = []
    const params = []
    let pi = 1
    if (statut) { conds.push(`c.statut=$${pi++}`); params.push(statut) }
    if (jour) { conds.push(`c.jour_livraison=$${pi++}`); params.push(jour) }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const { rows } = await pool.query(
      `SELECT c.id, c.code_commande, c.jour_livraison, c.tranche_horaire, c.total, c.poids_total_kg, c.statut,
              cl.nom as client_nom, cl.telephone as client_telephone,
              a.latitude, a.longitude, a.description_lieu
       FROM commandes c
       LEFT JOIN clients cl ON cl.id=c.client_id
       LEFT JOIN adresses a ON a.id=c.adresse_id
       ${where} ORDER BY c.date_commande DESC`,
      params
    )
    res.json({ commandes: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/admin/commandes/feuille-route/jours
router.get('/commandes/feuille-route/jours', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT jour_livraison as jour, COUNT(*) as nb
      FROM commandes
      WHERE statut IN ('EN_ATTENTE','CONFIRMEE','EN_LIVRAISON')
      GROUP BY jour_livraison
      ORDER BY jour_livraison
    `)
    res.json({ jours: rows })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/admin/commandes/feuille-route
router.get('/commandes/feuille-route', async (req, res) => {
  try {
    const { jour, circuit_id, tranche, tous } = req.query
    const conds = ["c.statut IN ('EN_ATTENTE','CONFIRMEE','EN_LIVRAISON')"]
    const params = []
    let pi = 1
    if (jour && tous !== '1') { conds.push(`c.jour_livraison=$${pi++}`); params.push(jour) }
    if (circuit_id) { conds.push(`c.circuit_id=$${pi++}`); params.push(parseInt(circuit_id)) }
    if (tranche) { conds.push(`c.tranche_horaire=$${pi++}`); params.push(tranche) }
    const { rows } = await pool.query(
      `SELECT c.id, c.code_commande, c.total, c.poids_total_kg, c.tranche_horaire, c.jour_livraison,
              c.note_livraison, c.ordre_dans_circuit,
              cl.nom as client_nom, cl.telephone as client_telephone,
              a.description_lieu, a.latitude, a.longitude
       FROM commandes c
       LEFT JOIN clients cl ON cl.id=c.client_id
       LEFT JOIN adresses a ON a.id=c.adresse_id
       WHERE ${conds.join(' AND ')}
       ORDER BY c.jour_livraison ASC, c.ordre_dans_circuit ASC NULLS LAST, c.id ASC`,
      params
    )
    res.json({ commandes: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/commandes/feuille-route/jours — livraisons par jour
router.get('/commandes/feuille-route/jours', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT jour_livraison as jour, COUNT(*) as nb
      FROM commandes
      WHERE statut IN ('EN_ATTENTE','CONFIRMEE','EN_LIVRAISON') AND jour_livraison IS NOT NULL
      GROUP BY jour_livraison
      ORDER BY MIN(date_commande) DESC
    `)
    res.json({ jours: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/commandes/:id — détail complet (après routes /carte et /feuille-route)
router.get('/commandes/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(404).json({ message: 'Commande introuvable' })
  }
  try {
    const { rows } = await pool.query(
      `SELECT c.*, cl.nom as client_nom, cl.telephone as client_telephone, cl.whatsapp as client_whatsapp,
              cl.email as client_email, cl.type_client as client_type_client,
              a.description_lieu, a.latitude, a.longitude
       FROM commandes c
       LEFT JOIN clients cl ON cl.id = c.client_id
       LEFT JOIN adresses a ON a.id = c.adresse_id
       WHERE c.id = $1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Commande introuvable' })

    const commande = rows[0]
    const { rows: lignes } = await pool.query(
      `SELECT lc.*, p.nom as produit_nom, p.image_url
       FROM lignes_commande lc
       LEFT JOIN produits p ON p.id = lc.produit_id
       WHERE lc.commande_id = $1`,
      [commande.id]
    )

    commande.lignes = lignes.map(l => ({
      ...l,
      produit: { id: l.produit_id, nom: l.produit_nom, image_url: l.image_url },
    }))
    commande.adresse = {
      description_lieu: commande.description_lieu,
      latitude: commande.latitude,
      longitude: commande.longitude,
    }

    res.json({ commande })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/clients
router.get('/clients', async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const conds = ["role='client'"]
    const params = []
    let pi = 1
    if (q) { conds.push(`(nom ILIKE $${pi} OR telephone ILIKE $${pi})`); params.push(`%${q}%`); pi++ }
    const where = 'WHERE ' + conds.join(' AND ')
    const count = await pool.query(`SELECT COUNT(*) FROM clients ${where}`, params)
    const { rows } = await pool.query(
      `SELECT id, nom, telephone, email, type_client, whatsapp, date_inscription, actif, mot_de_passe_clair
       FROM clients ${where} ORDER BY date_inscription DESC LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, parseInt(limit), offset]
    )
    res.json({ clients: rows, total: parseInt(count.rows[0].count) })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// GET /api/admin/clients/:id
router.get('/clients/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nom, telephone, email, type_client, whatsapp, date_inscription, actif, mot_de_passe_clair FROM clients WHERE id=$1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ message: 'Client introuvable' })
    const client = rows[0]

    const [adresses, commandes, totalAchats] = await Promise.all([
      pool.query('SELECT * FROM adresses WHERE client_id=$1', [client.id]),
      pool.query('SELECT code_commande, date_commande, total, statut FROM commandes WHERE client_id=$1 ORDER BY date_commande DESC LIMIT 10', [client.id]),
      pool.query("SELECT COALESCE(SUM(total),0) as total FROM commandes WHERE client_id=$1 AND statut NOT IN ('ANNULEE')", [client.id]),
    ])

    client.adresses = adresses.rows
    client.dernieres_commandes = commandes.rows
    client.total_achats = parseFloat(totalAchats.rows[0].total)

    res.json({ client })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// PUT /api/admin/clients/:id
router.put('/clients/:id', async (req, res) => {
  const { actif, mot_de_passe } = req.body
  try {
    const { rows } = await pool.query('SELECT id, role FROM clients WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Client introuvable' })
    if (rows[0].role === 'admin') return res.status(403).json({ message: 'Impossible de modifier un compte admin' })

    if (mot_de_passe !== undefined) {
      if (!mot_de_passe || mot_de_passe.length < 6) {
        return res.status(400).json({ message: 'Mot de passe trop court (min. 6 caractères)' })
      }
      const bcrypt = require('bcryptjs')
      const hash = await bcrypt.hash(mot_de_passe, 12)
      await pool.query(
        'UPDATE clients SET mot_de_passe_hash=$1, mot_de_passe_clair=$2 WHERE id=$3',
        [hash, mot_de_passe, req.params.id]
      )
    } else if (actif !== undefined) {
      await pool.query('UPDATE clients SET actif=$1 WHERE id=$2', [actif, req.params.id])
    }

    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// DELETE /api/admin/clients/:id
router.delete('/clients/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, role FROM clients WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Client introuvable' })
    if (rows[0].role === 'admin') return res.status(403).json({ message: 'Impossible de supprimer un compte admin' })

    const cmd = await pool.query('SELECT COUNT(*) FROM commandes WHERE client_id=$1', [req.params.id])
    if (parseInt(cmd.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Ce client a des commandes — bloquez-le plutôt que de le supprimer' })
    }

    await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// Circuits
router.get('/circuits', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, COUNT(cmd.id) as nb_commandes
      FROM circuits c LEFT JOIN commandes cmd ON cmd.circuit_id = c.id
      GROUP BY c.id ORDER BY c.nom
    `)
    res.json({ circuits: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.post('/circuits', async (req, res) => {
  const { nom, couleur, jour, tranche_horaire, depart_latitude, depart_longitude, actif } = req.body
  try {
    const { rows } = await pool.query(
      `INSERT INTO circuits (nom, couleur, jour, tranche_horaire, depart_latitude, depart_longitude, actif, statut_livraison)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'PLANIFIE') RETURNING *`,
      [nom, couleur || '#2E7D32', jour || null, tranche_horaire || null,
        depart_latitude || null, depart_longitude || null, actif !== false]
    )
    res.status(201).json({ circuit: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.put('/circuits/:id', async (req, res) => {
  const { nom, couleur, jour, tranche_horaire, depart_latitude, depart_longitude, actif } = req.body
  try {
    const { rows } = await pool.query(
      `UPDATE circuits SET nom=$1, couleur=$2, jour=$3, tranche_horaire=$4,
        depart_latitude=$5, depart_longitude=$6, actif=$7 WHERE id=$8 RETURNING *`,
      [nom, couleur, jour || null, tranche_horaire || null,
        depart_latitude ?? null, depart_longitude ?? null, actif !== false, req.params.id]
    )
    res.json({ circuit: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// GET /api/admin/circuits/:id/detail
router.get('/circuits/:id/detail', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM circuits WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Circuit introuvable' })
    const circuit = rows[0]

    const { rows: commandes } = await pool.query(
      `SELECT c.id, c.code_commande, c.total, c.poids_total_kg, c.statut, c.ordre_dans_circuit,
              cl.nom as client_nom, cl.telephone as client_telephone,
              a.latitude, a.longitude, a.description_lieu
       FROM commandes c
       LEFT JOIN clients cl ON cl.id = c.client_id
       LEFT JOIN adresses a ON a.id = c.adresse_id
       WHERE c.circuit_id = $1
       ORDER BY c.ordre_dans_circuit ASC NULLS LAST, c.id ASC`,
      [circuit.id]
    )

    res.json({ circuit, commandes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/admin/circuits/:id/optimiser — TSP plus proche voisin + retour départ
router.post('/circuits/:id/optimiser', async (req, res) => {
  const client = await pool.connect()
  try {
    const { rows } = await client.query('SELECT * FROM circuits WHERE id=$1', [req.params.id])
    const circuit = rows[0]
    if (!circuit) return res.status(404).json({ message: 'Circuit introuvable' })
    if (!circuit.jour || !circuit.tranche_horaire) {
      return res.status(400).json({ message: 'Jour et créneau horaire requis' })
    }
    if (!circuit.depart_latitude || !circuit.depart_longitude) {
      return res.status(400).json({ message: 'Point de départ du livreur requis' })
    }

    const { rows: commandesBrutes } = await client.query(
      `SELECT c.id, c.code_commande, c.total, c.poids_total_kg, c.statut,
              cl.nom as client_nom, cl.telephone as client_telephone,
              a.latitude, a.longitude, a.description_lieu
       FROM commandes c
       LEFT JOIN clients cl ON cl.id = c.client_id
       LEFT JOIN adresses a ON a.id = c.adresse_id
       WHERE c.jour_livraison = $1 AND c.tranche_horaire = $2
         AND c.statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON')
         AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL`,
      [circuit.jour, circuit.tranche_horaire]
    )

    if (commandesBrutes.length === 0) {
      return res.status(400).json({ message: 'Aucune commande avec GPS pour ce jour et ce créneau' })
    }

    const depot = {
      lat: parseFloat(circuit.depart_latitude),
      lng: parseFloat(circuit.depart_longitude),
    }

    const stops = commandesBrutes.map(c => ({
      ...c,
      lat: parseFloat(c.latitude),
      lng: parseFloat(c.longitude),
    }))

    const ordered = optimizeRouteNearestNeighbor(depot, stops)

    await client.query('BEGIN')
    await client.query(
      'UPDATE commandes SET circuit_id=NULL, ordre_dans_circuit=NULL WHERE circuit_id=$1',
      [circuit.id]
    )

    for (let i = 0; i < ordered.length; i++) {
      await client.query(
        'UPDATE commandes SET circuit_id=$1, ordre_dans_circuit=$2 WHERE id=$3',
        [circuit.id, i + 1, ordered[i].id]
      )
    }

    const routeGeojson = {
      depot,
      waypoints: ordered.map((c, i) => ({
        ordre: i + 1,
        commande_id: c.id,
        code_commande: c.code_commande,
        client_nom: c.client_nom,
        lat: c.lat,
        lng: c.lng,
        description_lieu: c.description_lieu,
      })),
      retour_depot: true,
      optimized_at: new Date().toISOString(),
    }

    await client.query(
      `UPDATE circuits SET route_geojson=$1, statut_livraison='PLANIFIE' WHERE id=$2`,
      [JSON.stringify(routeGeojson), circuit.id]
    )
    await client.query('COMMIT')

    res.json({
      success: true,
      nb_commandes: ordered.length,
      commandes: ordered,
      route: routeGeojson,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  } finally {
    client.release()
  }
})

// POST /api/admin/circuits/:id/demarrer
router.post('/circuits/:id/demarrer', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM circuits WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Circuit introuvable' })
    if (!rows[0].route_geojson) {
      return res.status(400).json({ message: 'Calculez d\'abord l\'itinéraire du circuit' })
    }

    await pool.query("UPDATE circuits SET statut_livraison='EN_COURS' WHERE id=$1", [req.params.id])
    const upd = await pool.query(
      `UPDATE commandes SET statut='EN_LIVRAISON'
       WHERE circuit_id=$1 AND statut IN ('EN_ATTENTE','CONFIRMEE') RETURNING id`,
      [req.params.id]
    )

    res.json({ success: true, nb_en_livraison: upd.rowCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// POST /api/admin/circuits/:id/terminer
router.post('/circuits/:id/terminer', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM circuits WHERE id=$1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ message: 'Circuit introuvable' })

    await pool.query(
      "UPDATE circuits SET statut_livraison='TERMINE', date_termine=NOW() WHERE id=$1",
      [req.params.id]
    )
    const upd = await pool.query(
      `UPDATE commandes SET statut='LIVREE', date_livraison_effective=NOW()
       WHERE circuit_id=$1 AND statut IN ('EN_LIVRAISON','CONFIRMEE','EN_ATTENTE') RETURNING id`,
      [req.params.id]
    )

    res.json({ success: true, nb_livrees: upd.rowCount, message: 'Circuit terminé avec succès' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.delete('/circuits/:id', async (req, res) => {
  try {
    await pool.query('UPDATE commandes SET circuit_id=NULL WHERE circuit_id=$1', [req.params.id])
    await pool.query('DELETE FROM circuits WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch { res.status(500).json({ message: 'Erreur serveur' }) }
})

// Comptabilité
router.get('/comptabilite', async (req, res) => {
  try {
    const { periode = 'jour' } = req.query
    let groupBy, dateFormat
    if (periode === 'mois') { groupBy = "DATE_TRUNC('month', date_commande)"; dateFormat = 'MM/YYYY' }
    else if (periode === 'semaine') { groupBy = "DATE_TRUNC('week', date_commande)"; dateFormat = 'WW/IYYY' }
    else { groupBy = 'DATE(date_commande)'; dateFormat = 'DD/MM/YYYY' }

    const { rows: lignes } = await pool.query(`
      SELECT 
        TO_CHAR(${groupBy}, '${dateFormat === 'DD/MM/YYYY' ? 'DD/MM/YYYY' : dateFormat}') as date,
        COUNT(*) as nb_commandes,
        COALESCE(SUM(total), 0) as total_commandes,
        COALESCE(SUM(CASE WHEN statut='LIVREE' THEN total ELSE 0 END), 0) as total_livre,
        COUNT(CASE WHEN statut='LIVREE' THEN 1 END) as nb_livrees,
        COALESCE(SUM(CASE WHEN statut='LIVREE' THEN frais_livraison ELSE 0 END), 0) as total_livraison
      FROM commandes
      WHERE date_commande >= NOW() - INTERVAL '${periode === 'mois' ? '12 months' : periode === 'semaine' ? '12 weeks' : '30 days'}'
      GROUP BY ${groupBy}
      ORDER BY ${groupBy} DESC
    `)

    const totals = lignes.reduce((acc, l) => ({
      nb_commandes: acc.nb_commandes + parseInt(l.nb_commandes),
      total_commandes: acc.total_commandes + parseFloat(l.total_commandes),
      total_livre: acc.total_livre + parseFloat(l.total_livre),
      nb_livrees: acc.nb_livrees + parseInt(l.nb_livrees),
    }), { nb_commandes: 0, total_commandes: 0, total_livre: 0, nb_livrees: 0 })

    res.json({ ...totals, lignes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router
