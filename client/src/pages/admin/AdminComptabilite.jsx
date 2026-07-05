import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix } from '../../lib/utils'
import { PageLoader } from '../../components/ui/Spinner'

export default function AdminComptabilite() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('jour')

  useEffect(() => {
    api.get(`/admin/comptabilite?periode=${periode}`).then(r => {
      setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [periode])

  const exportCSV = () => {
    if (!data?.lignes) return
    const rows = [
      ['Date', 'Commandes', 'Total commandé', 'Livraisons', 'CA livré'],
      ...data.lignes.map(l => [l.date, l.nb_commandes, l.total_commandes, l.nb_livrees, l.total_livre])
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `allopanier-comptabilite-${periode}.csv`
    a.click()
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-900">Comptabilité</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-display font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
          <Download size={15} /> Exporter CSV
        </button>
      </div>

      {/* Période */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {['jour', 'semaine', 'mois'].map(p => (
          <button key={p} onClick={() => { setPeriode(p); setLoading(true) }}
            className={`px-4 py-2 rounded-lg text-sm font-display font-semibold capitalize transition-colors ${periode === p ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : 'Mois'}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total commandé', value: formatPrix(data.total_commandes || 0), color: 'text-primary-600' },
            { label: 'Total livré (collecté)', value: formatPrix(data.total_livre || 0), color: 'text-green-600' },
            { label: 'Nb. commandes', value: data.nb_commandes || 0, color: 'text-gray-900' },
            { label: 'Nb. livraisons', value: data.nb_livrees || 0, color: 'text-secondary-600' },
          ].map((k, i) => (
            <div key={i} className="card p-5">
              <p className={`font-display font-bold text-2xl ${k.color}`}>{k.value}</p>
              <p className="text-xs text-gray-500 font-body mt-1">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau par jour/semaine */}
      {data?.lignes && data.lignes.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Période', 'Commandes', 'Total commandé', 'Livrées', 'Total livré', 'Frais livraison'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.lignes.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-display font-semibold text-gray-900 text-sm">{l.date}</td>
                    <td className="px-4 py-3 text-sm font-body text-gray-700">{l.nb_commandes}</td>
                    <td className="px-4 py-3 font-display font-semibold text-primary-600 text-sm">{formatPrix(l.total_commandes)}</td>
                    <td className="px-4 py-3 text-sm font-body text-gray-700">{l.nb_livrees}</td>
                    <td className="px-4 py-3 font-display font-semibold text-green-600 text-sm">{formatPrix(l.total_livre)}</td>
                    <td className="px-4 py-3 text-sm font-body text-gray-600">{formatPrix(l.total_livraison)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
