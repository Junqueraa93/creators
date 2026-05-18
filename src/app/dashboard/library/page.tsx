import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import NewLibraryItemDialog from '@/components/new-library-item-dialog'

interface LibraryItem {
  id: string; type: string; title: string; body?: string; platform?: string;
  status: string; tags?: string[]; created_at: string;
}

const typeLabel: Record<string, string> = { script: 'Guión', idea: 'Idea' }
const statusLabel: Record<string, string> = { idea: 'Idea', in_progress: 'En desarrollo', ready: 'Listo', published: 'Publicado' }
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  idea: 'outline', in_progress: 'default', ready: 'secondary', published: 'secondary',
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: items } = await supabase
    .from('content_library')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const itemList = (items ?? []) as unknown as LibraryItem[]
  const scripts = itemList.filter(i => i.type === 'script')
  const ideas = itemList.filter(i => i.type === 'idea')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de contenido</h1>
          <p className="text-sm text-muted-foreground">Guiones e ideas para futuros vídeos</p>
        </div>
        <NewLibraryItemDialog />
      </div>

      <Section title="Guiones" items={scripts} />
      <Section title="Ideas" items={ideas} />
    </div>
  )
}

function Section({ title, items }: { title: string; items: LibraryItem[] }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3">{title} ({items.length})</h2>
      {!items.length && <p className="text-sm text-muted-foreground">No hay {title.toLowerCase()} todavía.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2 flex-wrap">
                <Badge variant="outline">{typeLabel[item.type]}</Badge>
                <Badge variant={statusVariant[item.status] ?? 'outline'}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
                {item.platform && <Badge variant="secondary">{item.platform}</Badge>}
              </div>
              <CardTitle className="text-base mt-1">{item.title}</CardTitle>
            </CardHeader>
            {(item.body || item.tags?.length) && (
              <CardContent className="pt-0 space-y-2">
                {item.body && <p className="text-sm text-muted-foreground line-clamp-3">{item.body}</p>}
                {(item.tags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags!.map(tag => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(item.created_at), "d MMM yyyy", { locale: es })}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}
