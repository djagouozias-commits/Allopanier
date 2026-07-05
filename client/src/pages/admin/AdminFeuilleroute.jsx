import React, { useEffect, useState } from 'react'
import { Printer, FileText, CalendarDays } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix, formatPoids, jourActuel, TOUS_JOURS } from '../../lib/utils'
import { PageLoader } from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AdminFeuilleroute() {
  const [circuits, setCircuits] = useState([])
  const [joursAvecLivraisons, setJoursAvecLivraisons] = useState([])
  const [filtres, setFiltres] = useState({ circuit_id: '', jour: jourActuel(), tranche: '', tous: false })
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(false)
  const [circuitsLoading, setCircuitsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/circuits'),
      api.get('/admin/commandes/feuille-route/jours'),
    ])
      .then(([circuitsRes, joursRes]) => {
        setCircuits(circuitsRes.data.circuits || [])
        setJoursAvecLivraisons(joursRes.data.jours || [])
        setCircuitsLoading(false)
      })
      .catch(() => {
        toast.error('Impossible de charger les données')
        setCircuitsLoading(false)
      })
  }, [])

  const circuitsFiltres = circuits.filter(c => {
    if (filtres.jour && !filtres.tous && c.jour && c.jour !== filtres.jour) return false
    if (filtres.tranche && c.tranche_horaire && c.tranche_horaire !== filtres.tranche) return false
    return true
  })

  const charger = () => {
    if (!filtres.tous && !filtres.jour) { setCommandes([]); return }
    setLoading(true)
    const params = new URLSearchParams()
    if (filtres.tous) params.append('tous', '1')
    else params.append('jour', filtres.jour)
    if (filtres.circuit_id) params.append('circuit_id', filtres.circuit_id)
    if (filtres.tranche) params.append('tranche', filtres.tranche)
    api.get(`/admin/commandes/feuille-route?${params}`)
      .then(r => { setCommandes(r.data.commandes || []); setLoading(false) })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Erreur lors du chargement')
        setLoading(false)
      })
  }

  useEffect(charger, [filtres.jour, filtres.circuit_id, filtres.tranche, filtres.tous])

  const handleCircuitChange = (circuitId) => {
    if (!circuitId) {
      setFiltres(p => ({ ...p, circuit_id: '' }))
      return
    }
    const circuit = circuits.find(c => String(c.id) === String(circuitId))
    setFiltres(p => ({
      ...p,
      circuit_id: circuitId,
      tous: false,
      jour: circuit?.jour || p.jour,
      tranche: circuit?.tranche_horaire || p.tranche,
    }))
  }

  const totalACollecter = commandes.reduce((s, c) => s + parseFloat(c.total || 0), 0)
  const poidsTotal = commandes.reduce((s, c) => s + parseFloat(c.poids_total_kg || 0), 0)
  const aujourdhui = jourActuel()

  const imprimer = () => {
    if (commandes.length === 0) {
      toast.error('Aucune livraison à imprimer')
      return
    }

    const circuitNom = filtres.circuit_id
      ? circuits.find(c => String(c.id) === String(filtres.circuit_id))?.nom || 'Circuit'
      : 'Toutes les tournées'

    const periodeLabel = filtres.tous
      ? 'Tous les jours'
      : `${filtres.jour}${filtres.tranche ? ' — ' + filtres.tranche : ''}`

    const lignesHtml = commandes.map((c, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:700;color:#2E7D32">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">
          <strong>${c.client_nom || '—'}</strong><br/>
          <span style="font-size:12px;color:#666">${c.client_telephone || ''}</span>
        </td>
        <td style="padding:8px;border:1px solid #ddd;font-size:13px">${c.description_lieu || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-size:12px">${c.jour_livraison || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-size:12px">${c.code_commande || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${c.tranche_horaire || '—'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:700;color:#F57C00">
          ${parseInt(c.total || 0).toLocaleString('fr-FR')} FCFA
        </td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${parseFloat(c.poids_total_kg || 0).toFixed(2)} kg</td>
        <td style="padding:8px;border:1px solid #ddd;font-size:11px">${c.note_livraison || ''}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">☐</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">☐</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">☐</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<title>Feuille de route — ${periodeLabel}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, sans-serif; padding: 10px; font-size: 12px; color: #111; }
  h1 { font-size: 18px; color: #2E7D32; margin: 0 0 2px; }
  h2 { font-size: 13px; color: #555; font-weight: normal; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  thead th { background: #2E7D32; color: white; padding: 7px 6px; text-align: left; font-size: 11px; border: 1px solid #1B5E20; }
  tbody td { padding: 6px; border: 1px solid #ddd; font-size: 11px; vertical-align: top; }
  .total-row td { background: #E8F5E9; font-weight: bold; }
  .resume { display: flex; gap: 20px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; }
  .resume div { text-align: center; }
  .resume .val { font-size: 18px; font-weight: 900; color: #2E7D32; }
  .resume .lbl { font-size: 10px; color: #777; }
  select, button.no-print { display: none; }
  .actions { margin-bottom: 14px; display: flex; gap: 10px; align-items: center; }
  .btn { padding: 8px 18px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; border: none; }
  .btn-green { background: #2E7D32; color: white; }
  .btn-gray { background: #666; color: white; }
  .format-label { font-size: 13px; color: #444; margin-right: 6px; }
  @media print { .actions { display: none !important; } body { padding: 0; } }
</style>
</head><body>

<div class="actions">
  <button class="btn btn-green" onclick="window.print()">Imprimer</button>
  <button class="btn btn-gray" onclick="window.close()">Fermer</button>
  <span class="format-label">Format papier :</span>
  <select onchange="changerFormat(this.value)">
    <option value="A4 landscape">A4 Paysage (défaut)</option>
    <option value="A4 portrait">A4 Portrait</option>
    <option value="A3 landscape">A3 Paysage</option>
    <option value="A3 portrait">A3 Portrait</option>
    <option value="A2 landscape">A2 Paysage</option>
    <option value="letter landscape">Letter Paysage</option>
  </select>
</div>

<script>
function changerFormat(val) {
  var style = document.getElementById('page-style')
  style.textContent = '@page { size: ' + val + '; margin: 10mm; }'
}
</script>
<style id="page-style">@page { size: A4 landscape; margin: 10mm; }</style>

<h1>AlloPanier — Feuille de route</h1>
<h2>${circuitNom} | ${periodeLabel} | Imprimée le ${new Date().toLocaleDateString('fr-FR')}</h2>
<div class="resume">
  <div><div class="val">${commandes.length}</div><div class="lbl">Livraisons</div></div>
  <div><div class="val">${totalACollecter.toLocaleString('fr-FR')} FCFA</div><div class="lbl">Total à collecter</div></div>
  <div><div class="val">${poidsTotal.toFixed(2)} kg</div><div class="lbl">Poids total</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Client</th><th>Adresse</th><th>Jour</th><th>Code</th><th>Créneau</th>
      <th>Montant</th><th>Poids</th><th>Note</th><th>Livré ✓</th><th>Absent ✗</th><th>Prob. !</th>
    </tr>
  </thead>
  <tbody>
    ${lignesHtml}
    <tr class="total-row">
      <td colspan="6" style="text-align:right">TOTAL</td>
      <td style="text-align:right">${totalACollecter.toLocaleString('fr-FR')} FCFA</td>
      <td style="text-align:center">${poidsTotal.toFixed(2)} kg</td>
      <td colspan="4"></td>
    </tr>
  </tbody>
</table>
<p style="margin-top:16px;font-size:10px;color:#aaa">AlloPanier — Paiement en espèces à la livraison</p>
</body></html>`

    const win = window.open('', '_blank', 'width=1100,height=800')
    if (!win) {
      toast.error('Impossible d\'ouvrir la fenêtre. Autorisez les popups pour ce site.')
      return
    }
    win.document.write(html)
    win.document.close()
  }

  if (circuitsLoading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display font-bold text-2xl text-gray-900">Feuilles de route</h1>
        <button
          onClick={imprimer}
          disabled={commandes.length === 0}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-display font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Printer size={16} /> Imprimer {commandes.length > 0 ? `(${commandes.length})` : ''}
        </button>
      </div>

      {/* Bandeau statut visible */}
      <div className={`rounded-xl p-4 mb-5 border ${commandes.length > 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-start gap-3">
          <CalendarDays size={22} className={commandes.length > 0 ? 'text-green-600' : 'text-orange-600'} />
          <div>
            {filtres.tous ? (
              <p className="font-display font-semibold text-gray-900">Mode : toutes les livraisons en cours (tous jours)</p>
            ) : (
              <p className="font-display font-semibold text-gray-900">
                Jour sélectionné : <span className="text-primary-600">{filtres.jour}</span>
                {filtres.jour === aujourdhui && <span className="ml-2 text-sm bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">Aujourd'hui</span>}
              </p>
            )}
            <p className="text-sm font-body mt-1">
              {loading ? 'Chargement...' : commandes.length > 0
                ? `${commandes.length} livraison(s) trouvée(s) — cliquez « Imprimer » en haut à droite`
                : 'Aucune livraison pour ce filtre. Essayez un autre jour ci-dessous ou affichez toutes les livraisons.'}
            </p>
          </div>
        </div>
      </div>

      {/* Jours avec livraisons — raccourcis */}
      {joursAvecLivraisons.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-display font-semibold text-gray-700 mb-2">Jours avec livraisons en cours :</p>
          <div className="flex flex-wrap gap-2">
            {joursAvecLivraisons.map(j => (
              <button
                key={j.jour}
                onClick={() => setFiltres(p => ({ ...p, jour: j.jour, tous: false, circuit_id: '' }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-display font-semibold border transition-colors ${
                  !filtres.tous && filtres.jour === j.jour
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                }`}
              >
                {j.jour} ({j.nb}){j.jour === aujourdhui ? ' ★' : ''}
              </button>
            ))}
            <button
              onClick={() => setFiltres(p => ({ ...p, tous: true, circuit_id: '' }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-display font-semibold border transition-colors ${
                filtres.tous ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              Tous les jours
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-sm font-display font-semibold text-gray-600 mb-1">Jour</label>
          <select
            value={filtres.tous ? '' : filtres.jour}
            disabled={filtres.tous}
            onChange={e => setFiltres(p => ({ ...p, jour: e.target.value, tous: false, circuit_id: '' }))}
            className="input-field text-sm"
          >
            <option value="">-- Choisir --</option>
            {TOUS_JOURS.map(j => (
              <option key={j} value={j}>{j}{j === aujourdhui ? " (aujourd'hui)" : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-display font-semibold text-gray-600 mb-1">Circuit</label>
          <select value={filtres.circuit_id} onChange={e => handleCircuitChange(e.target.value)} className="input-field text-sm">
            <option value="">Tous les circuits</option>
            {circuitsFiltres.map(c => (
              <option key={c.id} value={c.id}>
                {c.nom}{c.jour ? ` (${c.jour}${c.tranche_horaire ? ' — ' + c.tranche_horaire : ''})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-display font-semibold text-gray-600 mb-1">Créneau</label>
          <select value={filtres.tranche} onChange={e => setFiltres(p => ({ ...p, tranche: e.target.value, circuit_id: '' }))} className="input-field text-sm">
            <option value="">Tous créneaux</option>
            <option value="8h-12h">Matin 8h – 12h</option>
            <option value="14h-18h">Après-midi 14h – 18h</option>
          </select>
        </div>
      </div>

      {loading && <PageLoader />}

      {!loading && commandes.length === 0 && (
        <div className="text-center py-12 text-gray-400 font-body">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucune livraison pour ce filtre</p>
          <p className="text-sm mt-2">Statuts : En attente, Confirmée, En livraison</p>
        </div>
      )}

      {!loading && commandes.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="card p-4 text-center">
              <p className="font-display font-bold text-2xl text-primary-600">{commandes.length}</p>
              <p className="text-sm text-gray-500 font-body mt-1">Livraisons</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display font-bold text-xl text-secondary-600">{formatPrix(totalACollecter)}</p>
              <p className="text-sm text-gray-500 font-body mt-1">À collecter</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display font-bold text-xl text-gray-900">{formatPoids(poidsTotal)}</p>
              <p className="text-sm text-gray-500 font-body mt-1">Poids total</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Client', 'Adresse', 'Jour', 'Créneau', 'Code', 'Montant', 'Poids', 'Note'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-sm font-display font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {commandes.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-display font-bold text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3">
                        <p className="font-display font-semibold text-gray-900 text-sm">{c.client_nom}</p>
                        <p className="text-sm text-gray-400 font-body">{c.client_telephone}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 font-body max-w-[200px]">
                        <p className="line-clamp-2">{c.description_lieu || '—'}</p>
                      </td>
                      <td className="px-3 py-3 text-sm font-display font-semibold text-primary-600">{c.jour_livraison}</td>
                      <td className="px-3 py-3 text-sm text-gray-500 font-body">{c.tranche_horaire}</td>
                      <td className="px-3 py-3 text-sm font-display font-semibold text-primary-600">{c.code_commande}</td>
                      <td className="px-3 py-3 font-display font-bold text-secondary-600 text-sm">{formatPrix(c.total)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 font-body">{formatPoids(c.poids_total_kg)}</td>
                      <td className="px-3 py-3 text-sm text-gray-500 font-body max-w-[120px] truncate" title={c.note_livraison}>{c.note_livraison || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
