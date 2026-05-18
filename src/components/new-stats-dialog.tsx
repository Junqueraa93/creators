'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

export default function NewStatsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    platform: 'instagram',
    stat_date: new Date().toISOString().slice(0, 10),
    followers: '', following: '', total_likes: '', total_views: '', profile_views: '',
  })
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('account_stats').upsert({
      user_id: user!.id,
      platform: form.platform,
      stat_date: form.stat_date,
      followers: parseInt(form.followers) || 0,
      following: parseInt(form.following) || 0,
      total_likes: parseInt(form.total_likes) || 0,
      total_views: parseInt(form.total_views) || 0,
      profile_views: parseInt(form.profile_views) || 0,
    }, { onConflict: 'user_id,platform,stat_date' })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const fields = [
    { key: 'followers', label: 'Seguidores' },
    { key: 'following', label: 'Siguiendo' },
    { key: 'total_likes', label: 'Me gusta totales' },
    { key: 'total_views', label: 'Vistas totales' },
    { key: 'profile_views', label: 'Visitas al perfil' },
  ] as const

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Registrar stats</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar estadísticas de cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Plataforma</Label>
              <Select value={form.platform} onValueChange={v => v !== null && set('platform', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input type="date" value={form.stat_date} onChange={e => set('stat_date', e.target.value)} required />
            </div>
          </div>
          {fields.map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0" />
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
