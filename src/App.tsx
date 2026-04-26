import { useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { InputPanel } from './components/sidebar/InputPanel'
import { Toolbar } from './components/sidebar/Toolbar'
import { Viewport2D } from './components/viewport/Viewport2D'
import { Viewport3D } from './components/viewport/Viewport3D'

const STORAGE_KEY = 'eq-viz-scene-v1'

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export default function App() {
  const { renderMode, setRenderMode, selectedId, removeObject, objects, setObjects } = useStore()
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null)
  const canvas3dRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setObjects(JSON.parse(saved))
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(objects)) } catch { /* ignore */ }
  }, [objects])

  function exportPng() {
    const canvas = renderMode === '2d'
      ? canvas2dRef.current
      : document.querySelector<HTMLCanvasElement>('canvas[data-engine]') ?? canvas3dRef.current
    if (!canvas) return
    downloadDataUrl(canvas.toDataURL('image/png'), 'viewport.png')
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Delete' && selectedId) {
        removeObject(selectedId)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const { objects: objs } = useStore.getState()
        const data = JSON.stringify({ version: 1, objects: objs }, null, 2)
        const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
        const a = document.createElement('a')
        a.href = url; a.download = 'scene.json'; a.click()
        URL.revokeObjectURL(url)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, removeObject])

  return (
    <div className="flex w-full h-full bg-zinc-950">
      <aside className="w-72 shrink-0 border-r border-zinc-700 flex flex-col">
        <Toolbar />
        <InputPanel />
      </aside>

      <main className="flex-1 relative">
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={exportPng}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 border border-zinc-600 rounded px-2 py-1 text-xs font-mono"
            title="Export PNG"
          >
            PNG
          </button>
          <div className="flex rounded overflow-hidden border border-zinc-600">
            <button
              onClick={() => setRenderMode('2d')}
              className={`px-3 py-1 text-xs font-mono font-semibold ${renderMode === '2d' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              2D
            </button>
            <button
              onClick={() => setRenderMode('3d')}
              className={`px-3 py-1 text-xs font-mono font-semibold ${renderMode === '3d' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
            >
              3D
            </button>
          </div>
        </div>

        {renderMode === '2d'
          ? <Viewport2D canvasRef={canvas2dRef} />
          : <Viewport3D />}
      </main>
    </div>
  )
}
