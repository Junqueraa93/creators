import AiAssistant from '@/components/ai-assistant'

export default function AIPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Asistente IA</h1>
        <p className="text-sm text-muted-foreground">Análisis de vídeos, guiones para colaboraciones e inspiración de contenido</p>
      </div>
      <AiAssistant />
    </div>
  )
}
