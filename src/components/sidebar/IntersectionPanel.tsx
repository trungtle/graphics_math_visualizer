import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { computeIntersection } from '../../intersection'
import { AnalyticPanel } from './AnalyticPanel'

export function IntersectionPanel() {
  const objects = useStore((s) => s.objects)
  const { idA, idB, result } = useStore((s) => s.intersection)
  const setIntersectionPair = useStore((s) => s.setIntersectionPair)
  const setIntersectionResult = useStore((s) => s.setIntersectionResult)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!idA || !idB) { setIntersectionResult(null); return }
    const objA = objects.find((o) => o.id === idA)
    const objB = objects.find((o) => o.id === idB)
    if (!objA || !objB) { setIntersectionResult(null); return }
    setIntersectionResult(computeIntersection(objA, objB))
  }, [objects, idA, idB]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border-t border-zinc-700 bg-zinc-900 shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-zinc-400 hover:text-zinc-200 text-xs font-mono font-semibold"
      >
        <span>⊕ INTERSECTION</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3 border-t border-zinc-800">
          <div className="flex flex-col gap-1 pt-2">
            <label className="text-zinc-500 text-xs">OBJECT A</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100 text-xs font-mono"
              value={idA ?? ''}
              onChange={(e) => setIntersectionPair(e.target.value || null, idB)}
            >
              <option value="">— select —</option>
              {objects.map((o) => (
                <option key={o.id} value={o.id}>{o.label} ({o.type})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-zinc-500 text-xs">OBJECT B</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100 text-xs font-mono"
              value={idB ?? ''}
              onChange={(e) => setIntersectionPair(idA, e.target.value || null)}
            >
              <option value="">— select —</option>
              {objects.filter((o) => o.id !== idA).map((o) => (
                <option key={o.id} value={o.id}>{o.label} ({o.type})</option>
              ))}
            </select>
          </div>

          {result && (
            <div className={`text-xs font-mono px-2 py-1.5 rounded leading-relaxed ${result.exists ? 'bg-green-900/30 text-green-300' : 'bg-zinc-800 text-zinc-500'}`}>
              <div className="font-semibold">{result.description}</div>
              {result.points.map((p, i) => (
                <div key={i} className="text-zinc-400">
                  P{result.points.length > 1 ? i+1 : ''} = ({p[0].toPrecision(4)}, {p[1].toPrecision(4)}, {p[2].toPrecision(4)})
                </div>
              ))}
              {result.line && (
                <div className="text-zinc-400">
                  D = ({result.line.direction[0].toPrecision(3)}, {result.line.direction[1].toPrecision(3)}, {result.line.direction[2].toPrecision(3)})
                </div>
              )}
            </div>
          )}

          {result && result.analytic.length > 0 && (
            <details>
              <summary className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer select-none py-1">
                Analytic solution ▸
              </summary>
              <AnalyticPanel lines={result.analytic} />
            </details>
          )}
        </div>
      )}
    </div>
  )
}
