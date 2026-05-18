export function getInstagramRedirectUri(requestUrl?: string) {
  if (requestUrl) {
    const origin = new URL(requestUrl).origin
    return `${origin}/api/auth/instagram/callback`
  }

  const base = process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.INSTAGRAM_REDIRECT_URI?.replace(/\/api\/auth\/instagram\/callback$/, '')
    ?? 'http://localhost:3000'

  return `${base}/api/auth/instagram/callback`
}
