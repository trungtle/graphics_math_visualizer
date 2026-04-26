# Equation Visualizer — Plans.md

Created: 2026-04-26

---

## Stack Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 19 + TypeScript + Vite | Fast HMR, static output, GitHub Pages compatible |
| 2D rendering | Canvas 2D API + custom renderer | Fine-grained control for graphics engineers |
| 3D rendering | Three.js via React Three Fiber (R3F) | Mature WebGL abstraction, R3F ergonomics |
| Math parsing | math.js | Handles equations, expressions, symbolic ops |
| State | Zustand | Minimal, no boilerplate |
| Styling | Tailwind CSS 4 | Utility-first, no CSS file sprawl |
| Deployment | GitHub Actions → GitHub Pages | Push to main triggers build + deploy to `gh-pages` |

---

## Phase 1: Project Scaffold

| Task | Content | DoD | Depends | Status |
|------|---------|-----|---------|--------|
| 1.1 | Bootstrap Vite + React 19 + TypeScript project via `npm create vite@latest` | `npm run dev` serves app at localhost with no errors | - | cc:TODO |
| 1.2 | Install Three.js, React Three Fiber, @react-three/drei | `import { Canvas } from '@react-three/fiber'` compiles without error | 1.1 | cc:TODO |
| 1.3 | Install math.js, Zustand, Tailwind CSS 4 | All packages resolve; `npm run build` succeeds with 0 errors | 1.1 | cc:TODO |
| 1.4 | Configure TypeScript strict mode + ESLint + Prettier | `npm run lint` exits 0; `tsc --noEmit` exits 0 | 1.1 | cc:TODO |
| 1.5 | Set Vite `base` to repo name (e.g. `/equation-visualizer/`) for GitHub Pages asset paths | `npm run build` produces `dist/` with correct asset URLs; no 404s on Pages | 1.1 | cc:TODO |

---

## Phase 2: Core Layout & UI Shell

| Task | Content | DoD | Depends | Status |
|------|---------|-----|---------|--------|
| 2.1 | Two-panel layout: left sidebar (input panel) + right canvas (viewport) | Layout renders; panels fill viewport correctly | Phase 1 | cc:TODO |
| 2.2 | 2D/3D toggle button wired to global Zustand state `renderMode: '2d' \| '3d'` | Toggle visually switches and persists state; no flash | 2.1 | cc:TODO |
| 2.3 | Input panel: equation text field with math.js parse-on-enter and inline error display | Valid equation parses; invalid input shows error without crash | 2.1 | cc:TODO |
| 2.4 | Input panel: primitive shape selector (point, line, circle, sphere, plane, ray) | Selecting a shape type reveals its parameter fields | 2.1 | cc:TODO |
| 2.5 | Input panel: ray input (origin XYZ, direction XYZ, length) | Ray parameters render as typed number inputs | 2.1 | cc:TODO |

---

## Phase 3: 2D Renderer

| Task | Content | DoD | Depends | Status |
|------|---------|-----|---------|--------|
| 3.1 | Canvas 2D viewport with pan (drag) and zoom (scroll wheel) via transform matrix | Pan and zoom work smoothly at 60 fps | 2.2 | cc:TODO |
| 3.2 | Draw Cartesian grid with adaptive tick density on zoom | Grid labels stay readable at all zoom levels | 3.1 | cc:TODO |
| 3.3 | Plot equation `y = f(x)` as polyline sampled over visible x-range | Curve renders correctly for `sin(x)`, `x^2`, and polynomial inputs | 3.2 | cc:TODO |
| 3.4 | Draw 2D primitives: point, line segment, circle, ray arrow | Each primitive renders at specified coordinates with label | 3.2 | cc:TODO |
| 3.5 | Color-coded layer list in sidebar: toggle visibility per object | Toggling hides/shows object without clearing others | 3.4 | cc:TODO |

---

## Phase 4: 3D Renderer

| Task | Content | DoD | Depends | Status |
|------|---------|-----|---------|--------|
| 4.1 | R3F Canvas with OrbitControls (@react-three/drei) mounted when `renderMode === '3d'` | Camera orbits on mouse drag; dollies on scroll | 2.2 | cc:TODO |
| 4.2 | XYZ axis helper and GridHelper | Axes visible; grid fades at distance | 4.1 | cc:TODO |
| 4.3 | Plot surface `f(x,y) = z` as THREE.BufferGeometry mesh over NxN grid | Surface renders for `sin(x)*cos(y)` with phong shading | 4.2 | cc:TODO |
| 4.4 | Draw 3D primitives: point (sphere mesh), line, plane (transparent quad), sphere wireframe | Each primitive renders at specified position with label sprite | 4.2 | cc:TODO |
| 4.5 | Draw ray as THREE.ArrowHelper with origin, direction, and length params | Arrow renders from origin in correct direction | 4.2 | cc:TODO |
| 4.6 | Color-coded object list synced with 2D layer list (shared Zustand store) | Same objects listed in both modes; visibility toggle works in 3D | 4.5, 3.5 | cc:TODO |

---

## Phase 5: Polish & Deployment

| Task | Content | DoD | Depends | Status |
|------|---------|-----|---------|--------|
| 5.1 | Persist scene to `localStorage` on change; restore on load | Refreshing the page restores all objects exactly | Phase 3, Phase 4 | cc:TODO |
| 5.2 | Export scene as JSON download via browser `Blob` + `<a download>` | Clicking export triggers file save with valid JSON scene | 5.1 | cc:TODO |
| 5.3 | Import scene from JSON via `<input type="file">` | Loading a previously exported file restores scene exactly | 5.2 | cc:TODO |
| 5.4 | Export viewport as PNG via `canvas.toDataURL()` / `gl.domElement.toDataURL()` + `<a download>` | PNG download matches viewport content in both 2D and 3D modes | Phase 3, Phase 4 | cc:TODO |
| 5.5 | Keyboard shortcuts: Enter to add object, Delete to remove selected, Ctrl+S to export JSON | All three shortcuts fire without focus issues | Phase 3, Phase 4 | cc:TODO |
| 5.6 | GitHub Actions workflow: on push to `main`, run `npm ci && npm run build`, deploy `dist/` to `gh-pages` branch | Pushing to main results in live site on `https://<user>.github.io/equation-visualizer/` | 1.5 | cc:TODO |

---

## Design Brief

**Target user**: Graphics engineer — expects precise numerical input, clean coordinate display, and no visual noise.

**Input panel** (left, ~280px):
- Object type dropdown (Equation / Point / Line / Circle / Sphere / Plane / Ray)
- Dynamic parameter fields per type (all numeric, with axis labels)
- Color picker per object
- "Add" button + Enter shortcut

**Viewport** (right, fills remaining space):
- 2D mode: Canvas 2D, white bg, gray grid, colored curves/shapes
- 3D mode: R3F WebGL canvas, dark bg, grid helper, colored meshes, orbit camera
- 2D/3D toggle: top-right pill button

**No decorative UI** — utility panel aesthetic, monospace font for coordinate readouts.

---

## Notes

- Vite `base` must match the GitHub repo name exactly for asset paths to resolve on Pages.
- math.js handles equation parsing (`math.parse`, `math.evaluate`) — no custom parser needed.
- R3F unmounts/remounts cleanly on mode toggle if the Canvas is keyed by `renderMode`.
- Save format: `{ version: 1, objects: [...] }` where each object has `type`, `params`, `color`, `visible`.
- PNG export in 3D: pass `preserveDrawingBuffer: true` to R3F `gl` props to enable `toDataURL()`.
