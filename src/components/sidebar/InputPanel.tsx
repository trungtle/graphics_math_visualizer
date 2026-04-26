import { useState, useEffect } from 'react'
import * as math from 'mathjs'
import { useStore, ObjectType, SceneObject, RayParams, EquationParams, PointParams, LineParams, CircleParams, SphereParams, PlaneParams, BoxParams, TriangleParams } from '../../store/useStore'
import { LayerList } from './LayerList'

const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6']

let colorIdx = 0
function nextColor() {
  return COLORS[colorIdx++ % COLORS.length]
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

const DEFAULT_PARAMS: Record<ObjectType, object> = {
  equation: { expression: 'sin(x)' },
  point: { x: 0, y: 0, z: 0 },
  line: { x1: -1, y1: -1, z1: 0, x2: 1, y2: 1, z2: 0 },
  circle: { cx: 0, cy: 0, r: 1 },
  sphere: { cx: 0, cy: 0, cz: 0, r: 1 },
  plane: { nx: 0, ny: 1, nz: 0, d: 0 },
  ray: { ox: 0, oy: 0, oz: 0, dx: 1, dy: 0, dz: 0, length: 5 },
  box: { minX: -1, minY: -1, minZ: -1, maxX: 1, maxY: 1, maxZ: 1 },
  triangle: { x1: 0, y1: 1, z1: 0, x2: -1, y2: -1, z2: 0, x3: 1, y3: -1, z3: 0 },
}

export function InputPanel() {
  const { addObject, updateObject, renderMode, editingId, setEditingId, objects } = useStore()
  const [type, setType] = useState<ObjectType>('equation')
  const [params, setParams] = useState<Record<string, string | number>>(DEFAULT_PARAMS.equation as Record<string, string | number>)
  const [color, setColor] = useState(nextColor)
  const [error, setError] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<string | null>(null)

  // Sync InputPanel state from the object being edited (only fires when editingId changes)
  useEffect(() => {
    if (!editingId) return
    const obj = objects.find((o) => o.id === editingId)
    if (!obj) return
    setType(obj.type)
    setParams(obj.params as unknown as Record<string, string | number>)
    setColor(obj.color)
    setIsDirty(false)
    setError('')
  }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape cancels edit; Enter triggers add/update (unless in a select)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingId) {
        cancelEdit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  function cancelEdit() {
    setEditingId(null)
    setIsDirty(false)
    setDiscardTarget(null)
    setType('equation')
    setParams(DEFAULT_PARAMS.equation as Record<string, string | number>)
    setColor(nextColor())
  }

  function handleRequestEdit(id: string) {
    if (editingId === id) return
    if (isDirty) {
      setDiscardTarget(id)
    } else {
      setEditingId(id)
    }
  }

  function handleTypeChange(t: ObjectType) {
    setType(t)
    setParams(DEFAULT_PARAMS[t] as Record<string, string | number>)
    setError('')
    if (editingId) setIsDirty(true)
  }

  function handleParamChange(key: string, value: string) {
    setParams((p) => ({ ...p, [key]: key === 'expression' ? value : parseFloat(value) || 0 }))
    if (editingId) setIsDirty(true)
  }

  function handleColorChange(c: string) {
    setColor(c)
    if (editingId) setIsDirty(true)
  }

  function validate(): boolean {
    setError('')
    if (type === 'equation') {
      try {
        math.parse((params as { expression: string }).expression)
      } catch {
        setError('Invalid expression')
        return false
      }
    }
    return true
  }

  function handleAdd() {
    if (!validate()) return
    const obj: SceneObject = {
      id: uid(),
      type,
      params: params as unknown as SceneObject['params'],
      color,
      visible: true,
      label: type === 'equation' ? (params as { expression: string }).expression : `${type}-${uid().slice(0, 4)}`,
    }
    addObject(obj)
    setColor(nextColor())
    setParams(DEFAULT_PARAMS[type] as Record<string, string | number>)
  }

  function handleUpdate() {
    if (!editingId || !validate()) return
    const original = objects.find((o) => o.id === editingId)
    const label = type === 'equation'
      ? (params as { expression: string }).expression
      : (original?.label ?? `${type}-${editingId.slice(0, 4)}`)
    updateObject(editingId, type, params as unknown as SceneObject['params'], color, label)
    setEditingId(null)
    setIsDirty(false)
    setParams(DEFAULT_PARAMS[type] as Record<string, string | number>)
    setColor(nextColor())
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100 font-mono text-sm">
      {editingId && (
        <div className="px-3 py-1.5 bg-blue-900/30 border-b border-blue-800 text-blue-300 text-xs flex items-center gap-2">
          <span>✎</span>
          <span className="flex-1 truncate">Editing: {objects.find(o => o.id === editingId)?.label}</span>
          <button onClick={cancelEdit} className="text-blue-400 hover:text-blue-200 text-xs">✕</button>
        </div>
      )}

      <div className="p-3 border-b border-zinc-700">
        <label className="block text-zinc-400 text-xs mb-1">TYPE</label>
        <select
          className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-100"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as ObjectType)}
        >
          {(['equation', 'point', 'line', 'circle', 'sphere', 'plane', 'ray', 'box', 'triangle'] as ObjectType[]).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="p-3 border-b border-zinc-700 flex flex-col gap-2">
        <ParamFields type={type} params={params} renderMode={renderMode} onChange={handleParamChange} />
        <div className="flex items-center gap-2">
          <label className="text-zinc-400 text-xs">COLOR</label>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {discardTarget && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded px-2 py-2 text-xs">
            <p className="text-yellow-300 mb-1.5">Discard unsaved changes?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingId(discardTarget); setDiscardTarget(null); setIsDirty(false) }}
                className="bg-yellow-700 hover:bg-yellow-600 text-white rounded px-2 py-1 text-xs"
              >
                Discard
              </button>
              <button
                onClick={() => setDiscardTarget(null)}
                className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded px-2 py-1 text-xs"
              >
                Keep editing
              </button>
            </div>
          </div>
        )}

        {editingId ? (
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleUpdate}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white rounded px-3 py-1 text-xs font-semibold"
            >
              UPDATE
            </button>
            <button
              onClick={cancelEdit}
              className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded px-3 py-1 text-xs"
            >
              Cancel (Esc)
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded px-3 py-1 text-xs font-semibold mt-1"
          >
            ADD (Enter)
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <LayerList editingId={editingId} onRequestEdit={handleRequestEdit} />
      </div>
    </div>
  )
}

interface ParamFieldsProps {
  type: ObjectType
  params: Record<string, string | number>
  renderMode: string
  onChange: (key: string, value: string) => void
}

function ParamFields({ type, params, renderMode, onChange }: ParamFieldsProps) {
  if (type === 'equation') {
    return (
      <Field label="f(x)" field="expression" value={(params as unknown as EquationParams).expression} onChange={onChange} isText />
    )
  }
  if (type === 'point') {
    const p = params as unknown as PointParams
    return <>
      <Field label="x" field="x" value={p.x} onChange={onChange} />
      <Field label="y" field="y" value={p.y} onChange={onChange} />
      {renderMode === '3d' && <Field label="z" field="z" value={p.z} onChange={onChange} />}
    </>
  }
  if (type === 'line') {
    const p = params as unknown as LineParams
    return <>
      <Field label="x1" field="x1" value={p.x1} onChange={onChange} />
      <Field label="y1" field="y1" value={p.y1} onChange={onChange} />
      {renderMode === '3d' && <Field label="z1" field="z1" value={p.z1} onChange={onChange} />}
      <Field label="x2" field="x2" value={p.x2} onChange={onChange} />
      <Field label="y2" field="y2" value={p.y2} onChange={onChange} />
      {renderMode === '3d' && <Field label="z2" field="z2" value={p.z2} onChange={onChange} />}
    </>
  }
  if (type === 'circle') {
    const p = params as unknown as CircleParams
    return <>
      <Field label="cx" field="cx" value={p.cx} onChange={onChange} />
      <Field label="cy" field="cy" value={p.cy} onChange={onChange} />
      <Field label="r" field="r" value={p.r} onChange={onChange} />
    </>
  }
  if (type === 'sphere') {
    const p = params as unknown as SphereParams
    return <>
      <Field label="cx" field="cx" value={p.cx} onChange={onChange} />
      <Field label="cy" field="cy" value={p.cy} onChange={onChange} />
      <Field label="cz" field="cz" value={p.cz} onChange={onChange} />
      <Field label="r" field="r" value={p.r} onChange={onChange} />
    </>
  }
  if (type === 'plane') {
    const p = params as unknown as PlaneParams
    return <>
      <Field label="nx" field="nx" value={p.nx} onChange={onChange} />
      <Field label="ny" field="ny" value={p.ny} onChange={onChange} />
      <Field label="nz" field="nz" value={p.nz} onChange={onChange} />
      <Field label="d" field="d" value={p.d} onChange={onChange} />
    </>
  }
  if (type === 'ray') {
    const p = params as unknown as RayParams
    return <>
      <Field label="ox" field="ox" value={p.ox} onChange={onChange} />
      <Field label="oy" field="oy" value={p.oy} onChange={onChange} />
      {renderMode === '3d' && <Field label="oz" field="oz" value={p.oz} onChange={onChange} />}
      <Field label="dx" field="dx" value={p.dx} onChange={onChange} />
      <Field label="dy" field="dy" value={p.dy} onChange={onChange} />
      {renderMode === '3d' && <Field label="dz" field="dz" value={p.dz} onChange={onChange} />}
      <Field label="len" field="length" value={p.length} onChange={onChange} />
    </>
  }
  if (type === 'box') {
    const p = params as unknown as BoxParams
    return <>
      <Field label="minX" field="minX" value={p.minX} onChange={onChange} />
      <Field label="minY" field="minY" value={p.minY} onChange={onChange} />
      {renderMode === '3d' && <Field label="minZ" field="minZ" value={p.minZ} onChange={onChange} />}
      <Field label="maxX" field="maxX" value={p.maxX} onChange={onChange} />
      <Field label="maxY" field="maxY" value={p.maxY} onChange={onChange} />
      {renderMode === '3d' && <Field label="maxZ" field="maxZ" value={p.maxZ} onChange={onChange} />}
    </>
  }
  if (type === 'triangle') {
    const p = params as unknown as TriangleParams
    return <>
      <Field label="x1" field="x1" value={p.x1} onChange={onChange} />
      <Field label="y1" field="y1" value={p.y1} onChange={onChange} />
      {renderMode === '3d' && <Field label="z1" field="z1" value={p.z1} onChange={onChange} />}
      <Field label="x2" field="x2" value={p.x2} onChange={onChange} />
      <Field label="y2" field="y2" value={p.y2} onChange={onChange} />
      {renderMode === '3d' && <Field label="z2" field="z2" value={p.z2} onChange={onChange} />}
      <Field label="x3" field="x3" value={p.x3} onChange={onChange} />
      <Field label="y3" field="y3" value={p.y3} onChange={onChange} />
      {renderMode === '3d' && <Field label="z3" field="z3" value={p.z3} onChange={onChange} />}
    </>
  }
  return null
}

interface FieldProps {
  label: string
  field: string
  value: string | number
  onChange: (key: string, value: string) => void
  isText?: boolean
}

function Field({ label, field, value, onChange, isText }: FieldProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-400 text-xs w-8 shrink-0">{label}</span>
      <input
        type={isText ? 'text' : 'number'}
        step={isText ? undefined : 'any'}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-zinc-100 text-xs"
      />
    </div>
  )
}
