import { create } from 'zustand'
import type { IntersectionResult } from '../intersection'

export interface IntersectionState {
  idA: string | null
  idB: string | null
  result: IntersectionResult | null
}

export type RenderMode = '2d' | '3d'

export type ObjectType = 'equation' | 'point' | 'line' | 'circle' | 'sphere' | 'plane' | 'ray' | 'box' | 'triangle'

export interface EquationParams {
  expression: string
}

export interface PointParams {
  x: number
  y: number
  z: number
}

export interface LineParams {
  x1: number
  y1: number
  z1: number
  x2: number
  y2: number
  z2: number
}

export interface CircleParams {
  cx: number
  cy: number
  r: number
}

export interface SphereParams {
  cx: number
  cy: number
  cz: number
  r: number
}

export interface PlaneParams {
  nx: number
  ny: number
  nz: number
  d: number
}

export interface RayParams {
  ox: number
  oy: number
  oz: number
  dx: number
  dy: number
  dz: number
  length: number
}

export interface BoxParams {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

export interface TriangleParams {
  x1: number
  y1: number
  z1: number
  x2: number
  y2: number
  z2: number
  x3: number
  y3: number
  z3: number
}

export type ObjectParams =
  | EquationParams
  | PointParams
  | LineParams
  | CircleParams
  | SphereParams
  | PlaneParams
  | RayParams
  | BoxParams
  | TriangleParams

export interface SceneObject {
  id: string
  type: ObjectType
  params: ObjectParams
  color: string
  visible: boolean
  label: string
}

interface StoreState {
  renderMode: RenderMode
  objects: SceneObject[]
  selectedId: string | null
  intersection: IntersectionState
  setRenderMode: (mode: RenderMode) => void
  addObject: (obj: SceneObject) => void
  removeObject: (id: string) => void
  toggleVisible: (id: string) => void
  selectObject: (id: string | null) => void
  setObjects: (objects: SceneObject[]) => void
  setIntersectionPair: (idA: string | null, idB: string | null) => void
  setIntersectionResult: (result: IntersectionResult | null) => void
  clearIntersection: () => void
}

export const useStore = create<StoreState>((set) => ({
  renderMode: '2d',
  objects: [],
  selectedId: null,
  intersection: { idA: null, idB: null, result: null },
  setRenderMode: (mode) => set({ renderMode: mode }),
  addObject: (obj) => set((s) => ({ objects: [...s.objects, obj] })),
  removeObject: (id) => set((s) => ({ objects: s.objects.filter((o) => o.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })),
  toggleVisible: (id) => set((s) => ({ objects: s.objects.map((o) => o.id === id ? { ...o, visible: !o.visible } : o) })),
  selectObject: (id) => set({ selectedId: id }),
  setObjects: (objects) => set({ objects }),
  setIntersectionPair: (idA, idB) => set((s) => ({ intersection: { ...s.intersection, idA, idB, result: null } })),
  setIntersectionResult: (result) => set((s) => ({ intersection: { ...s.intersection, result } })),
  clearIntersection: () => set({ intersection: { idA: null, idB: null, result: null } }),
}))
