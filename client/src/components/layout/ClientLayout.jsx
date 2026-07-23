import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      {/* pb-20 sur mobile pour ne pas cacher le contenu sous la barre en bas */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}
