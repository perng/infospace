# Infospace — Spatial Presentation Framework

A presentation framework that replaces slides with a guided journey through a continuous 3D world. Currently: design documents plus one runtime prototype.

## Repository layout

- `docs/design.md` — the canonical design document (vision, concepts, architecture, data model, roadmap).
- `docs/proposal.md` — the plan for getting from the prototype to a reusable, AI-authorable framework (layered authoring model, stations/camera intents, registries, math/Manim support, M1–M6 milestones).
- `spatial-present/` — MVP 1 prototype ("The Living Cell"): a Vite + React 19 + TypeScript + React Three Fiber app.

Canonical docs live in `docs/` at the repo root. Anything under `spatial-present/docs/` is a stale copy.

## The prototype is disposable

`spatial-present/` proved the architecture (project document as single source of truth, content/skin separation, explicit route graph, scale portals, validation). It is a prototype, not the foundation: when building the real framework, reuse its code only where reuse actually saves effort over rebuilding. Do not contort new designs to preserve prototype code.

## Working on the prototype

All commands run from `spatial-present/`:

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm run validate` — validate the journey document (zod schema + route-graph integrity/reachability)
- `npm run outline` — generate the linear markdown outline

Key code:

- `src/framework/schema.ts`, `src/framework/defineJourney.ts` — the project document schema and authoring entry point; the document is the single source of truth, everything else is a derived view.
- `src/framework/store.ts`, `src/framework/routeGraph.ts`, `src/framework/camera/CameraRig.tsx` — navigation state, route graph, camera planning as pose-to-pose transitions.
- `src/framework/skins/` — spatial skins (content primitives stay semantic; skins own the 3D look).
- `src/journey/project.ts` — the hand-authored "Living Cell" journey.
- `scripts/journey-cli.ts` — the validate/outline CLI.

## Conventions

- Design changes go in `docs/design.md`; keep it consistent with `docs/proposal.md` (the proposal is the rationale, the design doc is the spec).
- Core invariant in all designs: semantic content is the source of truth; visual/spatial/audio forms and accessibility fallbacks are derived from it, never the reverse.
- Authoring surfaces must stay positionless (named stations and camera intents, not raw coordinates) so documents remain AI-authorable.
