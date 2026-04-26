import { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import * as math from 'mathjs'
import { useStore, SceneObject, EquationParams, PointParams, LineParams, SphereParams, PlaneParams, RayParams, BoxParams, TriangleParams } from '../../store/useStore'

function EquationSurface({ obj }: { obj: SceneObject }) {
  const { expression } = obj.params as EquationParams
  const geometry = useMemo(() => {
    const N = 60
    const range = 5
    const geo = new THREE.BufferGeometry()
    const positions: number[] = []
    const indices: number[] = []

    let compiled: math.EvalFunction
    try { compiled = math.compile(expression) } catch { return geo }

    for (let ix = 0; ix <= N; ix++) {
      for (let iy = 0; iy <= N; iy++) {
        const x = -range + (2 * range * ix) / N
        const y = -range + (2 * range * iy) / N
        let z = 0
        try { z = compiled.evaluate({ x, y }) } catch { }
        if (!isFinite(z)) z = 0
        positions.push(x, z, y)
      }
    }
    for (let ix = 0; ix < N; ix++) {
      for (let iy = 0; iy < N; iy++) {
        const a = ix * (N + 1) + iy
        const b = a + 1
        const c = a + (N + 1)
        const d = c + 1
        indices.push(a, b, c, b, d, c)
      }
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return geo
  }, [expression])

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial color={obj.color} side={THREE.DoubleSide} wireframe={false} transparent opacity={0.85} />
    </mesh>
  )
}

function Point3D({ obj }: { obj: SceneObject }) {
  const { x, y, z } = obj.params as PointParams
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshBasicMaterial color={obj.color} />
    </mesh>
  )
}

function Line3D({ obj }: { obj: SceneObject }) {
  const { x1, y1, z1, x2, y2, z2 } = obj.params as LineParams
  const lineObj = useMemo(() => {
    const points = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)]
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: obj.color }))
  }, [x1, y1, z1, x2, y2, z2, obj.color]) // eslint-disable-line react-hooks/exhaustive-deps
  return <primitive object={lineObj} />
}

function Sphere3D({ obj }: { obj: SceneObject }) {
  const { cx, cy, cz, r } = obj.params as SphereParams
  return (
    <mesh position={[cx, cy, cz]}>
      <sphereGeometry args={[r, 24, 24]} />
      <meshPhongMaterial color={obj.color} wireframe transparent opacity={0.6} />
    </mesh>
  )
}

function Plane3D({ obj }: { obj: SceneObject }) {
  const { nx, ny, nz, d } = obj.params as PlaneParams
  const normal = new THREE.Vector3(nx, ny, nz).normalize()
  const position = normal.clone().multiplyScalar(d)
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize())
    return q
  }, [nx, ny, nz]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <mesh position={position} quaternion={quaternion}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial color={obj.color} side={THREE.DoubleSide} transparent opacity={0.3} />
    </mesh>
  )
}

function Ray3D({ obj }: { obj: SceneObject }) {
  const { ox, oy, oz, dx, dy, dz, length } = obj.params as RayParams
  const arrow = useMemo(() => {
    const dir = new THREE.Vector3(dx, dy, dz).normalize()
    const origin = new THREE.Vector3(ox, oy, oz)
    return new THREE.ArrowHelper(dir, origin, length, obj.color, length * 0.15, length * 0.08)
  }, [ox, oy, oz, dx, dy, dz, length, obj.color]) // eslint-disable-line react-hooks/exhaustive-deps
  return <primitive object={arrow} />
}

function Box3D({ obj }: { obj: SceneObject }) {
  const { minX, minY, minZ, maxX, maxY, maxZ } = obj.params as BoxParams
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const cz = (minZ + maxZ) / 2
  const sx = Math.abs(maxX - minX) || 0.01
  const sy = Math.abs(maxY - minY) || 0.01
  const sz = Math.abs(maxZ - minZ) || 0.01

  const lineSegments = useMemo(() => {
    const box = new THREE.BoxGeometry(sx, sy, sz)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    const mat = new THREE.LineBasicMaterial({ color: obj.color })
    const ls = new THREE.LineSegments(edges, mat)
    ls.position.set(cx, cy, cz)
    return ls
  }, [cx, cy, cz, sx, sy, sz, obj.color]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      lineSegments.geometry.dispose()
      ;(lineSegments.material as THREE.Material).dispose()
    }
  }, [lineSegments])

  return <primitive object={lineSegments} />
}

function Triangle3D({ obj }: { obj: SceneObject }) {
  const { x1, y1, z1, x2, y2, z2, x3, y3, z3 } = obj.params as TriangleParams

  const mesh = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([x1, y1, z1, x2, y2, z2, x3, y3, z3]), 3
    ))
    geo.computeVertexNormals()
    const mat = new THREE.MeshPhongMaterial({
      color: obj.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    })
    return new THREE.Mesh(geo, mat)
  }, [x1, y1, z1, x2, y2, z2, x3, y3, z3, obj.color]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
  }, [mesh])

  return <primitive object={mesh} />
}

function SceneObject3D({ obj }: { obj: SceneObject }) {
  if (!obj.visible) return null
  switch (obj.type) {
    case 'equation': return <EquationSurface obj={obj} />
    case 'point': return <Point3D obj={obj} />
    case 'line': return <Line3D obj={obj} />
    case 'sphere': return <Sphere3D obj={obj} />
    case 'plane': return <Plane3D obj={obj} />
    case 'ray': return <Ray3D obj={obj} />
    case 'box': return <Box3D obj={obj} />
    case 'triangle': return <Triangle3D obj={obj} />
    default: return null
  }
}

export function Viewport3D() {
  const objects = useStore((s) => s.objects)

  return (
    <Canvas
      key="3d"
      className="w-full h-full"
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ preserveDrawingBuffer: true }}
      style={{ background: '#0a0a0a' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={5}
        sectionThickness={1}
        fadeDistance={50}
        cellColor="#2a2a2a"
        sectionColor="#444"
      />

      <axesHelper args={[3]} />

      {objects.map((obj) => (
        <SceneObject3D key={obj.id} obj={obj} />
      ))}

      <OrbitControls makeDefault />
    </Canvas>
  )
}
