'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, CalendarDays, BarChart2, Sparkles, LogOut, TrendingUp, Settings, PenLine, Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, color: 'text-purple-500' },
  { href: '/dashboard/stats', label: 'Estadísticas', icon: BarChart2, color: 'text-pink-500' },
  { href: '/dashboard/posts', label: 'Publicaciones', icon: TrendingUp, color: 'text-orange-500' },
  { href: '/dashboard/collaborations', label: 'Colaboraciones', icon: CalendarDays, color: 'text-rose-500' },
  { href: '/dashboard/guiones', label: 'Guiones', icon: PenLine, color: 'text-fuchsia-500' },
  { href: '/dashboard/ai', label: 'Asistente IA', icon: Sparkles, color: 'text-amber-500' },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings, color: 'text-violet-500' },
]

export default function Sidebar({ user, onClose }: { user: User; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="w-64 shrink-0 flex flex-col text-white rounded-2xl mx-3 my-3 h-[calc(100vh-24px)]"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-5 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight">Creator Hub</p>
            <p className="text-xs text-white/80 truncate max-w-[160px]">{user.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, color }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-white shadow-lg' : 'text-white hover:bg-white/15'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', active ? color : 'text-white')} />
              <span
                className={cn(
                  active
                    ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent font-semibold'
                    : ''
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white hover:bg-white/15 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
