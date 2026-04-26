import { SceneObject, RayParams, LineParams, CircleParams, SphereParams, PlaneParams, TriangleParams, BoxParams } from '../store/useStore'

type Vec3 = [number, number, number]

const EPS = 1e-8
const DIST_EPS = 1e-4

export interface IntersectionResult {
  exists: boolean
  points: Vec3[]
  line?: { origin: Vec3; direction: Vec3 }
  analytic: string[]
  description: string
}

// ---- Vector helpers ----
function dot3(a: Vec3, b: Vec3): number { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] }
function cross3(a: Vec3, b: Vec3): Vec3 { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]] }
function len3(v: Vec3): number { return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]) }
function add3(a: Vec3, b: Vec3): Vec3 { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]] }
function sub3(a: Vec3, b: Vec3): Vec3 { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]] }
function scale3(v: Vec3, s: number): Vec3 { return [v[0]*s, v[1]*s, v[2]*s] }
function cross2(ax: number, ay: number, bx: number, by: number): number { return ax*by - ay*bx }

function fmt(n: number): string { return (+n.toPrecision(4)).toString() }

function noResult(desc: string, analytic: string[] = []): IntersectionResult {
  return { exists: false, points: [], analytic, description: desc }
}
function hit(points: Vec3[], desc: string, analytic: string[], line?: IntersectionResult['line']): IntersectionResult {
  return { exists: points.length > 0, points, analytic, description: desc, line }
}

// ---- Param extractors ----
function asRay(o: SceneObject): { o: Vec3; d: Vec3 } {
  const p = o.params as RayParams
  const mag = Math.sqrt(p.dx*p.dx + p.dy*p.dy + p.dz*p.dz) || 1
  return { o: [p.ox, p.oy, p.oz], d: [p.dx/mag, p.dy/mag, p.dz/mag] }
}
function asLine(o: SceneObject): { p: Vec3; d: Vec3 } {
  const p = o.params as LineParams
  const q: Vec3 = [p.x2, p.y2, p.z2]
  const from: Vec3 = [p.x1, p.y1, p.z1]
  return { p: from, d: sub3(q, from) }
}
function asCircle(o: SceneObject): { c: Vec3; r: number } {
  const p = o.params as CircleParams
  return { c: [p.cx, p.cy, 0], r: p.r }
}
function asSphere(o: SceneObject): { c: Vec3; r: number } {
  const p = o.params as SphereParams
  return { c: [p.cx, p.cy, p.cz], r: p.r }
}
function asPlane(o: SceneObject): { n: Vec3; d: number } {
  const p = o.params as PlaneParams
  const mag = Math.sqrt(p.nx*p.nx + p.ny*p.ny + p.nz*p.nz) || 1
  return { n: [p.nx/mag, p.ny/mag, p.nz/mag], d: p.d }
}
function asTriangle(o: SceneObject): { v0: Vec3; v1: Vec3; v2: Vec3 } {
  const p = o.params as TriangleParams
  return { v0: [p.x1, p.y1, p.z1], v1: [p.x2, p.y2, p.z2], v2: [p.x3, p.y3, p.z3] }
}
function asBox(o: SceneObject): { min: Vec3; max: Vec3 } {
  const p = o.params as BoxParams
  return { min: [p.minX, p.minY, p.minZ], max: [p.maxX, p.maxY, p.maxZ] }
}

// Helper: pick the object of a given type from a pair
function pick(a: SceneObject, b: SceneObject, type: string): SceneObject {
  return a.type === type ? a : b
}

// ---- 1. ray × ray (2D + 3D) ----
function intersectRayRay(a: SceneObject, b: SceneObject): IntersectionResult {
  const ra = asRay(a), rb = asRay(b)
  const w = sub3(ra.o, rb.o)
  const aa = dot3(ra.d, ra.d)
  const bb = dot3(ra.d, rb.d)
  const cc = dot3(rb.d, rb.d)
  const dd = dot3(ra.d, w)
  const ee = dot3(rb.d, w)
  const DD = aa*cc - bb*bb

  const analytic = [
    `\\text{Ray A: } O_A=(${fmt(ra.o[0])},${fmt(ra.o[1])},${fmt(ra.o[2])}),\\ \\mathbf{D}_A=(${fmt(ra.d[0])},${fmt(ra.d[1])},${fmt(ra.d[2])})`,
    `\\text{Ray B: } O_B=(${fmt(rb.o[0])},${fmt(rb.o[1])},${fmt(rb.o[2])}),\\ \\mathbf{D}_B=(${fmt(rb.d[0])},${fmt(rb.d[1])},${fmt(rb.d[2])})`,
    `\\Delta = (\\mathbf{D}_A\\cdot\\mathbf{D}_A)(\\mathbf{D}_B\\cdot\\mathbf{D}_B)-(\\mathbf{D}_A\\cdot\\mathbf{D}_B)^2 = ${fmt(DD)}`,
  ]

  if (DD < EPS) {
    analytic.push(`\\Delta \\approx 0 \\Rightarrow \\text{Parallel rays}`)
    return noResult('Parallel rays', analytic)
  }

  const t = (bb*ee - cc*dd) / DD
  const s = (aa*ee - bb*dd) / DD
  analytic.push(`t = ${fmt(t)},\\quad s = ${fmt(s)}`)

  if (t < 0 || s < 0) {
    analytic.push(`t<0 \\text{ or } s<0 \\Rightarrow \\text{Intersection behind origin}`)
    return noResult('No intersection (behind origin)', analytic)
  }

  const p1 = add3(ra.o, scale3(ra.d, t))
  const p2 = add3(rb.o, scale3(rb.d, s))
  const dist = len3(sub3(p1, p2))
  analytic.push(`P_A(t)=(${fmt(p1[0])},${fmt(p1[1])},${fmt(p1[2])}),\\quad P_B(s)=(${fmt(p2[0])},${fmt(p2[1])},${fmt(p2[2])})`)
  analytic.push(`\\text{distance}=|P_A-P_B|=${fmt(dist)}`)

  if (dist > DIST_EPS) {
    analytic.push(`\\text{Rays are skew (closest approach: }${fmt(dist)}\\text{)}`)
    return noResult(`Skew rays (gap ${fmt(dist)})`, analytic)
  }

  const p: Vec3 = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2, (p1[2]+p2[2])/2]
  analytic.push(`P=(${fmt(p[0])},${fmt(p[1])},${fmt(p[2])})`)
  return hit([p], '1 intersection point', analytic)
}

// ---- 2. ray × line (2D) ----
function intersectRayLine(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const ln = asLine(pick(a, b, 'line'))
  const denom = cross2(ray.d[0], ray.d[1], ln.d[0], ln.d[1])
  const wx = ln.p[0] - ray.o[0], wy = ln.p[1] - ray.o[1]

  const analytic = [
    `\\text{Ray: } O=(${fmt(ray.o[0])},${fmt(ray.o[1])}),\\ \\mathbf{D}=(${fmt(ray.d[0])},${fmt(ray.d[1])})`,
    `\\text{Line: } P=(${fmt(ln.p[0])},${fmt(ln.p[1])}),\\ \\mathbf{d}=(${fmt(ln.d[0])},${fmt(ln.d[1])})`,
    `\\mathbf{D}_{ray} \\times \\mathbf{d}_{line} = ${fmt(denom)}`,
  ]

  if (Math.abs(denom) < EPS) {
    analytic.push(`\\approx 0 \\Rightarrow \\text{Parallel}`)
    return noResult('Parallel', analytic)
  }

  const t = cross2(wx, wy, ln.d[0], ln.d[1]) / denom
  analytic.push(`t = \\frac{(P-O)\\times\\mathbf{d}}{\\mathbf{D}\\times\\mathbf{d}} = ${fmt(t)}`)

  if (t < 0) {
    analytic.push(`t<0 \\Rightarrow \\text{Behind ray origin}`)
    return noResult('No intersection (behind origin)', analytic)
  }

  const p: Vec3 = [ray.o[0]+t*ray.d[0], ray.o[1]+t*ray.d[1], 0]
  analytic.push(`P=O+t\\mathbf{D}=(${fmt(p[0])},${fmt(p[1])})`)
  return hit([p], '1 intersection point', analytic)
}

// ---- Shared quadratic solver for ray/line vs circle/sphere ----
function solveQuadratic(aa: number, bb: number, cc: number): number[] {
  const disc = bb*bb - 4*aa*cc
  if (disc < 0) return []
  if (disc < EPS) return [-bb / (2*aa)]
  const sq = Math.sqrt(disc)
  return [(-bb - sq) / (2*aa), (-bb + sq) / (2*aa)]
}

// ---- 3. ray × circle (2D) ----
function intersectRayCircle(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const circ = asCircle(pick(a, b, 'circle'))
  const w: Vec3 = [ray.o[0]-circ.c[0], ray.o[1]-circ.c[1], 0]
  const aa = dot3(ray.d, ray.d)
  const bb = 2*dot3(w, ray.d)
  const cc = dot3(w, w) - circ.r*circ.r
  const disc = bb*bb - 4*aa*cc

  const analytic = [
    `\\text{Ray: } O=(${fmt(ray.o[0])},${fmt(ray.o[1])}),\\ \\mathbf{D}=(${fmt(ray.d[0])},${fmt(ray.d[1])})`,
    `\\text{Circle: } C=(${fmt(circ.c[0])},${fmt(circ.c[1])}),\\ r=${fmt(circ.r)}`,
    `\\mathbf{w}=O-C=(${fmt(w[0])},${fmt(w[1])})`,
    `a=${fmt(aa)},\\quad b=${fmt(bb)},\\quad c=${fmt(cc)}`,
    `\\Delta=b^2-4ac=${fmt(disc)}`,
  ]

  const ts = solveQuadratic(aa, bb, cc).filter(t => t >= 0)

  if (ts.length === 0) {
    analytic.push(disc < 0 ? `\\Delta<0 \\Rightarrow \\text{No intersection}` : `\\text{All }t<0 \\Rightarrow \\text{Circle behind origin}`)
    return noResult(disc < 0 ? 'No intersection' : 'No intersection (behind origin)', analytic)
  }

  analytic.push(`t=${ts.map(fmt).join(',\\ ')}`)
  const points = ts.map(t => [ray.o[0]+t*ray.d[0], ray.o[1]+t*ray.d[1], 0] as Vec3)
  analytic.push(`P_i=${points.map(p=>`(${fmt(p[0])},${fmt(p[1])})`).join(',\\ ')}`)
  const desc = ts.length === 1 ? 'Tangent (1 point)' : '2 intersection points'
  return hit(points, desc, analytic)
}

// ---- 4. line × line (2D) ----
function intersectLineLine(a: SceneObject, b: SceneObject): IntersectionResult {
  const la = asLine(a), lb = asLine(b)
  const denom = cross2(la.d[0], la.d[1], lb.d[0], lb.d[1])
  const wx = lb.p[0]-la.p[0], wy = lb.p[1]-la.p[1]

  const analytic = [
    `\\text{Line A direction: } (${fmt(la.d[0])},${fmt(la.d[1])})`,
    `\\text{Line B direction: } (${fmt(lb.d[0])},${fmt(lb.d[1])})`,
    `\\mathbf{d}_A \\times \\mathbf{d}_B = ${fmt(denom)}`,
  ]

  if (Math.abs(denom) < EPS) {
    analytic.push(`\\approx 0 \\Rightarrow \\text{Parallel lines}`)
    return noResult('Parallel lines', analytic)
  }

  const t = cross2(wx, wy, lb.d[0], lb.d[1]) / denom
  const p: Vec3 = [la.p[0]+t*la.d[0], la.p[1]+t*la.d[1], 0]
  analytic.push(`t=\\frac{(P_B-P_A)\\times\\mathbf{d}_B}{\\mathbf{d}_A\\times\\mathbf{d}_B}=${fmt(t)}`)
  analytic.push(`P=(${fmt(p[0])},${fmt(p[1])})`)
  return hit([p], '1 intersection point', analytic)
}

// ---- 5. line × circle (2D) ----
function intersectLineCircle(a: SceneObject, b: SceneObject): IntersectionResult {
  const ln = asLine(pick(a, b, 'line'))
  const circ = asCircle(pick(a, b, 'circle'))
  const w: Vec3 = [ln.p[0]-circ.c[0], ln.p[1]-circ.c[1], 0]
  const aa = dot3(ln.d, ln.d)
  const bb = 2*dot3(w, ln.d)
  const cc = dot3(w, w) - circ.r*circ.r
  const disc = bb*bb - 4*aa*cc

  const analytic = [
    `\\text{Line through } (${fmt(ln.p[0])},${fmt(ln.p[1])}),\\ \\mathbf{d}=(${fmt(ln.d[0])},${fmt(ln.d[1])})`,
    `\\text{Circle: } C=(${fmt(circ.c[0])},${fmt(circ.c[1])}),\\ r=${fmt(circ.r)}`,
    `a=${fmt(aa)},\\quad b=${fmt(bb)},\\quad c=${fmt(cc)},\\quad \\Delta=${fmt(disc)}`,
  ]

  if (disc < 0) {
    analytic.push(`\\Delta<0 \\Rightarrow \\text{No intersection}`)
    return noResult('No intersection', analytic)
  }

  const ts = solveQuadratic(aa, bb, cc)
  const points = ts.map(t => [ln.p[0]+t*ln.d[0], ln.p[1]+t*ln.d[1], 0] as Vec3)
  analytic.push(`t=${ts.map(fmt).join(',\\ ')}`)
  analytic.push(`P_i=${points.map(p=>`(${fmt(p[0])},${fmt(p[1])})`).join(',\\ ')}`)
  const desc = disc < EPS ? 'Tangent (1 point)' : '2 intersection points'
  return hit(points, desc, analytic)
}

// ---- 6. ray × plane (3D) ----
function intersectRayPlane(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const pl = asPlane(pick(a, b, 'plane'))
  const nDotD = dot3(pl.n, ray.d)
  const nDotO = dot3(pl.n, ray.o)

  const analytic = [
    `\\text{Ray: } O=(${fmt(ray.o[0])},${fmt(ray.o[1])},${fmt(ray.o[2])}),\\ \\mathbf{D}=(${fmt(ray.d[0])},${fmt(ray.d[1])},${fmt(ray.d[2])})`,
    `\\text{Plane: } \\mathbf{n}=(${fmt(pl.n[0])},${fmt(pl.n[1])},${fmt(pl.n[2])}),\\ d=${fmt(pl.d)}`,
    `\\mathbf{n}\\cdot\\mathbf{D}=${fmt(nDotD)}`,
  ]

  if (Math.abs(nDotD) < EPS) {
    analytic.push(`\\approx 0 \\Rightarrow \\text{Ray parallel to plane}`)
    return noResult('Ray parallel to plane', analytic)
  }

  const t = -(nDotO + pl.d) / nDotD
  analytic.push(`t=\\frac{-(\\mathbf{n}\\cdot O+d)}{\\mathbf{n}\\cdot\\mathbf{D}}=\\frac{-(${fmt(nDotO)})-(${fmt(pl.d)})}{${fmt(nDotD)}}=${fmt(t)}`)

  if (t < 0) {
    analytic.push(`t<0 \\Rightarrow \\text{Plane behind origin}`)
    return noResult('No intersection (behind origin)', analytic)
  }

  const p = add3(ray.o, scale3(ray.d, t))
  analytic.push(`P=O+t\\mathbf{D}=(${fmt(p[0])},${fmt(p[1])},${fmt(p[2])})`)
  return hit([p], '1 intersection point', analytic)
}

// ---- 7. ray × sphere (3D) ----
function intersectRaySphere(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const sp = asSphere(pick(a, b, 'sphere'))
  const w = sub3(ray.o, sp.c)
  const aa = dot3(ray.d, ray.d)
  const bb = 2*dot3(w, ray.d)
  const cc = dot3(w, w) - sp.r*sp.r
  const disc = bb*bb - 4*aa*cc

  const analytic = [
    `\\text{Ray: } O=(${fmt(ray.o[0])},${fmt(ray.o[1])},${fmt(ray.o[2])})`,
    `\\text{Sphere: } C=(${fmt(sp.c[0])},${fmt(sp.c[1])},${fmt(sp.c[2])}),\\ r=${fmt(sp.r)}`,
    `\\mathbf{w}=O-C=(${fmt(w[0])},${fmt(w[1])},${fmt(w[2])})`,
    `a=${fmt(aa)},\\quad b=${fmt(bb)},\\quad c=${fmt(cc)},\\quad \\Delta=${fmt(disc)}`,
  ]

  const ts = solveQuadratic(aa, bb, cc).filter(t => t >= 0)

  if (ts.length === 0) {
    analytic.push(disc < 0 ? `\\Delta<0 \\Rightarrow \\text{No intersection}` : `\\text{All }t<0`)
    return noResult(disc < 0 ? 'No intersection' : 'No intersection (behind origin)', analytic)
  }

  analytic.push(`t=${ts.map(fmt).join(',\\ ')}`)
  const points = ts.map(t => add3(ray.o, scale3(ray.d, t)))
  analytic.push(`P_i=${points.map(p=>`(${fmt(p[0])},${fmt(p[1])},${fmt(p[2])})`).join(',\\ ')}`)
  return hit(points, `${points.length} intersection point${points.length>1?'s':''}`, analytic)
}

// ---- 8. ray × triangle — Möller–Trumbore (3D) ----
function intersectRayTriangle(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const tri = asTriangle(pick(a, b, 'triangle'))
  const e1 = sub3(tri.v1, tri.v0)
  const e2 = sub3(tri.v2, tri.v0)
  const h = cross3(ray.d, e2)
  const aa = dot3(e1, h)

  const analytic = [
    `\\text{Möller–Trumbore algorithm}`,
    `\\mathbf{e}_1=(${fmt(e1[0])},${fmt(e1[1])},${fmt(e1[2])}),\\ \\mathbf{e}_2=(${fmt(e2[0])},${fmt(e2[1])},${fmt(e2[2])})`,
    `\\mathbf{h}=\\mathbf{D}\\times\\mathbf{e}_2=(${fmt(h[0])},${fmt(h[1])},${fmt(h[2])})`,
    `a=\\mathbf{e}_1\\cdot\\mathbf{h}=${fmt(aa)}`,
  ]

  if (Math.abs(aa) < EPS) {
    analytic.push(`a\\approx 0 \\Rightarrow \\text{Ray parallel to triangle}`)
    return noResult('Ray parallel to triangle', analytic)
  }

  const f = 1/aa
  const s = sub3(ray.o, tri.v0)
  const u = f*dot3(s, h)
  analytic.push(`u=f(\\mathbf{s}\\cdot\\mathbf{h})=${fmt(u)}`)

  if (u < 0 || u > 1) {
    analytic.push(`u=${fmt(u)}\\notin[0,1]\\Rightarrow\\text{Miss}`)
    return noResult('No intersection', analytic)
  }

  const q = cross3(s, e1)
  const v = f*dot3(ray.d, q)
  analytic.push(`v=f(\\mathbf{D}\\cdot\\mathbf{q})=${fmt(v)}`)

  if (v < 0 || u+v > 1) {
    analytic.push(`u+v=${fmt(u+v)}\\notin[0,1]\\Rightarrow\\text{Miss}`)
    return noResult('No intersection', analytic)
  }

  const t = f*dot3(e2, q)
  analytic.push(`t=f(\\mathbf{e}_2\\cdot\\mathbf{q})=${fmt(t)}`)

  if (t < EPS) {
    analytic.push(`t<0\\Rightarrow\\text{Triangle behind ray}`)
    return noResult('No intersection (behind origin)', analytic)
  }

  const p = add3(ray.o, scale3(ray.d, t))
  analytic.push(`\\text{Hit } t=${fmt(t)},\\ (u,v)=(${fmt(u)},${fmt(v)})`)
  analytic.push(`P=(${fmt(p[0])},${fmt(p[1])},${fmt(p[2])})`)
  return hit([p], '1 intersection point', analytic)
}

// ---- 9. ray × box AABB — slab method (3D) ----
function intersectRayBox(a: SceneObject, b: SceneObject): IntersectionResult {
  const ray = asRay(pick(a, b, 'ray'))
  const box = asBox(pick(a, b, 'box'))
  let tMin = -Infinity, tMax = Infinity
  const axisLabels = ['x', 'y', 'z'] as const
  const slabLines: string[] = []

  for (let i = 0; i < 3; i++) {
    const di = ray.d[i], oi = ray.o[i]
    const minI = box.min[i], maxI = box.max[i]

    if (Math.abs(di) < EPS) {
      if (oi < minI || oi > maxI) {
        return noResult('No intersection', [
          `\\text{Slab method}`,
          `\\text{Ray } ${axisLabels[i]}-\\text{component }${fmt(oi)}\\notin[${fmt(minI)},${fmt(maxI)}]\\Rightarrow\\text{Miss}`,
        ])
      }
    } else {
      let t1 = (minI-oi)/di, t2 = (maxI-oi)/di
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
      tMin = Math.max(tMin, t1)
      tMax = Math.min(tMax, t2)
      slabLines.push(`${axisLabels[i]}\\text{-slab: }t\\in[${fmt(t1)},${fmt(t2)}]`)
    }
  }

  const analytic = [
    `\\text{Slab method (AABB)}`,
    `\\text{Ray: }O=(${fmt(ray.o[0])},${fmt(ray.o[1])},${fmt(ray.o[2])}),\\ \\mathbf{D}=(${fmt(ray.d[0])},${fmt(ray.d[1])},${fmt(ray.d[2])})`,
    ...slabLines,
    `t_{enter}=${fmt(tMin)},\\quad t_{exit}=${fmt(tMax)}`,
  ]

  if (tMax < tMin || tMax < 0) {
    analytic.push(`t_{exit}<t_{enter}\\text{ or }t_{exit}<0\\Rightarrow\\text{No intersection}`)
    return noResult('No intersection', analytic)
  }

  const points: Vec3[] = []
  if (tMin >= 0) points.push(add3(ray.o, scale3(ray.d, tMin)))
  if (tMax >= 0 && Math.abs(tMax-tMin) > EPS) points.push(add3(ray.o, scale3(ray.d, tMax)))

  if (points.length === 0) {
    analytic.push(`\\text{All }t<0\\Rightarrow\\text{Box behind origin}`)
    return noResult('No intersection (behind origin)', analytic)
  }

  analytic.push(`P_i=${points.map(p=>`(${fmt(p[0])},${fmt(p[1])},${fmt(p[2])})`).join(',\\ ')}`)
  return hit(points, `${points.length} intersection point${points.length>1?'s':''}`, analytic)
}

// ---- 10. plane × plane (3D) ----
function intersectPlanePlane(a: SceneObject, b: SceneObject): IntersectionResult {
  const pa = asPlane(a), pb = asPlane(b)
  const dir = cross3(pa.n, pb.n)
  const dirLen = len3(dir)

  const analytic = [
    `\\text{Plane A: }\\mathbf{n}_A=(${fmt(pa.n[0])},${fmt(pa.n[1])},${fmt(pa.n[2])}),\\ d_A=${fmt(pa.d)}`,
    `\\text{Plane B: }\\mathbf{n}_B=(${fmt(pb.n[0])},${fmt(pb.n[1])},${fmt(pb.n[2])}),\\ d_B=${fmt(pb.d)}`,
    `\\mathbf{D}=\\mathbf{n}_A\\times\\mathbf{n}_B=(${fmt(dir[0])},${fmt(dir[1])},${fmt(dir[2])}),\\ |\\mathbf{D}|=${fmt(dirLen)}`,
  ]

  if (dirLen < EPS) {
    analytic.push(`|\\mathbf{D}|\\approx 0\\Rightarrow\\text{Parallel planes}`)
    return noResult('Parallel planes', analytic)
  }

  const normDir = scale3(dir, 1/dirLen) as Vec3

  // Find a point on the line: fix the coordinate with largest |D| component to 0
  const absD = dir.map(Math.abs) as number[]
  const maxIdx = absD.indexOf(Math.max(...absD))
  let origin: Vec3

  if (maxIdx === 2) {
    // z=0: solve n_A.x*x + n_A.y*y = -d_A, n_B.x*x + n_B.y*y = -d_B
    const det = pa.n[0]*pb.n[1] - pa.n[1]*pb.n[0]
    const x = (-pa.d*pb.n[1] + pb.d*pa.n[1]) / det
    const y = (-pa.n[0]*pb.d + pb.n[0]*pa.d) / det
    origin = [x, y, 0]
  } else if (maxIdx === 1) {
    // y=0: solve n_A.x*x + n_A.z*z = -d_A, n_B.x*x + n_B.z*z = -d_B
    const det = pa.n[0]*pb.n[2] - pa.n[2]*pb.n[0]
    const x = (-pa.d*pb.n[2] + pb.d*pa.n[2]) / det
    const z = (-pa.n[0]*pb.d + pb.n[0]*pa.d) / det
    origin = [x, 0, z]
  } else {
    // x=0: solve n_A.y*y + n_A.z*z = -d_A, n_B.y*y + n_B.z*z = -d_B
    const det = pa.n[1]*pb.n[2] - pa.n[2]*pb.n[1]
    const y = (-pa.d*pb.n[2] + pb.d*pa.n[2]) / det
    const z = (-pa.n[1]*pb.d + pb.n[1]*pa.d) / det
    origin = [0, y, z]
  }

  analytic.push(`P_0=(${fmt(origin[0])},${fmt(origin[1])},${fmt(origin[2])})`)
  analytic.push(`\\text{Line: }P_0+t\\hat{\\mathbf{D}},\\quad \\hat{\\mathbf{D}}=(${fmt(normDir[0])},${fmt(normDir[1])},${fmt(normDir[2])})`)

  return {
    exists: true,
    points: [origin],
    line: { origin, direction: normDir },
    analytic,
    description: 'Line of intersection',
  }
}

// ---- Main dispatch ----
export function computeIntersection(a: SceneObject, b: SceneObject): IntersectionResult {
  const key = [a.type, b.type].sort().join('\xd7')

  switch (key) {
    case 'ray\xd7ray':      return intersectRayRay(a, b)
    case 'line\xd7ray':     return intersectRayLine(a, b)
    case 'circle\xd7ray':   return intersectRayCircle(a, b)
    case 'line\xd7line':    return intersectLineLine(a, b)
    case 'circle\xd7line':  return intersectLineCircle(a, b)
    case 'plane\xd7ray':    return intersectRayPlane(a, b)
    case 'ray\xd7sphere':   return intersectRaySphere(a, b)
    case 'ray\xd7triangle': return intersectRayTriangle(a, b)
    case 'box\xd7ray':      return intersectRayBox(a, b)
    case 'plane\xd7plane':  return intersectPlanePlane(a, b)
    default:
      return noResult(
        `Unsupported: ${a.type} × ${b.type}`,
        [`\\text{Pair }\\texttt{${a.type} \\times ${b.type}}\\text{ not supported}`],
      )
  }
}
