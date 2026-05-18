'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function SyncButton({ platform }: { platform: 'instagram' | 'tiktok' }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/sync/${platform}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setResult(`${data.synced} publicaciones sincronizadas`)
        router.refresh()
      } else {
        setResult(data.error ?? 'Error al sincronizar')
      }
    } catch {
      setResult('Error de red')
    }
    setLoading(false)
    setTimeout(() => setResult(null), 4000)
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
      <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Sincronizar
      </Button>
    </div>
  )
}
