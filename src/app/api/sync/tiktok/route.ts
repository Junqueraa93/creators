import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY!
const WINDSOR_TT = 'https://connectors.windsor.ai/tiktok_organic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(WINDSOR_TT)
  url.searchParams.set('api_key', WINDSOR_API_KEY)
  url.searchParams.set('date_preset', 'last_30d')
  url.searchParams.set('fields', 'date,account_name,video_views,likes,comments,shares,profile_views')

  const res = await fetch(url.toString())
  if (!res.ok) return NextResponse.json({ error: 'Error al obtener datos de Windsor.ai' }, { status: 502 })

  const json = await res.json()
  const rows: Record<string, unknown>[] = json.data ?? []

  const statsByDate = new Map<string, { likes: number; views: number; profile_views: number }>()
  for (const row of rows) {
    const date = String(row.date ?? '').slice(0, 10)
    if (!date) continue
    const existing = statsByDate.get(date) ?? { likes: 0, views: 0, profile_views: 0 }
    statsByDate.set(date, {
      likes: existing.likes + Number(row.likes ?? 0),
      views: existing.views + Number(row.video_views ?? 0),
      profile_views: existing.profile_views + Number(row.profile_views ?? 0),
    })
  }

  const accountStats = [...statsByDate.entries()].map(([stat_date, stats]) => ({
    user_id: user.id,
    platform: 'tiktok',
    stat_date,
    followers: 0,
    total_likes: stats.likes,
    total_views: stats.views,
    profile_views: stats.profile_views,
  }))

  if (accountStats.length) {
    await supabase.from('account_stats').upsert(accountStats, { onConflict: 'user_id,platform,stat_date' })
  }

  const latestRow = rows.at(-1)
  await supabase.from('connected_accounts')
    .upsert({
      user_id: user.id,
      platform: 'tiktok',
      username: String(latestRow?.account_name ?? 'Junquera'),
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })

  return NextResponse.json({ synced: accountStats.length, source: 'windsor.ai' })
}
