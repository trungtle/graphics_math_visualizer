import { create } from 'zustand'

export type RenderMode = '2d' | '3d'

export type ObjectType = 'equation' | 'point' | 'line' | 'circle' | 'sphere' | 'plane' | 'ray'

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

export type ObjectParams =
  | EquationParams
  | PointParams
  | LineParams
  | CircleParams
  | SphereParams
  | PlaneParams
  | RayParams

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
  setRenderMode: (mode: RenderMode) => void
  addObject: (obj: SceneObject) => void
  removeObject: (id: string) => void
  toggleVisible: (id: string) => void
  selectObject: (id: string | null) => void
  setObjects: (objects: SceneObject[]) => void
}

export const useStore = create<StoreState>((set) => ({
  renderMode: '2d',
  objects: [],
  selectedId: null,
  setRenderMode: (mode) => set({ renderMode: mode }),
  addObject: (obj) => set((s) => ({ objects: [...s.objects, obj] })),
  removeObject: (id) => set((s) => ({ objects: s.objects.filter((o) => o.id !== id), selectedId: s.selectedId === id ? null : s.selectedId })),
  toggleVisible: (id) => set((s) => ({ objects: s.objects.map((o) => o.id === id ? { ...o, visible: !o.visible } : o) })),
  selectObject: (id) => set({ selectedId: id }),
  setObjects: (objects) => set({ objects }),
}))
