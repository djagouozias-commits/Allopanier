import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, Menu, X, ChevronDown, Lock } from 'lucide-react'
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

  // Bouton désactivé avec cadenas — ne fait rien au clic
  const BoutonDesactive = ({ children, className, style }) => (
    <span
      className={`${className} opacity-60 cursor-not-allowed select-none relative`}
      style={style}
      title="Bientôt disponible"
    >
      {children}
      <Lock size={11} className="inline ml-1 mb-0.5" />
    </span>
  )

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <Logo size={34} />
            <span className="font-display font-extrabold text-lg md:text-xl text-primary-600">
              Allo<span className="text-gray-900">Panier</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-3">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-body font-medium text-sm transition-colors px-2">
              Accueil
            </Link>
            <Link to="/catalogue" className="text-gray-700 hover:text-primary-600 font-body font-medium text-sm transition-colors px-2">
              Catalogue
            </Link>
            <BoutonDesactive className="flex items-center gap-1.5 bg-purple-600 text-white font-display font-semibold text-sm px-3 py-1.5 rounded-lg">
              <span>⚡</span> PromoFlash
            </BoutonDesactive>
            <BoutonDesactive
              className="flex items-center gap-1.5 font-display font-bold text-sm px-3 py-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#1a1a2e' }}>
              <span>♦</span> V.I.P
            </BoutonDesactive>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
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
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-primary-600 font-body font-medium transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <span className="hidden md:block max-w-[80px] truncate">{user.nom?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link to="/mon-compte" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      Mon compte
                    </Link>
                    <Link to="/mes-commandes" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      Mes commandes
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 font-medium" onClick={() => setUserMenuOpen(false)}>
                        Administration
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/connexion" className="text-sm text-gray-700 hover:text-primary-600 font-body font-medium transition-colors hidden md:block">
                  Connexion
                </Link>
                <Link to="/inscription" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-display font-semibold px-3 py-2 rounded-lg transition-colors">
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 text-gray-700" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <Link to="/" className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 font-body font-medium hover:bg-gray-50 active:bg-gray-100" onClick={() => setMenuOpen(false)}>
            Accueil
          </Link>
          <Link to="/catalogue" className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 font-body font-medium hover:bg-gray-50 active:bg-gray-100" onClick={() => setMenuOpen(false)}>
            Catalogue
          </Link>
          {/* PromoFlash désactivé */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl opacity-50 cursor-not-allowed select-none">
            <span className="text-purple-600 font-display font-semibold">⚡ PromoFlash</span>
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Bientôt</span>
            </div>
          </div>
          {/* VIP désactivé */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl opacity-50 cursor-not-allowed select-none">
            <span className="font-display font-bold" style={{ color: '#D4AF37' }}>♦ V.I.P</span>
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-400">Bientôt</span>
            </div>
          </div>
          <div className="border-t border-gray-100 my-1" />
          {user ? (
            <>
              <Link to="/mes-commandes" className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 font-body font-medium hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Mes commandes
              </Link>
              <Link to="/mon-compte" className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 font-body font-medium hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Mon compte
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center px-3 py-2.5 rounded-xl text-primary-600 font-body font-semibold hover:bg-primary-50" onClick={() => setMenuOpen(false)}>
                  Administration
                </Link>
              )}
              <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded-xl text-red-600 font-body font-medium hover:bg-red-50 text-left">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/connexion" className="flex items-center px-3 py-2.5 rounded-xl text-gray-700 font-body font-medium hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                Connexion
              </Link>
              <Link to="/inscription" className="flex items-center justify-center bg-primary-600 text-white font-display font-semibold px-4 py-3 rounded-xl mt-1" onClick={() => setMenuOpen(false)}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
