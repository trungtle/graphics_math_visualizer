import { useRef } from 'react'
import { useStore, SceneObject } from '../../store/useStore'

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function Toolbar() {
  const { objects, setObjects } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  function exportJson() {
    const data = JSON.stringify({ version: 1, objects }, null, 2)
    download(new Blob([data], { type: 'application/json' }), 'scene.json')
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        if (parsed.version === 1 && Array.isArray(parsed.objects)) {
          setObjects(parsed.objects as SceneObject[])
        }
      } catch { /* ignore malformed JSON */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-700 bg-zinc-900">
      <button onClick={exportJson} className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 rounded hover:bg-zinc-700" title="Export JSON (Ctrl+S)">
        ↓ JSON
      </button>
      <button onClick={() => fileRef.current?.click()} className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 rounded hover:bg-zinc-700" title="Import JSON">
        ↑ JSON
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJson} />
    </div>
  )
}
