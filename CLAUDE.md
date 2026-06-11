# Infospace — Spatial Presentation Framework

A presentation framework that replaces slides with a guided journey through a continuous 3D world. An npm workspace: framework packages (the M1 split), one example presentation, and the design documents.

## Repository layout

- `docs/design.md` — the canonical design document (vision, concepts, architecture, data model, roadmap).
- `docs/proposal.md` — the plan to a reusable, AI-authorable framework (layered authoring model, stations/camera intents, registries, math/Manim support, M1–M6 milestones). M1 (packagize) and M2 (stations, camera intents, auto-routing — positionless authoring) are done.
- `packages/` — the framework, as workspace packages:
  - `@spatial-present/schema` — zod schemas for the authored (positionless) and canonical (resolved + provenance) documents, plus stations, envelopes, camera intents, and `WorldTemplate`; the contract every tool shares.
  - `@spatial-present/core` — `defineJourney` (the compiler: layout solver → skin resolver → auto-router → camera planner), registries (skin capabilities, built-in camera intents), route graph, runtime store, seeded PRNG.
  - `@spatial-present/skins` — spatial skins plus the `AnchorContent` renderer (content primitives stay semantic; skins own the 3D look).
  - `@spatial-present/renderer` — `PresentationApp` shell, `Stage`, camera rig, presenter console, minimap, palette, outline view, narrator, styles.
  - `@spatial-present/worlds` — procedural world components and their `WorldTemplate`s (named stations, camera intents, portal poses) that journeys compile against.
  - `@spatial-present/cli` — `journey-cli.ts` (validate / outline / resolve / narration-script export; takes a journey-module path) and `generate-narration.py` (offline Kokoro TTS job).
- `examples/svd-tour/` — "Singular Value Decomposition — A Guided Tour": the journey document, world wiring, public assets, and asset-generation scripts. Content lives here, never in `packages/`.

## Commands

From the repo root: `npm run lint` (whole workspace), and `npm run dev | build | validate | outline` (proxied to the example). From `examples/svd-tour/` additionally:

- `npm run narration` — print the narration scripts JSON
- `npm run narration:render` — render narration clips (Kokoro TTS, hash-cached)
- `python3 scripts/generate-assets.py` — regenerate the SVD media assets

A change is not done until `npm run build`, `npm run lint`, and `npm run validate` all pass.

## Conventions

- Design changes go in `docs/design.md`; keep it consistent with `docs/proposal.md` (the proposal is the rationale, the design doc is the spec).
- Core invariant in all designs: semantic content is the source of truth; visual/spatial/audio forms and accessibility fallbacks are derived from it, never the reverse.
- Authoring surfaces must stay positionless (named stations and camera intents, not raw coordinates) so documents remain AI-authorable.
- Framework packages must never import journey content. The host app injects world components through `PresentationApp`'s `worlds` map, and per-world UI colors come from the document (`ambience.accent`), not CSS keyed to world ids.
- Packages export TypeScript source directly (no per-package build step): the example's `tsc -b` type-checks the whole program, Vite bundles it, `tsx` runs the CLI. Revisit only when packages are actually published.
