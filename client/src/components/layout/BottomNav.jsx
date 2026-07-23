import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Grid, ShoppingCart, ClipboardList, User } from 'lucide-react'
import useCartStore from '../../store/useCartStore'
import useAuthStore from '../../store/useAuthStore'

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuthStore()
  const itemCount = useCartStore(s => s.getItemCount())

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const linkClass = (path) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors ${
      isActive(path)
        ? 'text-primary-600'
        : 'text-gray-400 active:text-primary-500'
    }`

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-stretch h-16">
        {/* Accueil */}
        <Link to="/" className={linkClass('/')}>
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 1.8} />
          <span className="text-[10px] font-display font-semibold">Accueil</span>
        </Link>

        {/* Catalogue */}
        <Link to="/catalogue" className={linkClass('/catalogue')}>
          <Grid size={22} strokeWidth={isActive('/catalogue') ? 2.5 : 1.8} />
          <span className="text-[10px] font-display font-semibold">Catalogue</span>
        </Link>

        {/* Panier */}
        <Link to="/panier" className={linkClass('/panier')}>
          <div className="relative">
            <ShoppingCart size={22} strokeWidth={isActive('/panier') ? 2.5 : 1.8} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary-600 text-white text-[9px] font-display font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-display font-semibold">Panier</span>
        </Link>

        {/* Historique */}
        <Link
          to={user ? '/mes-commandes' : '/connexion'}
          className={linkClass('/mes-commandes')}
        >
          <ClipboardList size={22} strokeWidth={isActive('/mes-commandes') ? 2.5 : 1.8} />
          <span className="text-[10px] font-display font-semibold">Historique</span>
        </Link>

        {/* Compte */}
        <Link
          to={user ? '/mon-compte' : '/connexion'}
          className={linkClass(user ? '/mon-compte' : '/connexion')}
        >
          <User size={22} strokeWidth={isActive('/mon-compte') ? 2.5 : 1.8} />
          <span className="text-[10px] font-display font-semibold">{user ? 'Compte' : 'Connexion'}</span>
        </Link>
      </div>
    </nav>
  )
}
