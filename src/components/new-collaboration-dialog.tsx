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

export default function NewCollaborationDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    brand: '', title: '', description: '', platform: 'instagram',
    status: 'pending', due_date: '', amount: '', notes: '',
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
    await supabase.from('collaborations').insert({
      user_id: user!.id,
      brand: form.brand,
      title: form.title,
      description: form.description || null,
      platform: form.platform,
      status: form.status,
      due_date: form.due_date || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      notes: form.notes || null,
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nueva colaboración</Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva colaboración</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Marca *</Label>
            <Input value={form.brand} onChange={e => set('brand', e.target.value)} required placeholder="Nombre de la marca" />
          </div>
          <div className="space-y-1">
            <Label>Título / tipo de contenido *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Unboxing, reseña, menciones..." />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Detalles del acuerdo..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Red social</Label>
              <Select value={form.platform} onValueChange={v => v !== null && set('platform', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="both">Ambas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="delivered">Entregada</SelectItem>
                  <SelectItem value="paid">Cobrada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Fecha de entrega</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Importe (€)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notas internas</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Notas privadas..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar colaboración'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
