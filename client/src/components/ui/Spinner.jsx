import React from 'react'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} ${className} animate-spin rounded-full border-2 border-gray-200 border-t-primary-600`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <Spinner size="lg" />
    </div>
  )
}
