import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstagramRedirectUri } from '@/lib/instagram-oauth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const base = new URL(request.url).origin
  const redirectUri = getInstagramRedirectUri(request.url)

  if (error || !code) {
    return NextResponse.redirect(`${base}/dashboard/settings?error=instagram_denied`)
  }

  // 1. Intercambiar code por short-lived token
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!tokenRes.ok) {
    console.error('Token error:', await tokenRes.text())
    return NextResponse.redirect(`${base}/dashboard/settings?error=instagram_token`)
  }

  const { access_token, user_id } = await tokenRes.json()

  // 2. Token de larga duración (60 días)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`
  )
  const longData = longRes.ok ? await longRes.json() : null
  const finalToken = longData?.access_token ?? access_token
  const expiresIn = longData?.expires_in ?? 5184000

  // 3. Obtener perfil
  const profileRes = await fetch(
    `https://graph.instagram.com/${user_id}?fields=id,username,media_count&access_token=${finalToken}`
  )
  const profile = profileRes.ok ? await profileRes.json() : {}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login`)

  await supabase.from('connected_accounts').upsert({
    user_id: user.id,
    platform: 'instagram',
    platform_user_id: String(user_id),
    username: profile.username ?? null,
    access_token: finalToken,
    token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scopes: ['instagram_business_basic', 'instagram_business_manage_insights'],
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return NextResponse.redirect(`${base}/dashboard/settings?success=instagram`)
}
