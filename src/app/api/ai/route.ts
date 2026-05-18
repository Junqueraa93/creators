import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un asistente experto en creación de contenido para redes sociales, especializado en TikTok e Instagram.
Tu objetivo es ayudar a creadores de contenido a mejorar su rendimiento, crear mejores vídeos y conseguir más alcance.
Responde siempre en español, de forma clara, práctica y accionable. Usa listas y estructura cuando sea útil.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { type, data } = await request.json()

  let userMessage = ''

  if (type === 'video_analysis') {
    userMessage = `Analiza el rendimiento de este vídeo y dame feedback detallado con recomendaciones:

Título/descripción: ${data.title}
Vistas: ${data.views || 0}
Likes: ${data.likes || 0}
Comentarios: ${data.comments || 0}
Compartidos: ${data.shares || 0}
Contexto adicional: ${data.description || 'No especificado'}

Por favor analiza:
1. El rendimiento de las métricas (qué está bien, qué podría mejorar)
2. El ratio de engagement
3. Posibles razones del rendimiento
4. 3-5 recomendaciones concretas para el próximo vídeo similar`

  } else if (type === 'script') {
    userMessage = `Genera un guión completo para un vídeo de colaboración con los siguientes datos:

Marca: ${data.brand}
Producto/servicio: ${data.product}
Red social: ${data.platform}
Duración objetivo: ${data.duration || 'no especificada'}
Tono: ${data.tone || 'natural y auténtico'}
Instrucciones adicionales: ${data.extra || 'ninguna'}

El guión debe:
- Sonar natural y auténtico, no como publicidad obvia
- Incluir gancho inicial para los primeros 3 segundos
- Mencionar el producto de forma orgánica
- Incluir llamada a la acción al final
- Estar adaptado al formato y audiencia de ${data.platform}`

  } else if (type === 'inspiration') {
    userMessage = `Soy creadora de contenido y mi contenido que mejor ha funcionado es:
${data.myContent}

Mi nicho/temática: ${data.niche || 'no especificado'}
Red social objetivo: ${data.platform || 'TikTok/Instagram'}

Por favor:
1. Identifica los patrones de éxito en mi contenido
2. Sugiere 8-10 ideas de vídeos similares y relacionados que probablemente funcionen bien
3. Para cada idea indica: formato sugerido, gancho inicial, por qué podría funcionar
4. Sugiere tendencias actuales en mi nicho que podría aprovechar`
  } else {
    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const result = message.content[0].type === 'text' ? message.content[0].text : ''

  // Guardar el análisis en la base de datos
  await supabase.from('ai_analyses').insert({
    user_id: user.id,
    type,
    prompt: userMessage,
    result,
  })

  return NextResponse.json({ result })
}
