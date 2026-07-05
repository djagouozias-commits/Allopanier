import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../ui/Logo'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Logo size={36} />
              <span className="font-display font-bold text-lg text-white">
                Allo<span className="text-primary-500">Panier</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Commandez vos produits vivriers, électroménagers et ménagers depuis chez vous. 
              Livraison à domicile partout au Bénin.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://wa.me/22968204654"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-display font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/catalogue" className="hover:text-white transition-colors">Catalogue</Link></li>
              <li><Link to="/panier" className="hover:text-white transition-colors">Mon panier</Link></li>
              <li><Link to="/mes-commandes" className="hover:text-white transition-colors">Mes commandes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-3 text-sm">Livraison</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Mardi, Jeudi, Samedi, Dimanche</li>
              <li>8h00 – 12h00 et 14h00 – 18h00</li>
              <li>Paiement à la livraison</li>
              <li>Abomey-Calavi et environs</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} AlloPanier — Tous droits réservés
        </div>
      </div>
    </footer>
  )
}
