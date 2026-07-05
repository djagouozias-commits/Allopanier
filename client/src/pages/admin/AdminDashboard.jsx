import React, { useEffect, useState } from 'react'
import { ShoppingBag, Users, TrendingUp, Truck, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { formatPrix } from '../../lib/utils'
import { PageLoader } from '../../components/ui/Spinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const kpis = [
    { label: "Commandes aujourd'hui", value: stats?.commandes_jour || 0, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'CA du jour', value: formatPrix(stats?.ca_jour || 0), icon: TrendingUp, color: 'bg-primary-600' },
    { label: 'Clients inscrits', value: stats?.total_clients || 0, icon: Users, color: 'bg-purple-500' },
    { label: 'Livraisons en cours', value: stats?.livraisons_en_cours || 0, icon: Truck, color: 'bg-secondary-600' },
  ]

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Tableau de bord</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 ${k.color} rounded-xl flex items-center justify-center mb-3`}>
              <k.icon className="text-white" size={20} />
            </div>
            <p className="font-display font-bold text-xl text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 font-body mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statuts commandes */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Commandes par statut</h2>
          <div className="space-y-3">
            {[
              { label: 'En attente', key: 'en_attente', color: 'bg-yellow-400' },
              { label: 'Confirmées', key: 'confirmees', color: 'bg-blue-500' },
              { label: 'En livraison', key: 'en_livraison', color: 'bg-orange-400' },
              { label: 'Livrées', key: 'livrees', color: 'bg-green-500' },
            ].map(s => {
              const count = stats?.par_statut?.[s.key] || 0
              const max = Math.max(...Object.values(stats?.par_statut || { a: 1 })) || 1
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-sm font-body mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top produits */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-base text-gray-900 mb-4">Top 5 produits</h2>
          {stats?.top_produits?.length > 0 ? (
            <div className="space-y-3">
              {stats.top_produits.slice(0, 5).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-display font-bold text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-gray-800 truncate">{p.nom}</p>
                  </div>
                  <span className="text-sm font-display font-bold text-primary-600 flex-shrink-0">{p.total_vendu} vdus</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 font-body">Aucune donnée</p>}
        </div>

        {/* Alertes stock */}
        {stats?.alertes_stock?.length > 0 && (
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-display font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={18} /> Alertes de stock
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.alertes_stock.map((p, i) => (
                <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm font-display font-semibold text-gray-900 truncate">{p.nom}</p>
                  <p className="text-xs text-orange-600 font-body">Stock : {p.stock} / Min : {p.stock_min}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
