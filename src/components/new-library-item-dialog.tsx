'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

export default function NewLibraryItemDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'idea', title: '', body: '', platform: 'instagram',
    status: 'idea', tags: '',
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
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    await supabase.from('content_library').insert({
      user_id: user!.id,
      type: form.type,
      title: form.title,
      body: form.body || null,
      platform: form.platform || null,
      status: form.status,
      tags: tags.length ? tags : null,
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nueva entrada</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva idea o guión</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => v !== null && set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="script">Guión</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="in_progress">En desarrollo</SelectItem>
                  <SelectItem value="ready">Listo</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Título del vídeo o idea" />
          </div>
          <div className="space-y-1">
            <Label>Contenido / guión</Label>
            <Textarea value={form.body} onChange={e => set('body', e.target.value)} rows={5} placeholder="Escribe el guión, el concepto, puntos clave..." />
          </div>
          <div className="space-y-1">
            <Label>Red social</Label>
            <Select value={form.platform} onValueChange={v => v !== null && set('platform', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="both">Ambas</SelectItem>
                <SelectItem value="other">Otra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Etiquetas (separadas por coma)</Label>
            <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="lifestyle, beauty, collab..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
