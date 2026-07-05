import React from 'react'
import { TELEPHONE_PREFIX, formaterSuffixeTelephone, assemblerTelephone } from '../../lib/utils'

/**
 * Saisie téléphone béninois : préfixe 01 fixe + 8 chiffres saisis par le client.
 * @param {string} suffix - 8 chiffres après 01
 * @param {function} onChange - (suffix: string) => void
 */
export default function PhoneInput({ suffix = '', onChange, error, className = '', id, onBlur, disabled }) {
  const handleChange = (e) => {
    onChange(formaterSuffixeTelephone(e.target.value))
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text') || ''
    const digits = pasted.replace(/\D/g, '')
    // Coller 0168204654 ou 68204654 → extraire les 8 derniers chiffres après 01
    let extracted = digits
    if (digits.startsWith('01') && digits.length >= 10) {
      extracted = digits.slice(2, 10)
    } else if (digits.length > 8) {
      extracted = digits.slice(-8)
    }
    onChange(formaterSuffixeTelephone(extracted))
  }

  return (
    <div>
      <div className={`flex ${className}`}>
        <span
          className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg font-display font-bold text-gray-700 text-sm select-none"
          aria-hidden="true"
        >
          {TELEPHONE_PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          value={suffix}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="68204654"
          autoComplete="tel-national"
          className={`input-field rounded-l-none flex-1 font-mono tracking-wide ${error ? 'border-red-400' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">
        Numéro complet : <span className="font-mono font-semibold text-gray-600">{assemblerTelephone(suffix) || `${TELEPHONE_PREFIX}________`}</span>
      </p>
    </div>
  )
}
