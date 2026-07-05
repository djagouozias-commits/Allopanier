import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Map, Route, FileText, BarChart2, LogOut, Menu, X, Video, Zap } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import Logo from '../../components/ui/Logo'

const NAV = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/produits', label: 'Produits', icon: Package },
  { to: '/admin/categories', label: 'Catégories', icon: Tag },
  { to: '/admin/commandes', label: 'Commandes', icon: ShoppingBag },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/carte', label: 'Carte GPS', icon: Map },
  { to: '/admin/circuits', label: 'Circuits', icon: Route },
  { to: '/admin/feuille-route', label: 'Feuilles de route', icon: FileText },
  { to: '/admin/publicite', label: 'Vidéo pub', icon: Video },
  { to: '/admin/comptabilite', label: 'Comptabilité', icon: BarChart2 },
  { to: '/admin/promoflash', label: 'PromoFlash', icon: Zap },
]

export default function AdminLayout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <div>
            <p className="font-display font-bold text-white text-sm">AlloPanier</p>
            <p className="text-xs text-gray-400 font-body">Administration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-semibold transition-colors ${isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            onClick={() => setSidebarOpen(false)}>
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-display font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 flex-shrink-0 flex flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 font-body">Administration</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 admin-panel">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
