# Equation Visualizer — CLAUDE.md

## Project Overview

A web-based tool for visualizing mathematical equations interactively.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **2D rendering**: Canvas 2D API (custom renderer)
- **3D rendering**: Three.js + React Three Fiber + @react-three/drei
- **Math parsing**: math.js
- **State**: Zustand
- **Styling**: Tailwind CSS 4
- **Deployment**: GitHub Pages via GitHub Actions (`gh-pages` branch)

## Key Conventions

- Use TypeScript for all source files
- No comments unless the WHY is non-obvious
- Prefer editing existing files over creating new ones
- No premature abstractions — implement what is needed now

## File Structure

```
equation_visualizer/
├── CLAUDE.md
├── Plans.md
├── src/
│   └── ...
├── public/
│   └── ...
└── package.json
```

## Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test
```

## Harness

This project uses [claude-code-harness](https://github.com/Chachamaru127/claude-code-harness).
Plans are tracked in `Plans.md`. Use `/harness-plan`, `/harness-work`, and `/harness-setup` as needed.
