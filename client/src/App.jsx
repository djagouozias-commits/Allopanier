import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/useAuthStore'

// Pages publiques
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProduitPage from './pages/ProduitPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Pages client
import PanierPage from './pages/client/PanierPage'
import CommandePage from './pages/client/CommandePage'
import ConfirmationPage from './pages/client/ConfirmationPage'
import MesCommandesPage from './pages/client/MesCommandesPage'
import MonComptePage from './pages/client/MonComptePage'

// Pages admin
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProduits from './pages/admin/AdminProduits'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCommandes from './pages/admin/AdminCommandes'
import AdminClients from './pages/admin/AdminClients'
import AdminCarte from './pages/admin/AdminCarte'
import AdminCircuits from './pages/admin/AdminCircuits'
import AdminFeuilleroute from './pages/admin/AdminFeuilleroute'
import AdminPublicite from './pages/admin/AdminPublicite'
import AdminComptabilite from './pages/admin/AdminComptabilite'
import AdminPromoFlash from './pages/admin/AdminPromoFlash'

// PromoFlash
import PromoFlashPage from './pages/promoflash/PromoFlashPage'
import VendeurInscriptionPage from './pages/promoflash/VendeurInscriptionPage'
import VendeurConnexionPage from './pages/promoflash/VendeurConnexionPage'
import VendeurDashboardPage from './pages/promoflash/VendeurDashboardPage'

// VIP
import VIPPage from './pages/vip/VIPPage'
import VIPPanierPage from './pages/vip/VIPPanierPage'
import VIPCommandePage from './pages/vip/VIPCommandePage'
import VIPConfirmationPage from './pages/vip/VIPConfirmationPage'
import VIPMesCommandesPage from './pages/vip/VIPMesCommandesPage'
import AdminVIP from './pages/admin/AdminVIP'

// Layouts
import ClientLayout from './components/layout/ClientLayout'
import WhatsAppButton from './components/ui/WhatsAppButton'

// Guards
function RequireAuth({ children }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/connexion" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/connexion" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function RedirectIfAuth({ children }) {
  const { user } = useAuthStore()
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' }
        }}
      />
      <WhatsAppButton />
      <Routes>
        {/* Authentification */}
        <Route path="/connexion" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/inscription" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />

        {/* Espace public + client */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/catalogue/:categorieSlug" element={<CataloguePage />} />
          <Route path="/produit/:id" element={<ProduitPage />} />
          <Route path="/panier" element={<PanierPage />} />
          <Route path="/commande" element={<RequireAuth><CommandePage /></RequireAuth>} />
          <Route path="/confirmation/:codeCommande" element={<ConfirmationPage />} />
          <Route path="/mes-commandes" element={<RequireAuth><MesCommandesPage /></RequireAuth>} />
          <Route path="/mon-compte" element={<RequireAuth><MonComptePage /></RequireAuth>} />
        </Route>

        {/* Espace Admin */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="produits" element={<AdminProduits />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="commandes" element={<AdminCommandes />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="carte" element={<AdminCarte />} />
          <Route path="circuits" element={<AdminCircuits />} />
          <Route path="feuille-route" element={<AdminFeuilleroute />} />
          <Route path="publicite" element={<AdminPublicite />} />
          <Route path="comptabilite" element={<AdminComptabilite />} />
          <Route path="promoflash" element={<AdminPromoFlash />} />
          <Route path="vip" element={<AdminVIP />} />
        </Route>

        {/* PromoFlash — public + vendeurs */}
        <Route element={<ClientLayout />}>
          <Route path="/promoflash" element={<PromoFlashPage />} />
        </Route>
        <Route path="/promoflash/vendre" element={<VendeurInscriptionPage />} />
        <Route path="/promoflash/vendeur/connexion" element={<VendeurConnexionPage />} />
        <Route path="/promoflash/vendeur/dashboard" element={<VendeurDashboardPage />} />

        {/* VIP */}
        <Route element={<ClientLayout />}>
          <Route path="/vip" element={<VIPPage />} />
          <Route path="/vip/panier" element={<RequireAuth><VIPPanierPage /></RequireAuth>} />
          <Route path="/vip/commande" element={<RequireAuth><VIPCommandePage /></RequireAuth>} />
          <Route path="/vip/confirmation/:codeCommande" element={<VIPConfirmationPage />} />
          <Route path="/vip/mes-commandes" element={<RequireAuth><VIPMesCommandesPage /></RequireAuth>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
