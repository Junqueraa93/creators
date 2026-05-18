import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, UserPlus, ImageIcon, Heart, Eye, Bookmark } from 'lucide-react'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: stats } = await supabase
    .from('account_stats')
    .select('*')
    .eq('user_id', user!.id)
    .eq('platform', 'instagram')
    .order('stat_date', { ascending: false })
    .limit(90)

  const allStats = stats ?? []
  const latestWithFollowers = allStats.find(s => (s.followers ?? 0) > 0)

  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .eq('user_id', user!.id)
    .eq('platform', 'instagram')

  const since30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const last30 = allStats.filter(s => s.stat_date >= since30)

  const totalLikes30 = last30.reduce((a, s) => a + (s.total_likes ?? 0), 0)
  const totalActivity30 = last30.reduce((a, s) => a + (s.total_views ?? 0), 0)
  const totalSaves30 = last30.reduce((a, s) => a + (s.profile_views ?? 0), 0)

  const followers = (latestWithFollowers as { followers?: number; follows_count?: number; media_count?: number } | undefined)?.followers ?? 0
  const following = (latestWithFollowers as { follows_count?: number } | undefined)?.follows_count ?? 0
  const mediaCount = posts?.length ?? (latestWithFollowers as { media_count?: number } | undefined)?.media_count ?? 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-3xl md:text-4xl font-bold relative">Estadísticas</h1>
        <p className="text-white/90 mt-2 relative">Métricas detalladas de tu cuenta de Instagram</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-white" />} gradient="from-purple-500 to-purple-700" label="Seguidores" value={followers} />
        <StatCard icon={<UserPlus className="w-5 h-5 text-white" />} gradient="from-pink-500 to-rose-500" label="Siguiendo" value={following} />
        <StatCard icon={<ImageIcon className="w-5 h-5 text-white" />} gradient="from-orange-500 to-amber-500" label="Posts totales" value={mediaCount} />
        <StatCard icon={<Heart className="w-5 h-5 text-white" />} gradient="from-rose-500 to-pink-600" label="Likes (30d)" value={totalLikes30} />
        <StatCard icon={<Eye className="w-5 h-5 text-white" />} gradient="from-fuchsia-500 to-purple-600" label="Actividad (30d)" value={totalActivity30} />
        <StatCard icon={<Bookmark className="w-5 h-5 text-white" />} gradient="from-amber-500 to-orange-600" label="Saves (30d)" value={totalSaves30} />
      </div>

      {allStats.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-5 md:p-6 border-b border-white/10">
            <h2 className="text-lg md:text-xl font-bold text-white">Historial</h2>
            <p className="text-sm text-white/50">Métricas diarias recientes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-right px-4 py-3 font-semibold">Likes</th>
                  <th className="text-right px-4 py-3 font-semibold">Actividad</th>
                  <th className="text-right px-4 py-3 font-semibold">Seguidores</th>
                </tr>
              </thead>
              <tbody>
                {allStats.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.02]'} hover:bg-white/[0.05]`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {format(new Date(s.stat_date), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-right text-white/80">{(s.total_likes ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white/80">{(s.total_views ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-white/80">{(s.followers ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, gradient, label, value,
}: {
  icon: React.ReactNode
  gradient: string
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl p-4 md:p-5 hover:scale-[1.02] transition" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm mb-3`}>
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>
      <p className="text-sm font-medium text-white/50 mt-1">{label}</p>
    </div>
  )
}
