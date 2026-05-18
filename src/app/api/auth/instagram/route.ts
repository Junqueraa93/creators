import { NextRequest, NextResponse } from 'next/server'
import { getInstagramRedirectUri } from '@/lib/instagram-oauth'

export async function GET(request: NextRequest) {
  const clientId = process.env.INSTAGRAM_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Instagram no configurado' }, { status: 500 })

  const redirectUri = getInstagramRedirectUri(request.url)

  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_manage_insights')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('enable_fb_login', '0')
  url.searchParams.set('force_authentication', '1')

  return NextResponse.redirect(url.toString())
}
