import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok no configurado' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  const csrfState = crypto.randomBytes(16).toString('hex')

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('scope', 'user.info.basic,video.list,user.info.stats')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', csrfState)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  const response = NextResponse.redirect(url.toString())
  // Guardar verifier en cookie para el callback
  response.cookies.set('tiktok_cv', codeVerifier, { httpOnly: true, sameSite: 'lax', maxAge: 600 })
  response.cookies.set('tiktok_state', csrfState, { httpOnly: true, sameSite: 'lax', maxAge: 600 })
  return response
}
