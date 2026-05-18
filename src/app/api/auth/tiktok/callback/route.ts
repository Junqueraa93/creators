import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const base = new URL(request.url).origin

  const storedState = request.cookies.get('tiktok_state')?.value
  const codeVerifier = request.cookies.get('tiktok_cv')?.value

  if (error || !code || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(`${base}/dashboard/settings?error=tiktok_denied`)
  }

  const redirectUri = `${base}/api/auth/tiktok/callback`

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/dashboard/settings?error=tiktok_token`)
  }

  const tokenData = await tokenRes.json()
  const { access_token, refresh_token, expires_in, open_id, scope } = tokenData

  // Obtener info del usuario
  const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const userData = userRes.ok ? await userRes.json() : null
  const username = userData?.data?.user?.display_name ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base}/login`)

  await supabase.from('connected_accounts').upsert({
    user_id: user.id,
    platform: 'tiktok',
    platform_user_id: open_id,
    username,
    access_token,
    refresh_token,
    token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    scopes: scope?.split(',') ?? [],
  }, { onConflict: 'user_id,platform' })

  const response = NextResponse.redirect(`${base}/dashboard/settings?success=tiktok`)
  response.cookies.delete('tiktok_cv')
  response.cookies.delete('tiktok_state')
  return response
}
