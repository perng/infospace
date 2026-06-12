# Infospace — Spatial Presentation Framework

A presentation framework that replaces slides with a guided journey through a continuous 3D world. An npm workspace: framework packages (the M1 split), one example presentation, and the design documents.

## Layout

- `docs/design.md` — canonical design document. `docs/proposal.md` — plan to a reusable framework (M1 packagize, M2 stations/intents/auto-routing, M3 math primitives, M4 manim/narration asset jobs are done).
- `packages/` — the framework: `@spatial-present/schema` (zod authored + canonical document schemas, stations, camera intents, world templates), `/core` (defineJourney compiler: solver → skin resolver → auto-router → camera planner; registries, route graph, store), `/skins` (spatial skins + AnchorContent + the lazy MathJax→glyph-geometry formula pipeline), `/renderer` (PresentationApp, Stage, camera rig, presenter UI, narrator), `/worlds` (procedural worlds + their templates), `/cli` (journey-cli + generate-narration.py).
- `examples/svd-tour/` — the flagship journey ("Singular Value Decomposition — A Guided Tour"): document, world wiring, assets. Content lives here, never in `packages/`.
- `examples/math-primer/` — the minimal math journey ("Euler's Identity"): formula primitives, chalkboard/etchedGlass, lecture-hall → math-void portal.

## Commands

Root: `npm run lint` (whole workspace); `npm run dev | build | validate | outline` proxy to the example. From `examples/svd-tour/` also: `npm run narration` (scripts JSON), `npm run narration:render` (Kokoro TTS clips), `python3 scripts/generate-assets.py` (SVD media).

A change is not done until `npm run build`, `npm run lint`, and `npm run validate` all pass.

## Key code

- `packages/schema/src/index.ts`, `packages/core/src/defineJourney.ts` — document schemas (authored + canonical) and the compiler entry point. The document is the single source of truth; everything else is a derived view.
- `packages/core/src/{layoutSolver,cameraPlanner,registries}.ts` — station resolution, intent → pose planning, auto-routing, skin capabilities.
- `packages/core/src/{store,routeGraph}.ts`, `packages/renderer/src/CameraRig.tsx` — navigation state, route graph, runtime camera moves as pose-to-pose transitions.
- `packages/skins/src/` — spatial skins; content primitives stay semantic, skins own the 3D look. `formula.ts` is the LaTeX → glyph geometry pipeline (dynamic-import MathJax; never `AllPackages` — its `\require` loader breaks in browsers).
- `packages/renderer/src/PresentationApp.tsx` — the runtime shell; world components are injected via its `worlds` map.
- `examples/svd-tour/src/journey/project.ts` — the hand-authored SVD journey (positionless: stations + intents, zero coordinates).
- `packages/cli/src/journey-cli.ts` — validate / outline / resolve / narration / manim CLI; takes a journey-module path, run from the presentation's root.
- `packages/cli/{render-manim.py,manim_driver.py,generate-narration.py}` — offline asset jobs (hash-cached, provenance manifests under `public/assets/`). Manim runs via `uv run --python 3.13 --with manim`; cuepoints come from a `Scene.play` hook. Narration cue marks (`[mark:step]`) split TTS segments and drive stepwise reveal at the spoken word.
- `examples/*/index.html` — carries a headless-QA shim (worker-driven rAF + polling ResizeObserver while hidden) so agent-driven browser verification works without a visible window.

## Conventions

- Semantic content is the source of truth; visual/spatial/audio forms and accessibility fallbacks are derived from it, never the reverse.
- Authoring surfaces stay positionless (named stations and camera intents, not raw coordinates) so documents remain AI-authorable.
- Framework packages must never import journey content; per-world UI colors come from the document (`ambience.accent`), not CSS keyed to world ids.
- Packages export TypeScript source directly (no per-package build); the example's `tsc -b` type-checks, Vite bundles, `tsx` runs the CLI.
- Match the existing code style: TypeScript strict, zod for runtime validation, zustand for state, React Three Fiber idioms for scene code. Keep comment density low.
