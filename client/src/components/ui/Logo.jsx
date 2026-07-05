import React from 'react'

export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Panier */}
      <rect x="20" y="48" width="60" height="38" rx="6" fill="#2E7D32"/>
      {/* Lignes du panier */}
      <line x1="35" y1="48" x2="35" y2="86" stroke="white" strokeWidth="3"/>
      <line x1="50" y1="48" x2="50" y2="86" stroke="white" strokeWidth="3"/>
      <line x1="65" y1="48" x2="65" y2="86" stroke="white" strokeWidth="3"/>
      {/* Anse */}
      <path d="M30 48 Q30 25 50 22 Q70 25 70 48" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Feuille */}
      <ellipse cx="55" cy="30" rx="10" ry="14" fill="#4CAF50" transform="rotate(-20 55 30)"/>
      <line x1="55" y1="44" x2="55" y2="22" stroke="#2E7D32" strokeWidth="1.5"/>
      {/* Vitesse */}
      <line x1="5" y1="58" x2="18" y2="58" stroke="#F57C00" strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="66" x2="18" y2="66" stroke="#F57C00" strokeWidth="3" strokeLinecap="round"/>
      <line x1="11" y1="74" x2="18" y2="74" stroke="#F57C00" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}
