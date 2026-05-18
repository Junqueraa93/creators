/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server'
import { Users, Heart, Eye, Activity, Flame } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import ActivityHeatmap from '@/components/activity-heatmap'

export default async function DashboardHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const since30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const since7 = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const sinceYear = format(subDays(new Date(), 365), 'yyyy-MM-dd')

  const [{ data: statsAll }, { data: posts }, { data: yearPosts }] = await Promise.all([
    supabase
      .from('account_stats')
      .select('*')
      .eq('user_id', user!.id)
      .eq('platform', 'instagram')
      .order('stat_date', { ascending: false })
      .limit(60),
    supabase
      .from('posts')
      .select('*')
      .eq('user_id', user!.id)
      .eq('platform', 'instagram')
      .order('published_at', { ascending: false })
      .limit(4),
    supabase
      .from('posts')
      .select('published_at, platform')
      .eq('user_id', user!.id)
      .gte('published_at', sinceYear),
  ])

  const stats30 = (statsAll ?? []).filter(s => s.stat_date >= since30)
  const stats7 = (statsAll ?? []).filter(s => s.stat_date >= since7)

  const latestFollowers = (statsAll ?? []).find(s => (s.followers ?? 0) > 0)?.followers ?? 0
  const totalLikes30 = stats30.reduce((a, s) => a + (s.total_likes ?? 0), 0)
  const totalReach30 = stats30.reduce((a, s) => a + (s.total_views ?? 0), 0)
  // Interacciones aproximadas = likes + saves (profile_views como proxy si existiera)
  const totalInteractions30 = stats30.reduce(
    (a, s) => a + (s.total_likes ?? 0) + (s.profile_views ?? 0),
    0
  )

  // Datos para gráfica últimos 7 días - likes por día
  const last7Days: { date: string; likes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const row = stats7.find(s => s.stat_date === d)
    last7Days.push({ date: d, likes: row?.total_likes ?? 0 })
  }
  const maxLikes = Math.max(...last7Days.map(d => d.likes), 1)

  const postScore = (p: { likes?: number; comments?: number }) => (p.likes ?? 0) + (p.comments ?? 0) * 3
  const topReach = (posts ?? []).reduce(
    (max, p) => (postScore(p) > postScore(max) ? p : max),
    posts?.[0]
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <p className="text-white/80 text-sm capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            ¡Hola, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-white/90 mt-2 text-sm md:text-base max-w-xl">
            Aquí tienes tu resumen de Instagram. Sigue creando contenido increíble.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5 text-white" />}
          gradient="from-purple-500 to-purple-700"
          label="Seguidores"
          value={latestFollowers}
          sub="Instagram"
        />
        <KpiCard
          icon={<Heart className="w-5 h-5 text-white" />}
          gradient="from-pink-500 to-rose-500"
          label="Likes"
          value={totalLikes30}
          sub="últimos 30 días"
        />
        <KpiCard
          icon={<Eye className="w-5 h-5 text-white" />}
          gradient="from-orange-500 to-amber-500"
          label="Actividad"
          value={totalReach30}
          sub="likes + comentarios"
        />
        <KpiCard
          icon={<Activity className="w-5 h-5 text-white" />}
          gradient="from-fuchsia-500 to-pink-500"
          label="Interacciones"
          value={totalInteractions30}
          sub="últimos 30 días"
        />
      </div>

      {/* Engagement chart */}
      <div className="rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Engagement últimos 7 días</h2>
            <p className="text-sm text-white/50">Likes por día</p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
            7d
          </div>
        </div>
        <div className="flex items-end gap-2 md:gap-3 h-40">
          {last7Days.map((d, i) => {
            const h = (d.likes / maxLikes) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end h-32">
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(h, 4)}%`,
                      background: 'linear-gradient(180deg, #833ab4 0%, #fd1d1d 60%, #fcb045 100%)',
                    }}
                    title={`${d.likes} likes`}
                  />
                </div>
                <span className="text-[10px] md:text-xs text-white/50 font-medium">
                  {format(new Date(d.date), 'EEE', { locale: es }).slice(0, 3)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Latest posts */}
      <div className="rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Últimas publicaciones</h2>
            <p className="text-sm text-white/50">Tus últimos posts de Instagram</p>
          </div>
        </div>
        {(!posts || posts.length === 0) ? (
          <p className="text-sm text-white/50 py-6 text-center">Aún no hay publicaciones.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div
                key={post.id}
                className="flex gap-3 md:gap-4 p-3 rounded-xl transition" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                  {post.url ? (
                    <img
                      src={post.url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <Flame className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {topReach && topReach.id === post.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                        🔥 Top
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wide">
                      {post.post_type}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {format(new Date(post.published_at), "d MMM", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {post.title || 'Publicación sin título'}
                  </p>
                  <div className="flex gap-3 mt-1.5 text-xs text-white/50">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(post.views ?? 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{(post.likes ?? 0).toLocaleString()}</span>
                    <span className="hidden sm:flex items-center gap-1">↗ {(post.shares ?? 0).toLocaleString()}</span>
                    <span className="hidden sm:flex items-center gap-1">🔖 {(post.saves ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl p-5 md:p-6" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-lg md:text-xl font-bold text-white mb-1">Actividad anual</h2>
        <p className="text-sm text-white/50 mb-4">Últimos 365 días de publicaciones</p>
        <ActivityHeatmap posts={yearPosts ?? []} />
      </div>
    </div>
  )
}

function KpiCard({
  icon, gradient, label, value, sub,
}: {
  icon: React.ReactNode
  gradient: string
  label: string
  value: number
  sub: string
}) {
  return (
    <div className="rounded-2xl p-4 md:p-5 transition hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{(value ?? 0).toLocaleString()}</p>
      <p className="text-sm font-medium text-white/80 mt-1">{label}</p>
      <p className="text-xs text-white/40">{sub}</p>
    </div>
  )
}
