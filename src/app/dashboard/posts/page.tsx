/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowUpRight,
  Bookmark,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'

type PostRow = {
  id: string
  title?: string | null
  url?: string | null
  published_at: string
  post_type?: string | null
  likes?: number | null
  comments?: number | null
  views?: number | null
  shares?: number | null
  saves?: number | null
}

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user!.id)
    .eq('platform', 'instagram')
    .order('published_at', { ascending: false })

  const safePosts = (posts ?? []) as PostRow[]
  const score = (p: PostRow) => (p.likes ?? 0) + (p.comments ?? 0) * 3
  const rankedPosts = [...safePosts].sort((a, b) => score(b) - score(a))
  const topPost = rankedPosts[0]

  const totalLikes = safePosts.reduce((sum, post) => sum + (post.likes ?? 0), 0)
  const totalComments = safePosts.reduce((sum, post) => sum + (post.comments ?? 0), 0)
  const totalViews = safePosts.reduce((sum, post) => sum + (post.views ?? 0), 0)
  const totalEngagement = totalLikes + totalComments
  const avgEngagement = safePosts.length ? Math.round(totalEngagement / safePosts.length) : 0

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const day = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
    return {
      day,
      label: format(new Date(day), 'EEE', { locale: es }).slice(0, 3),
    }
  })
  const postsByDay = new Map<string, number>()
  safePosts.forEach(post => {
    const day = post.published_at.slice(0, 10)
    postsByDay.set(day, (postsByDay.get(day) ?? 0) + 1)
  })
  const maxDayCount = Math.max(...last14Days.map(d => postsByDay.get(d.day) ?? 0), 1)

  const topFive = rankedPosts.slice(0, 5)
  const maxScore = Math.max(...topFive.map(post => score(post)), 1)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
      >
        <div className="absolute -bottom-12 -right-8 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -top-12 -left-10 w-44 h-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Publicaciones</h1>
            <p className="text-white/90 mt-2">Rendimiento visual de tus posts de Instagram</p>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold bg-white/10 backdrop-blur">
            <TrendingUp className="w-4 h-4" />
            Insights
          </div>
        </div>
      </div>

      {(!posts || posts.length === 0) ? (
        <div
          className="rounded-3xl p-10 md:p-16 text-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aún no hay publicaciones</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto">
            Sincroniza tu cuenta en Configuración para ver tus posts, métricas y gráficas aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<BarChart3 className="w-5 h-5 text-white" />} gradient="from-purple-500 to-purple-700" label="Publicaciones" value={safePosts.length} />
            <MetricCard icon={<Heart className="w-5 h-5 text-white" />} gradient="from-pink-500 to-rose-500" label="Likes" value={totalLikes} />
            <MetricCard icon={<MessageCircle className="w-5 h-5 text-white" />} gradient="from-orange-500 to-amber-500" label="Comentarios" value={totalComments} />
            <MetricCard icon={<Eye className="w-5 h-5 text-white" />} gradient="from-fuchsia-500 to-purple-600" label="Actividad" value={totalViews} />
          </div>

          <div
            className="rounded-2xl p-5 md:p-6"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">Top publicaciones</h2>
                <p className="text-sm text-white/50">Ordenadas por engagement real: likes + comentarios</p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                {avgEngagement.toLocaleString()} avg
              </div>
            </div>

            <div className="space-y-4">
              {topFive.map((post, index) => {
                const total = score(post)
                const width = (total / maxScore) * 100
                const type = (post.post_type ?? '').toString().toUpperCase() || 'POST'
                return (
                  <div
                    key={post.id}
                    className="rounded-2xl p-3 md:p-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white shrink-0">
                        #{index + 1}
                      </div>
                      <div className="relative h-16 w-16 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400">
                        {post.url ? (
                          <img
                            src={post.url}
                            alt={post.title ?? 'Post de Instagram'}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 text-white/80">
                            {type}
                          </span>
                          <span className="text-[10px] text-white/35">
                            {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm md:text-base font-semibold text-white line-clamp-1">
                          {post.title || 'Publicación sin título'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/55">
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-400" />{(post.likes ?? 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-orange-300" />{(post.comments ?? 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-fuchsia-300" />{((post.saves ?? 0)).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white">{total.toLocaleString()}</p>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">score</p>
                      </div>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(width, 8)}%`,
                          background: 'linear-gradient(90deg, #833ab4 0%, #fd1d1d 55%, #fcb045 100%)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Actividad de publicación</h2>
                  <p className="text-sm text-white/50">Últimos 14 días con publicaciones</p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {safePosts.length} posts
                </div>
              </div>

              <div className="flex items-end gap-1.5 h-40">
                {last14Days.map(day => {
                  const count = postsByDay.get(day.day) ?? 0
                  const height = (count / maxDayCount) * 100
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end h-32">
                        <div
                          className="w-full rounded-t-lg transition-all hover:opacity-80"
                          style={{
                            height: `${Math.max(height, count > 0 ? 8 : 4)}%`,
                            background: 'linear-gradient(180deg, #833ab4 0%, #fd1d1d 60%, #fcb045 100%)',
                          }}
                          title={`${count} publicación(es)`}
                        />
                      </div>
                      <span className="text-[10px] text-white/45 font-medium">{day.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Resumen</h2>
                  <p className="text-sm text-white/50">Lo que más está funcionando</p>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {topPost ? 'Top post' : 'Sin top'}
                </div>
              </div>

              <div className="space-y-3">
                <SmallStat label="Likes totales" value={totalLikes} />
                <SmallStat label="Comentarios totales" value={totalComments} />
                <SmallStat label="Actividad total" value={totalViews} />
              </div>

              {topPost && (
                <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">Mejor publicación</p>
                  <p className="mt-2 text-sm font-semibold text-white line-clamp-3">
                    {topPost.title || 'Publicación sin título'}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/55">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-pink-400" />
                      {(topPost.likes ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-orange-300" />
                      {(topPost.comments ?? 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                      {score(topPost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safePosts.map(post => {
              const isTop = topPost && topPost.id === post.id
              const type = (post.post_type ?? '').toString().toUpperCase()
              return (
                <div
                  key={post.id}
                  className={`relative rounded-2xl hover:scale-[1.02] transition overflow-hidden ${
                    isTop ? 'p-[2px]' : ''
                  }`}
                  style={isTop
                    ? { background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }
                    : { background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  <div className={`${isTop ? 'rounded-[14px] overflow-hidden' : ''}`} style={isTop ? { background: 'rgba(15,10,30,0.95)' } : undefined}>
                    <div className="relative aspect-square w-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {post.url ? (
                        <img
                          src={post.url}
                          alt={post.title ?? 'Post'}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <Sparkles className="w-10 h-10 text-white/60" />
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {isTop && (
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-md"
                            style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
                          >
                            🔥 Best
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur">
                          {type || 'POST'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-white/40 mb-1">
                        {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}
                      </p>
                      <p className="text-sm font-semibold text-white line-clamp-2 mb-3">
                        {post.title || 'Publicación sin título'}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <PostStat icon={<Eye className="w-3.5 h-3.5" />} value={post.views ?? 0} />
                        <PostStat icon={<Heart className="w-3.5 h-3.5" />} value={post.likes ?? 0} />
                        <PostStat icon={<MessageCircle className="w-3.5 h-3.5" />} value={post.comments ?? 0} />
                        <PostStat icon={<ArrowUpRight className="w-3.5 h-3.5" />} value={post.shares ?? 0} />
                        <PostStat icon={<Bookmark className="w-3.5 h-3.5" />} value={post.saves ?? 0} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({
  icon,
  gradient,
  label,
  value,
}: {
  icon: ReactNode
  gradient: string
  label: string
  value: number
}) {
  return (
    <div
      className="rounded-2xl p-4 md:p-5 transition hover:scale-[1.02]"
      style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-3`}>
        {icon}
      </div>
      <p className="text-2xl md:text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-sm font-medium text-white/50 mt-1">{label}</p>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-sm text-white/55">{label}</span>
      <span className="text-sm font-semibold text-white">{value.toLocaleString()}</span>
    </div>
  )
}

function PostStat({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-1 text-white/60">
      <span className="text-pink-500">{icon}</span>
      <span className="font-semibold">{value.toLocaleString()}</span>
    </div>
  )
}
