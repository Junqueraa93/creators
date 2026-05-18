'use client'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2 } from 'lucide-react'

function ResultBox({ result }: { result: string }) {
  return (
    <div className="mt-4 p-4 rounded-lg bg-muted whitespace-pre-wrap text-sm leading-relaxed">
      {result}
    </div>
  )
}

function VideoAnalysisTab() {
  const [form, setForm] = useState({ title: '', views: '', likes: '', comments: '', shares: '', description: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'video_analysis', data: form }),
    })
    const data = await res.json()
    setResult(data.result ?? data.error ?? 'Error desconocido')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Título / descripción del vídeo</Label>
        <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="¿De qué trata el vídeo?" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['views', 'likes', 'comments', 'shares'] as const).map(field => (
          <div key={field} className="space-y-1">
            <Label>{field === 'views' ? 'Vistas' : field === 'likes' ? 'Likes' : field === 'comments' ? 'Comentarios' : 'Compartidos'}</Label>
            <Input type="number" min="0" value={form[field]} onChange={e => set(field, e.target.value)} placeholder="0" />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>Contexto adicional (opcional)</Label>
        <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
          placeholder="¿Qué pasó en el vídeo? ¿Qué formato? ¿Se hizo colaboración?" />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</> : <><Sparkles className="w-4 h-4 mr-2" />Analizar vídeo</>}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  )
}

function ScriptTab() {
  const [form, setForm] = useState({ brand: '', product: '', platform: 'instagram', duration: '', tone: '', extra: '' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'script', data: form }),
    })
    const data = await res.json()
    setResult(data.result ?? data.error ?? 'Error desconocido')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Marca *</Label>
          <Input value={form.brand} onChange={e => set('brand', e.target.value)} required placeholder="Nombre de la marca" />
        </div>
        <div className="space-y-1">
          <Label>Producto / servicio *</Label>
          <Input value={form.product} onChange={e => set('product', e.target.value)} required placeholder="Qué promocionas" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Red social</Label>
          <Input value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="Instagram, TikTok..." />
        </div>
        <div className="space-y-1">
          <Label>Duración objetivo</Label>
          <Input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="30s, 1min..." />
        </div>
        <div className="space-y-1">
          <Label>Tono</Label>
          <Input value={form.tone} onChange={e => set('tone', e.target.value)} placeholder="Natural, divertido..." />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Instrucciones adicionales</Label>
        <Textarea value={form.extra} onChange={e => set('extra', e.target.value)} rows={2}
          placeholder="Puntos clave a mencionar, restricciones, estilo personal..." />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generando guión...</> : <><Sparkles className="w-4 h-4 mr-2" />Generar guión</>}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  )
}

function InspirationTab() {
  const [form, setForm] = useState({ myContent: '', niche: '', platform: 'tiktok' })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'inspiration', data: form }),
    })
    const data = await res.json()
    setResult(data.result ?? data.error ?? 'Error desconocido')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Tus mejores vídeos / tipo de contenido que mejor te ha funcionado *</Label>
        <Textarea value={form.myContent} onChange={e => set('myContent', e.target.value)} required rows={3}
          placeholder="Ej: tutoriales de maquillaje de menos de 1 min, unboxings de ropa, rutinas de mañana..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tu nicho / temática</Label>
          <Input value={form.niche} onChange={e => set('niche', e.target.value)} placeholder="Belleza, lifestyle, fitness..." />
        </div>
        <div className="space-y-1">
          <Label>Red social objetivo</Label>
          <Input value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="TikTok, Instagram..." />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Buscando ideas...</> : <><Sparkles className="w-4 h-4 mr-2" />Buscar inspiración</>}
      </Button>
      {result && <ResultBox result={result} />}
    </form>
  )
}

export default function AiAssistant() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="analysis">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="analysis" className="flex-1">Analizar vídeo</TabsTrigger>
            <TabsTrigger value="script" className="flex-1">Generar guión</TabsTrigger>
            <TabsTrigger value="inspiration" className="flex-1">Inspiración</TabsTrigger>
          </TabsList>
          <TabsContent value="analysis"><VideoAnalysisTab /></TabsContent>
          <TabsContent value="script"><ScriptTab /></TabsContent>
          <TabsContent value="inspiration"><InspirationTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
