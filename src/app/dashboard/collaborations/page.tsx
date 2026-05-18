import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import NewCollaborationDialog from '@/components/new-collaboration-dialog'

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  delivered: 'Entregada',
  paid: 'Cobrada',
  cancelled: 'Cancelada',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'default',
  delivered: 'secondary',
  paid: 'secondary',
  cancelled: 'destructive',
}

export default async function CollaborationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: collabs } = await supabase
    .from('collaborations')
    .select('*')
    .eq('user_id', user!.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const collabList = (collabs ?? []) as unknown as Collab[]
  const active = collabList.filter(c => ['pending', 'in_progress'].includes(c.status))
  const past = collabList.filter(c => !['pending', 'in_progress'].includes(c.status))

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colaboraciones</h1>
          <p className="text-sm text-muted-foreground">Agenda y seguimiento de marcas</p>
        </div>
        <NewCollaborationDialog />
      </div>

      <section>
        <h2 className="text-base font-semibold mb-3">Activas ({active.length})</h2>
        {!active.length && <p className="text-sm text-muted-foreground">No hay colaboraciones activas.</p>}
        <div className="grid gap-3">
          {active.map(c => <CollabCard key={c.id} collab={c} />)}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">Historial</h2>
          <div className="grid gap-3">
            {past.map(c => <CollabCard key={c.id} collab={c} muted />)}
          </div>
        </section>
      )}
    </div>
  )
}

interface Collab {
  id: string; brand: string; title: string; description?: string; platform: string;
  status: string; due_date?: string; amount?: number; notes?: string;
}

function CollabCard({ collab, muted }: { collab: Collab; muted?: boolean }) {
  return (
    <Card className={muted ? 'opacity-70' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={statusVariant[collab.status] ?? 'outline'}>
                {statusLabel[collab.status] ?? collab.status}
              </Badge>
              <Badge variant="outline">{collab.platform}</Badge>
              {collab.amount && (
                <span className="text-sm font-medium text-green-600">{Number(collab.amount).toFixed(2)}€</span>
              )}
            </div>
            <CardTitle className="text-base">{collab.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{collab.brand}</p>
          </div>
          {collab.due_date && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">Entrega</p>
              <p className="text-sm font-medium">
                {format(new Date(collab.due_date), 'd MMM', { locale: es })}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      {(collab.description || collab.notes) && (
        <CardContent className="pt-0 space-y-1">
          {collab.description && <p className="text-sm">{collab.description}</p>}
          {collab.notes && <p className="text-xs text-muted-foreground italic">{collab.notes}</p>}
        </CardContent>
      )}
    </Card>
  )
}
