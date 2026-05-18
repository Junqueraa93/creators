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

export default function NewPostDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    platform: 'tiktok', post_type: 'video', title: '', url: '',
    published_at: new Date().toISOString().slice(0, 16),
    views: '', likes: '', comments: '', shares: '', saves: '',
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
    await supabase.from('posts').insert({
      user_id: user!.id,
      platform: form.platform,
      post_type: form.post_type,
      title: form.title || null,
      url: form.url || null,
      published_at: new Date(form.published_at).toISOString(),
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      comments: parseInt(form.comments) || 0,
      shares: parseInt(form.shares) || 0,
      saves: parseInt(form.saves) || 0,
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Añadir publicación</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva publicación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Red social</Label>
              <Select value={form.platform} onValueChange={v => v !== null && set('platform', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.post_type} onValueChange={v => v !== null && set('post_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="carousel">Carrusel</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Título / descripción</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>URL del post</Label>
            <Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label>Fecha de publicación</Label>
            <Input type="datetime-local" value={form.published_at} onChange={e => set('published_at', e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['views', 'likes', 'comments', 'shares', 'saves'] as const).map(field => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field === 'views' ? 'Vistas' : field === 'likes' ? 'Likes' : field === 'comments' ? 'Comentarios' : field === 'shares' ? 'Compartidos' : 'Guardados'}</Label>
                <Input type="number" min="0" value={form[field]} onChange={e => set(field, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar publicación'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
