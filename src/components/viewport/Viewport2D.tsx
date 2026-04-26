import { useRef, useEffect, useCallback, RefObject } from 'react'
import * as math from 'mathjs'
import { useStore, SceneObject, EquationParams, PointParams, LineParams, CircleParams, RayParams, BoxParams, TriangleParams } from '../../store/useStore'

const GRID_COLOR = '#2a2a2a'
const AXIS_COLOR = '#444'
const LABEL_COLOR = '#666'
const BG = '#0f0f0f'

interface Transform {
  ox: number
  oy: number
  scale: number
}

function toCanvas(wx: number, wy: number, t: Transform) {
  return { x: t.ox + wx * t.scale, y: t.oy - wy * t.scale }
}

function toWorld(cx: number, cy: number, t: Transform) {
  return { x: (cx - t.ox) / t.scale, y: (t.oy - cy) / t.scale }
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: Transform) {
  const rawStep = 80 / t.scale
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = norm < 2 ? mag : norm < 5 ? 2 * mag : 5 * mag

  const wMin = toWorld(0, h, t)
  const wMax = toWorld(w, 0, t)

  ctx.strokeStyle = GRID_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = Math.floor(wMin.x / step) * step; x <= wMax.x; x += step) {
    const cx = toCanvas(x, 0, t).x
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
  }
  for (let y = Math.floor(wMin.y / step) * step; y <= wMax.y; y += step) {
    const cy = toCanvas(0, y, t).y
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
  }
  ctx.stroke()

  ctx.strokeStyle = AXIS_COLOR
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, t.oy)
  ctx.lineTo(w, t.oy)
  ctx.moveTo(t.ox, 0)
  ctx.lineTo(t.ox, h)
  ctx.stroke()

  ctx.fillStyle = LABEL_COLOR
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  for (let x = Math.floor(wMin.x / step) * step; x <= wMax.x; x += step) {
    if (Math.abs(x) < step * 0.01) continue
    const cx = toCanvas(x, 0, t).x
    ctx.fillText(+x.toPrecision(4) + '', cx, t.oy + 12)
  }
  ctx.textAlign = 'right'
  for (let y = Math.floor(wMin.y / step) * step; y <= wMax.y; y += step) {
    if (Math.abs(y) < step * 0.01) continue
    const cy = toCanvas(0, y, t).y
    ctx.fillText(+y.toPrecision(4) + '', t.ox - 4, cy + 4)
  }
}

function drawEquation(ctx: CanvasRenderingContext2D, obj: SceneObject, w: number, t: Transform) {
  const { expression } = obj.params as EquationParams
  let compiled: math.EvalFunction
  try { compiled = math.compile(expression) } catch { return }

  const steps = Math.max(w, 800)
  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.beginPath()
  let started = false
  for (let i = 0; i <= steps; i++) {
    const cx = (i / steps) * w
    const wx = toWorld(cx, 0, t).x
    let wy: number
    try { wy = compiled.evaluate({ x: wx }) } catch { started = false; continue }
    if (!isFinite(wy) || isNaN(wy)) { started = false; continue }
    const cy = toCanvas(0, wy, t).y
    if (!started) { ctx.moveTo(cx, cy); started = true } else { ctx.lineTo(cx, cy) }
  }
  ctx.stroke()
}

function drawPoint(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { x, y } = obj.params as PointParams
  const c = toCanvas(x, y, t)
  ctx.fillStyle = obj.color
  ctx.beginPath()
  ctx.arc(c.x, c.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = LABEL_COLOR
  ctx.font = '10px monospace'
  ctx.fillText(`(${x}, ${y})`, c.x + 6, c.y - 6)
}

function drawLine(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { x1, y1, x2, y2 } = obj.params as LineParams
  const a = toCanvas(x1, y1, t)
  const b = toCanvas(x2, y2, t)
  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

function drawCircle(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { cx, cy, r } = obj.params as CircleParams
  const c = toCanvas(cx, cy, t)
  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(c.x, c.y, r * t.scale, 0, Math.PI * 2)
  ctx.stroke()
}

function drawRay(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { ox, oy, dx, dy, length } = obj.params as RayParams
  const mag = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / mag
  const ny = dy / mag
  const ex = ox + nx * length
  const ey = oy + ny * length
  const a = toCanvas(ox, oy, t)
  const b = toCanvas(ex, ey, t)

  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()

  const angle = Math.atan2(a.y - b.y, a.x - b.x)
  const aSize = 8
  ctx.beginPath()
  ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x + aSize * Math.cos(angle - 0.4), b.y + aSize * Math.sin(angle - 0.4))
  ctx.moveTo(b.x, b.y)
  ctx.lineTo(b.x + aSize * Math.cos(angle + 0.4), b.y + aSize * Math.sin(angle + 0.4))
  ctx.stroke()
}

function drawBox(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { minX, minY, maxX, maxY } = obj.params as BoxParams
  const tl = toCanvas(minX, maxY, t)
  const w = (maxX - minX) * t.scale
  const h = (maxY - minY) * t.scale
  ctx.globalAlpha = 0.15
  ctx.fillStyle = obj.color
  ctx.fillRect(tl.x, tl.y, w, h)
  ctx.globalAlpha = 1
  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.strokeRect(tl.x, tl.y, w, h)
  ctx.fillStyle = LABEL_COLOR
  ctx.font = '10px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`(${minX},${minY})`, tl.x + 2, tl.y + h + 12)
}

function drawTriangle(ctx: CanvasRenderingContext2D, obj: SceneObject, t: Transform) {
  const { x1, y1, x2, y2, x3, y3 } = obj.params as TriangleParams
  const p1 = toCanvas(x1, y1, t)
  const p2 = toCanvas(x2, y2, t)
  const p3 = toCanvas(x3, y3, t)
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.lineTo(p3.x, p3.y)
  ctx.closePath()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = obj.color
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.strokeStyle = obj.color
  ctx.lineWidth = 2
  ctx.stroke()
}

export function Viewport2D({ canvasRef: externalRef }: { canvasRef?: RefObject<HTMLCanvasElement | null> }) {
  const internalRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalRef ?? internalRef
  const transformRef = useRef<Transform>({ ox: 0, oy: 0, scale: 60 })
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const objects = useStore((s) => s.objects)
  const intersection = useStore((s) => s.intersection)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width: w, height: h } = canvas
    const t = transformRef.current

    ctx.fillStyle = BG
    ctx.fillRect(0, 0, w, h)
    drawGrid(ctx, w, h, t)

    for (const obj of objects) {
      if (!obj.visible) continue
      switch (obj.type) {
        case 'equation': drawEquation(ctx, obj, w, t); break
        case 'point': drawPoint(ctx, obj, t); break
        case 'line': drawLine(ctx, obj, t); break
        case 'circle': drawCircle(ctx, obj, t); break
        case 'ray': drawRay(ctx, obj, t); break
        case 'box': drawBox(ctx, obj, t); break
        case 'triangle': drawTriangle(ctx, obj, t); break
      }
    }

    if (intersection.result?.exists) {
      for (const [px, py] of intersection.result.points) {
        const cp = toCanvas(px, py, t)
        ctx.beginPath()
        ctx.arc(cp.x, cp.y, 9, 0, Math.PI * 2)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#facc15'
        ctx.fill()
        ctx.fillStyle = '#facc15'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`(${px.toPrecision(3)}, ${py.toPrecision(3)})`, cp.x + 11, cp.y - 4)
      }
    }
  }, [objects, intersection])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      transformRef.current.ox = canvas.width / 2
      transformRef.current.oy = canvas.height / 2
      draw()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [draw])

  useEffect(() => { draw() }, [draw])

  function onMouseDown(e: React.MouseEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    transformRef.current.ox += e.clientX - dragRef.current.x
    transformRef.current.oy += e.clientY - dragRef.current.y
    dragRef.current = { x: e.clientX, y: e.clientY }
    draw()
  }

  function onMouseUp() { dragRef.current = null }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const t = transformRef.current
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    t.ox = mx + (t.ox - mx) * factor
    t.oy = my + (t.oy - my) * factor
    t.scale *= factor
    draw()
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-crosshair"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
    />
  )
}
