import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION ?? 'v24.0'
const IG_LOGIN_API = 'https://graph.instagram.com'
const MEDIA_FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_url',
  'thumbnail_url',
  'permalink',
  'timestamp',
  'like_count',
  'comments_count',
].join(',')

type ConnectionRow = {
  access_token?: string | null
  platform_user_id?: string | null
  username?: string | null
  scopes?: string[] | null
}

type GraphMedia = {
  id: string
  caption?: string | null
  media_type?: string | null
  media_url?: string | null
  thumbnail_url?: string | null
  timestamp?: string | null
  like_count?: number | null
  comments_count?: number | null
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: connection } = await supabase
    .from('connected_accounts')
    .select('access_token, platform_user_id, username, scopes')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')
    .maybeSingle<ConnectionRow>()

  const accessToken = connection?.access_token
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Debes conectar tu propia cuenta de Instagram antes de sincronizar.' },
      { status: 400 }
    )
  }

  const scopes = Array.isArray(connection?.scopes) ? connection.scopes : []
  const usesMetaGraph =
    scopes.includes('pages_show_list') ||
    scopes.includes('instagram_manage_insights') ||
    scopes.includes('instagram_business_manage_insights') ||
    scopes.includes('pages_read_engagement')

  if (usesMetaGraph) {
    return syncWithMetaGraph(supabase, user.id, accessToken)
  }

  return syncWithInstagramLogin(supabase, user.id, accessToken)
}

async function syncWithMetaGraph(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userAccessToken: string
) {
  const pagesRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,followers_count,media_count}&access_token=${userAccessToken}`,
    { cache: 'no-store' }
  )
  if (!pagesRes.ok) {
    return NextResponse.json(
      { error: `Error al obtener páginas de Meta: ${await pagesRes.text()}` },
      { status: 502 }
    )
  }

  const pagesJson = await pagesRes.json() as {
    data?: Array<{
      id: string
      name?: string
      access_token?: string
      instagram_business_account?: {
        id?: string
        username?: string
        followers_count?: number
        media_count?: number
      }
    }>
  }

  const page = pagesJson.data?.find(p => p.instagram_business_account?.id && p.access_token)
  if (!page?.instagram_business_account?.id || !page.access_token) {
    return NextResponse.json(
      { error: 'La cuenta no tiene una Facebook Page vinculada con Instagram profesional.' },
      { status: 400 }
    )
  }

  const igUserId = page.instagram_business_account.id
  const pageAccessToken = page.access_token

  const profileRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}?fields=id,username,followers_count,follows_count,media_count&access_token=${pageAccessToken}`,
    { cache: 'no-store' }
  )
  if (!profileRes.ok) {
    return NextResponse.json(
      { error: `Error al obtener perfil de Instagram: ${await profileRes.text()}` },
      { status: 502 }
    )
  }

  const profile = await profileRes.json() as {
    id?: string
    username?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
  }

  const mediaRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media?fields=${MEDIA_FIELDS}&limit=50&access_token=${pageAccessToken}`,
    { cache: 'no-store' }
  )
  if (!mediaRes.ok) {
    return NextResponse.json(
      { error: `Error al obtener publicaciones de Instagram: ${await mediaRes.text()}` },
      { status: 502 }
    )
  }

  const mediaJson = await mediaRes.json() as { data?: GraphMedia[] }
  const mediaItems = mediaJson.data ?? []

  const postsRows = mediaItems.map(m => ({
    user_id: userId,
    platform: 'instagram',
    external_id: String(m.id),
    post_type: String(m.media_type ?? '').toUpperCase() === 'VIDEO' || String(m.media_type ?? '').toUpperCase() === 'REELS'
      ? 'reel'
      : 'post',
    url: (m.media_url ?? m.thumbnail_url ?? null) as string | null,
    title: m.caption ? String(m.caption).slice(0, 300) : null,
    published_at: m.timestamp ? new Date(String(m.timestamp)).toISOString() : new Date().toISOString(),
    likes: Number(m.like_count ?? 0),
    comments: Number(m.comments_count ?? 0),
    views: Number(m.like_count ?? 0) + Number(m.comments_count ?? 0),
    shares: 0,
    saves: 0,
  }))

  if (postsRows.length) {
    await supabase.from('posts').upsert(postsRows, { onConflict: 'user_id,platform,external_id' })
  }

  const statsByDate = new Map<string, { likes: number; comments: number; followers: number }>()
  for (const post of postsRows) {
    const date = post.published_at.slice(0, 10)
    const existing = statsByDate.get(date) ?? { likes: 0, comments: 0, followers: 0 }
    statsByDate.set(date, {
      likes: existing.likes + post.likes,
      comments: existing.comments + post.comments,
      followers: existing.followers,
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayStats = statsByDate.get(today) ?? { likes: 0, comments: 0, followers: 0 }
  statsByDate.set(today, {
    ...todayStats,
    followers: Number(profile.followers_count ?? page.instagram_business_account.followers_count ?? 0),
  })

  const accountStats = [...statsByDate.entries()].map(([stat_date, stats]) => ({
    user_id: userId,
    platform: 'instagram',
    stat_date,
    followers: stats.followers,
    total_likes: stats.likes,
    total_views: stats.likes + stats.comments,
    profile_views: stats.comments,
  }))

  if (accountStats.length) {
    await supabase.from('account_stats').upsert(accountStats, { onConflict: 'user_id,platform,stat_date' })
  }

  await supabase.from('connected_accounts').upsert({
    user_id: userId,
    platform: 'instagram',
    platform_user_id: String(igUserId),
    username: profile.username ?? page.instagram_business_account.username ?? null,
    access_token: pageAccessToken,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return NextResponse.json({
    posts: postsRows.length,
    followers: Number(profile.followers_count ?? page.instagram_business_account.followers_count ?? 0),
    media_count: Number(profile.media_count ?? page.instagram_business_account.media_count ?? 0),
    username: profile.username ?? page.instagram_business_account.username ?? null,
    source: 'meta_graph_api',
  })
}

async function syncWithInstagramLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accessToken: string
) {
  const profileRes = await fetch(
    `${IG_LOGIN_API}/me?fields=id,username,media_count&access_token=${accessToken}`,
    { cache: 'no-store' }
  )
  if (!profileRes.ok) {
    return NextResponse.json(
      { error: `Error al obtener perfil de Instagram: ${await profileRes.text()}` },
      { status: 502 }
    )
  }
  const profile = await profileRes.json() as {
    id?: string
    username?: string
    media_count?: number
  }

  const mediaRes = await fetch(
    `${IG_LOGIN_API}/me/media?fields=${MEDIA_FIELDS}&limit=50&access_token=${accessToken}`,
    { cache: 'no-store' }
  )
  if (!mediaRes.ok) {
    return NextResponse.json(
      { error: `Error al obtener publicaciones de Instagram: ${await mediaRes.text()}` },
      { status: 502 }
    )
  }
  const mediaJson = await mediaRes.json() as { data?: GraphMedia[] }
  const mediaItems = mediaJson.data ?? []

  const postsRows = mediaItems.map(m => ({
    user_id: userId,
    platform: 'instagram',
    external_id: String(m.id),
    post_type: String(m.media_type ?? '').toUpperCase() === 'VIDEO' || String(m.media_type ?? '').toUpperCase() === 'REELS'
      ? 'reel'
      : 'post',
    url: (m.media_url ?? m.thumbnail_url ?? null) as string | null,
    title: m.caption ? String(m.caption).slice(0, 300) : null,
    published_at: m.timestamp ? new Date(String(m.timestamp)).toISOString() : new Date().toISOString(),
    likes: Number(m.like_count ?? 0),
    comments: Number(m.comments_count ?? 0),
    views: Number(m.like_count ?? 0) + Number(m.comments_count ?? 0),
    shares: 0,
    saves: 0,
  }))

  if (postsRows.length) {
    await supabase.from('posts').upsert(postsRows, { onConflict: 'user_id,platform,external_id' })
  }

  const statsByDate = new Map<string, { likes: number; comments: number; followers: number }>()
  for (const post of postsRows) {
    const date = post.published_at.slice(0, 10)
    const existing = statsByDate.get(date) ?? { likes: 0, comments: 0, followers: 0 }
    statsByDate.set(date, {
      likes: existing.likes + post.likes,
      comments: existing.comments + post.comments,
      followers: existing.followers,
    })
  }

  const today = new Date().toISOString().slice(0, 10)
  statsByDate.set(today, {
    ...(statsByDate.get(today) ?? { likes: 0, comments: 0, followers: 0 }),
    followers: 0,
  })

  const accountStats = [...statsByDate.entries()].map(([stat_date, stats]) => ({
    user_id: userId,
    platform: 'instagram',
    stat_date,
    followers: stats.followers,
    total_likes: stats.likes,
    total_views: stats.likes + stats.comments,
    profile_views: stats.comments,
  }))

  if (accountStats.length) {
    await supabase.from('account_stats').upsert(accountStats, { onConflict: 'user_id,platform,stat_date' })
  }

  await supabase.from('connected_accounts').upsert({
    user_id: userId,
    platform: 'instagram',
    platform_user_id: String(profile.id ?? ''),
    username: profile.username ?? null,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return NextResponse.json({
    posts: postsRows.length,
    followers: 0,
    media_count: profile.media_count ?? 0,
    username: profile.username ?? null,
    source: 'instagram_login',
  })
}
