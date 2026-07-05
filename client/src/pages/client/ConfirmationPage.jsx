import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, FileText } from 'lucide-react'
import api from '../../lib/api'
import { ouvrirRecuClient } from '../../lib/genererRecuPDF'

function formatF(n) {
  try { return Number(n).toLocaleString('fr-FR') + ' FCFA' } catch { return n + ' FCFA' }
}

export default function ConfirmationPage() {
  const { codeCommande } = useParams()
  const [commande, setCommande] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!codeCommande) { setLoading(false); return }
    let tries = 0
    function load() {
      tries++
      api.get('/commandes/code/' + codeCommande)
        .then(r => { setCommande(r.data.commande); setLoading(false) })
        .catch(() => {
          if (tries < 4) setTimeout(load, 1000)
          else setLoading(false)
        })
    }
    load()
  }, [codeCommande])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #e5e7eb',
          borderTopColor: '#2E7D32', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
          Chargement de votre commande...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Affichage minimal garanti même sans données
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* En-tête succès */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={44} className="text-green-600" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">
          Commande confirmée
        </h1>
        <p className="text-gray-500 font-body text-sm">
          Votre commande a été enregistrée avec succès.
        </p>
      </div>

      {/* Code commande toujours visible */}
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center mb-6">
        <p className="text-sm text-gray-500 font-body mb-1">Votre code de commande</p>
        <p className="font-display font-extrabold text-3xl text-green-700 tracking-widest mb-1">
          {codeCommande}
        </p>
        <p className="text-xs text-gray-400 font-body">
          Conservez ce code pour suivre et identifier votre commande
        </p>
      </div>

      {/* Détails si disponibles */}
      {commande && (
        <div className="card p-5 space-y-4 mb-6">
          {/* Livraison */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-display font-semibold text-gray-500 uppercase mb-3">Livraison</p>
            <div className="grid grid-cols-2 gap-2 text-sm font-body">
              <div>
                <p className="text-gray-400 text-xs">Jour</p>
                <p className="font-semibold text-gray-900">{commande.jour_livraison || '—'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Créneau</p>
                <p className="font-semibold text-gray-900">{commande.tranche_horaire || '—'}</p>
              </div>
            </div>
            {commande.adresse && commande.adresse.description_lieu && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-400 text-xs mb-1">Adresse de livraison</p>
                <p className="text-sm text-gray-800 font-body">{commande.adresse.description_lieu}</p>
              </div>
            )}
          </div>

          {/* Articles */}
          {Array.isArray(commande.lignes) && commande.lignes.length > 0 && (
            <div>
              <p className="text-xs font-display font-semibold text-gray-500 uppercase mb-2">Articles</p>
              <div className="space-y-2">
                {commande.lignes.map((l, i) => (
                  <div key={i} className="flex justify-between text-sm font-body">
                    <span className="text-gray-700 flex-1">
                      {l.produit && l.produit.nom ? l.produit.nom : ('Produit ' + l.produit_id)}
                      <span className="text-gray-400 ml-1">× {l.quantite}</span>
                    </span>
                    <span className="font-semibold text-gray-900 flex-shrink-0 ml-2">
                      {formatF(l.sous_total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totaux */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm font-body">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span className="font-semibold">{formatF(commande.sous_total)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span className="font-semibold">{formatF(commande.frais_livraison)}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-base pt-2 border-t border-gray-200">
              <span className="text-gray-900">Total à payer au livreur</span>
              <span className="text-green-700 text-xl">{formatF(commande.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rappel */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-6">
        <p className="text-sm font-body text-green-800 font-semibold">
          Paiement en espèces à la livraison
        </p>
        <p className="text-xs text-green-600 font-body mt-1">
          Le livreur vous contactera avant d'arriver.
        </p>
      </div>

      {/* Boutons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Télécharger / Imprimer le reçu */}
        {commande && (
          <button
            onClick={() => ouvrirRecuClient(commande)}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-display font-semibold py-4 rounded-xl transition-colors text-base"
          >
            <FileText size={18} />
            Télécharger mon reçu
          </button>
        )}
        <Link
          to="/mes-commandes"
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-display font-semibold py-4 rounded-xl text-center transition-colors text-base"
        >
          Voir mes commandes
        </Link>
        <Link
          to="/"
          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-display font-semibold py-4 rounded-xl text-center transition-colors text-base"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
