'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Link2, Link2Off, RefreshCw } from 'lucide-react'

export default function ConnectButton({
  platform,
  connected,
  configured,
}: {
  platform: 'instagram' | 'tiktok'
  connected: boolean
  configured: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!configured) return null

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${platform}/disconnect`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={handleDisconnect}
        disabled={loading}
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Link2Off className="w-4 h-4 mr-2" />
        )}
        Desconectar
      </Button>
    )
  }

  return (
    <a
      href={`/api/auth/${platform}`}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Link2 className="w-4 h-4 mr-2" />
      Conectar
    </a>
  )
}
