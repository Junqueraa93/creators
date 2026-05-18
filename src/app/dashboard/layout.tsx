import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileSidebarWrapper from '@/components/mobile-sidebar-wrapper'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen lg:flex relative overflow-hidden" style={{ background: '#0f0a1e' }}>
      {/* Orbes de color difusos en el fondo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#833ab4' }} />
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: '#fd1d1d' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#fcb045' }} />
      </div>
      <MobileSidebarWrapper user={user} />
      <main className="flex-1 min-w-0 overflow-x-hidden relative z-10">
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
