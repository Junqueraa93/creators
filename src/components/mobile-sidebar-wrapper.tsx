'use client'
import { useState } from 'react'
import { Menu, X, Camera } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import type { User } from '@supabase/supabase-js'

export default function MobileSidebarWrapper({ user }: { user: User }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
          >
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            Creator Hub
          </span>
        </div>
        <div className="w-10" />
      </header>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Mobile overlay sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 h-full">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar user={user} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
