import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, Search, ChevronDown } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import useCartStore from '../../store/useCartStore'
import Logo from '../ui/Logo'

export default function Header() {
  const { user, logout } = useAuthStore()
  const itemCount = useCartStore(s => s.getItemCount())
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo size={40} />
            <span className="font-display font-extrabold text-xl text-primary-600">
              Allo<span className="text-gray-900">Panier</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-body font-medium text-sm transition-colors">
              Accueil
            </Link>
            <Link to="/catalogue" className="text-gray-700 hover:text-primary-600 font-body font-medium text-sm transition-colors">
              Catalogue
            </Link>
            <Link to="/promoflash"
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-display font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors">
              ⚡ PromoFlash
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Panier */}
            <Link to="/panier" className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-600 text-white text-xs font-display font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 font-body font-medium transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <span className="hidden md:block">{user.nom?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/mon-compte"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mon compte
                    </Link>
                    <Link
                      to="/mes-commandes"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Mes commandes
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-medium"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Administration
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/connexion"
                  className="text-sm text-gray-700 hover:text-primary-600 font-body font-medium transition-colors hidden md:block"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-display font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <Link to="/" className="block text-gray-700 font-body font-medium" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link to="/catalogue" className="block text-gray-700 font-body font-medium" onClick={() => setMenuOpen(false)}>Catalogue</Link>
          <Link to="/promoflash" className="block text-purple-600 font-display font-semibold" onClick={() => setMenuOpen(false)}>⚡ PromoFlash</Link>
          {user ? (
            <>
              <Link to="/mes-commandes" className="block text-gray-700 font-body font-medium" onClick={() => setMenuOpen(false)}>Mes commandes</Link>
              <Link to="/mon-compte" className="block text-gray-700 font-body font-medium" onClick={() => setMenuOpen(false)}>Mon compte</Link>
              <button onClick={handleLogout} className="block w-full text-left text-red-600 font-body font-medium">Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="block text-gray-700 font-body font-medium" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link to="/inscription" className="block text-primary-600 font-body font-semibold" onClick={() => setMenuOpen(false)}>S'inscrire</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
