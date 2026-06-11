# Infospace — Spatial Presentation Framework

A presentation framework that replaces slides with a guided journey through a continuous 3D world. Currently: design documents plus one runtime prototype.

## Layout

- `docs/design.md` — canonical design document. `docs/proposal.md` — plan from prototype to reusable framework. Canonical docs live in `docs/` at the repo root; anything under `spatial-present/docs/` is a stale copy.
- `spatial-present/` — MVP 1 prototype ("The Living Cell"): Vite + React 19 + TypeScript + React Three Fiber.

## Commands (run from `spatial-present/`)

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + production build
- `npm run lint` — ESLint
- `npm run validate` — validate the journey document (zod schema + route-graph integrity/reachability)
- `npm run outline` — generate the linear markdown outline

A change is not done until `npm run build`, `npm run lint`, and `npm run validate` all pass.

## Key code

- `spatial-present/src/framework/schema.ts`, `defineJourney.ts` — project document schema and authoring entry point. The document is the single source of truth; everything else is a derived view.
- `spatial-present/src/framework/store.ts`, `routeGraph.ts`, `camera/CameraRig.tsx` — navigation state, route graph, camera planning as pose-to-pose transitions.
- `spatial-present/src/framework/skins/` — spatial skins; content primitives stay semantic, skins own the 3D look.
- `spatial-present/src/journey/project.ts` — the hand-authored "Living Cell" journey.
- `scripts/journey-cli.ts` — the validate/outline CLI.

## Conventions

- Semantic content is the source of truth; visual/spatial/audio forms and accessibility fallbacks are derived from it, never the reverse.
- Authoring surfaces stay positionless (named stations and camera intents, not raw coordinates) so documents remain AI-authorable.
- The prototype is disposable: do not contort new designs to preserve prototype code.
- Match the existing code style: TypeScript strict, zod for runtime validation, zustand for state, React Three Fiber idioms for scene code. Keep comment density low.
