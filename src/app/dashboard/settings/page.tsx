import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { headers } from 'next/headers'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ConnectButton from '@/components/connect-button'
import SyncButton from '@/components/sync-button'
import { getInstagramRedirectUri } from '@/lib/instagram-oauth'
import { AlertTriangle, CheckCircle2, Camera } from 'lucide-react'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParams
  const headerList = await headers()
  const forwardedProto = headerList.get('x-forwarded-proto') ?? 'http'
  const forwardedHost = headerList.get('x-forwarded-host') ?? headerList.get('host')
  const currentOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
  const expectedCallback = getInstagramRedirectUri(currentOrigin)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', user!.id)

  const igAccount = accounts?.find(a => a.platform === 'instagram')

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <h1 className="text-2xl font-bold relative">Configuración</h1>
        <p className="text-white/80 text-sm mt-1 relative">Cada usuario conecta y sincroniza su propia cuenta de Instagram</p>
      </div>

      {params.success === 'instagram' && (
        <div className="flex items-center gap-2 p-4 rounded-2xl text-sm font-medium"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Instagram conectado correctamente. Ya puedes sincronizar tus datos.
        </div>
      )}
      {params.error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          Error al conectar Instagram. Inténtalo de nuevo.
        </div>
      )}

      {expectedCallback && (
        <div className="flex items-start gap-3 p-4 rounded-2xl text-sm font-medium"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>Usa esta URL exacta como redirect URI en Meta.</p>
            <p className="text-xs text-white/60 break-all">Dominio actual: {currentOrigin}</p>
            <p className="text-xs text-white/60 break-all">Callback: {expectedCallback}</p>
            <p className="text-xs text-white/60">
              Registra exactamente esa URL en Meta Developer Console para evitar <span className="text-white/80">Invalid redirect_uri</span>.
            </p>
          </div>
        </div>
      )}

      {/* Instagram card */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-white">Instagram</p>
                {igAccount
                  ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Conectado</Badge>
                  : <Badge className="bg-white/10 text-white/50 border-white/10 text-xs">No conectado</Badge>
                }
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {igAccount
                  ? `@${igAccount.username} · sync: ${igAccount.last_synced_at ? format(new Date(igAccount.last_synced_at), "d MMM HH:mm", { locale: es }) : 'nunca'}`
                  : 'Conecta tu propia cuenta para obtener posts, seguidores y estadísticas'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <ConnectButton
              platform="instagram"
              connected={Boolean(igAccount)}
              configured={true}
            />
            <SyncButton platform="instagram" />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/8">
          <p className="text-xs text-white/40">
            Datos sincronizados: <span className="text-white/60">Instagram API + métricas por usuario</span>
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/40 leading-relaxed">
          <span className="text-white/60 font-medium">Instagram API</span> proporciona posts individuales con thumbnails, captions y estadísticas de interacción.{' '}
          La app agrega likes, comentarios y actividad para construir gráficas y resúmenes visuales.
        </p>
      </div>

      <div
        className="rounded-2xl p-5 md:p-6"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-lg md:text-xl font-bold text-white">Checklist de conexión</h2>
        <p className="text-sm text-white/50 mt-1 mb-4">
          Si Instagram falla, revisa esto antes de volver a probar.
        </p>

        <div className="grid gap-3">
          <CheckItem
            title="Redirect URI registrado"
            description={expectedCallback}
          />
          <CheckItem
            title="Dominio correcto"
            description={currentOrigin}
          />
          <CheckItem
            title="Cuenta profesional"
            description="Debe ser Creator o Business para mostrar métricas completas."
          />
          <CheckItem
            title="Permisos de Meta"
            description="La app debe tener los permisos de Instagram habilitados y revisados."
          />
        </div>
      </div>
    </div>
  )
}

function CheckItem({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
        <span className="block h-2 w-2 rounded-full bg-green-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/50 break-all">{description}</p>
      </div>
    </div>
  )
}
