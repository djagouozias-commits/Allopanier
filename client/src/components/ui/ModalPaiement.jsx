import React, { useState } from 'react'
import { X, Banknote, Smartphone, Copy, CheckCircle } from 'lucide-react'

const NUMEROS = [
  { label: 'Moov Money', numero: '0168204654', couleur: '#0099ff', bg: '#e6f3ff' },
  { label: 'MTN MoMo', numero: '0154824064', couleur: '#FFCC00', bg: '#fffde6', textColor: '#333' },
]

function formatF(n) { return Number(n || 0).toLocaleString('fr-FR') + ' FCFA' }

/**
 * ModalPaiement — choix espèces ou paiement maintenant
 * Props :
 *   isOpen       : bool
 *   total        : number
 *   onConfirmer(mode, statut) : callback avec mode='especes'|'mobile_money' et statut='A_PAYER'|'PAYE'
 *   onFermer()   : fermer sans valider
 *   loading      : bool
 */
export default function ModalPaiement({ isOpen, total, onConfirmer, onFermer, loading = false }) {
  const [choix, setChoix] = useState(null) // null | 'especes' | 'mobile_money'
  const [copie, setCopie] = useState(null)

  if (!isOpen) return null

  const copierNumero = (num) => {
    navigator.clipboard.writeText(num).then(() => {
      setCopie(num)
      setTimeout(() => setCopie(null), 2000)
    })
  }

  const handleConfirmer = () => {
    if (!choix) return
    if (choix === 'especes') {
      onConfirmer('especes', 'A_PAYER')
    } else {
      onConfirmer('mobile_money', 'PAYE')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-gray-900 text-lg">Mode de paiement</h2>
            <p className="text-sm text-gray-500 font-body mt-0.5">
              Total à régler : <span className="font-semibold text-primary-600">{formatF(total)}</span>
            </p>
          </div>
          <button onClick={onFermer} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Option 1 : espèces à la livraison */}
          <button
            onClick={() => setChoix('especes')}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              choix === 'especes' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Banknote size={20} className="text-green-700" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900">Payer en espèces à la livraison</p>
              <p className="text-sm text-gray-500 font-body mt-0.5">Le livreur encaisse à la remise des articles. Le reçu indiquera <strong>À PAYER</strong>.</p>
            </div>
            {choix === 'especes' && <CheckCircle size={18} className="text-primary-600 ml-auto flex-shrink-0 mt-1" />}
          </button>

          {/* Option 2 : payer maintenant */}
          <button
            onClick={() => setChoix('mobile_money')}
            className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              choix === 'mobile_money' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900">Payer maintenant (Mobile Money)</p>
              <p className="text-sm text-gray-500 font-body mt-0.5">Envoyez le montant exact. Le reçu indiquera <strong>DÉJÀ PAYÉ</strong>.</p>
            </div>
            {choix === 'mobile_money' && <CheckCircle size={18} className="text-blue-600 ml-auto flex-shrink-0 mt-1" />}
          </button>

          {/* Numéros de dépôt si mobile money */}
          {choix === 'mobile_money' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-display font-bold text-blue-800 text-center">
                Envoyez exactement {formatF(total)}
              </p>
              {NUMEROS.map(n => (
                <div key={n.numero}
                  style={{ background: n.bg, borderColor: n.couleur + '55' }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border">
                  <div>
                    <p className="text-xs font-body" style={{ color: n.couleur === '#FFCC00' ? '#333' : n.couleur }}>
                      {n.label}
                    </p>
                    <p className="font-display font-bold text-gray-900 text-base tracking-widest">{n.numero}</p>
                  </div>
                  <button
                    onClick={() => copierNumero(n.numero)}
                    className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: n.couleur + '22', color: n.couleur === '#FFCC00' ? '#333' : n.couleur }}
                  >
                    {copie === n.numero ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copie === n.numero ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              ))}
              <p className="text-xs text-blue-600 font-body text-center">
                Après dépôt, confirmez la commande. Le statut passera à <strong>DÉJÀ PAYÉ</strong>.
              </p>
            </div>
          )}

          {/* Bouton confirmer */}
          <button
            onClick={handleConfirmer}
            disabled={!choix || loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-display font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base mt-2"
          >
            {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'En cours...' : 'Confirmer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
