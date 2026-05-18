'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, PenLine, X, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Guion {
  id: string
  title: string
  content: string
  updatedAt: string
}

const STORAGE_KEY = 'guiones_data'

export default function GuionesPage() {
  const [guiones, setGuiones] = useState<Guion[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Guion[] = JSON.parse(raw)
        queueMicrotask(() => {
          setGuiones(parsed)
          if (parsed.length > 0) setActiveId(parsed[0].id)
        })
      }
    } catch {}
    queueMicrotask(() => setHydrated(true))
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guiones))
  }, [guiones, hydrated])

  const active = guiones.find(g => g.id === activeId) ?? null

  function createGuion() {
    const title = newTitle.trim()
    if (!title) return
    const g: Guion = {
      id: crypto.randomUUID(),
      title,
      content: '',
      updatedAt: new Date().toISOString(),
    }
    setGuiones(prev => [g, ...prev])
    setActiveId(g.id)
    setNewTitle('')
    setShowModal(false)
  }

  function updateContent(content: string) {
    if (!active) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    // Optimistic immediate update for input responsiveness
    setGuiones(prev =>
      prev.map(g => (g.id === active.id ? { ...g, content } : g))
    )
    saveTimer.current = setTimeout(() => {
      setGuiones(prev =>
        prev.map(g =>
          g.id === active.id ? { ...g, content, updatedAt: new Date().toISOString() } : g
        )
      )
    }, 1000)
  }

  function deleteGuion(id: string) {
    setGuiones(prev => prev.filter(g => g.id !== id))
    if (activeId === id) {
      const remaining = guiones.filter(g => g.id !== id)
      setActiveId(remaining[0]?.id ?? null)
    }
    setConfirmDeleteId(null)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}>
        <div className="flex items-start justify-between gap-4 relative">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Guiones</h1>
            <p className="text-white/90 mt-2">Tu bloc de notas para crear contenido</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-700 font-semibold text-sm hover:bg-white/90 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Nuevo guión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 lg:max-h-[70vh] lg:overflow-y-auto">
          {guiones.length === 0 ? (
            <div className="py-10 text-center px-4">
              <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Sin guiones todavía</p>
              <p className="text-xs text-gray-400 mt-1">Crea uno con el botón de arriba</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {guiones.map(g => {
                const isActive = g.id === activeId
                const preview = g.content.replace(/\s+/g, ' ').slice(0, 60)
                return (
                  <li key={g.id}>
                    <button
                      onClick={() => setActiveId(g.id)}
                      className={`w-full text-left p-3 rounded-xl transition ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 ring-1 ring-pink-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
                          {g.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {preview || 'Sin contenido'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(new Date(g.updatedAt), "d MMM yyyy · HH:mm", { locale: es })}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Editor */}
        <div className="bg-[#1a1a2e] rounded-2xl shadow-lg overflow-hidden border border-gray-800 min-h-[60vh] flex flex-col">
          {active ? (
            <>
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <PenLine className="w-4 h-4 text-pink-400 shrink-0" />
                  <p className="text-white font-semibold truncate">{active.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/50 hidden sm:inline">
                    {format(new Date(active.updatedAt), "d MMM HH:mm", { locale: es })}
                  </span>
                  <button
                    onClick={() => setConfirmDeleteId(active.id)}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-red-500/30 transition"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                key={active.id}
                defaultValue={active.content}
                onChange={e => updateContent(e.target.value)}
                placeholder="Empieza a escribir tu guión..."
                className="flex-1 w-full bg-transparent p-5 text-gray-100 placeholder-gray-500 font-mono text-sm leading-relaxed resize-none outline-none"
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                <PenLine className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-semibold text-lg">Selecciona o crea un guión</p>
              <p className="text-white/60 text-sm mt-1">Tus ideas para el próximo Reel</p>
            </div>
          )}
        </div>
      </div>

      {/* New modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nuevo guión</h3>
              <button onClick={() => { setShowModal(false); setNewTitle('') }}
                className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Título</span>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createGuion()}
                  placeholder="Ej. Guión Reel viaje a Lisboa"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none text-sm"
                />
              </label>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => { setShowModal(false); setNewTitle('') }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={createGuion}
                disabled={!newTitle.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <h3 className="font-bold text-gray-900 mb-2">¿Eliminar guión?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteGuion(confirmDeleteId)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
