import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Platform = 'instagram' | 'tiktok'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  if (platform !== 'instagram' && platform !== 'tiktok') {
    return NextResponse.json({ error: 'Plataforma no válida' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { error } = await supabase
    .from('connected_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform as Platform)

  if (error) {
    return NextResponse.json({ error: 'No se pudo desconectar la cuenta' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
