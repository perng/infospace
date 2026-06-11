# Spatial Present

A presentation framework that replaces slides with a guided journey through a
continuous 3D world. The presenter flies a camera through a navigable route
graph; content (text, charts, images, video, narration) is semantic data
rendered through spatial skins — engravings, holograms, constellations —
with a linear outline derived from the same document for accessibility.

An npm workspace:

- [`packages/`](packages) — the framework: `@spatial-present/schema`
  (project-document contract), `core` (defineJourney SDK, route graph,
  store), `skins`, `renderer` (PresentationApp runtime shell), `worlds`,
  and `cli` (validate / outline / narration tooling).
- [`examples/svd-tour/`](examples/svd-tour) — "Singular Value Decomposition —
  A Guided Tour": the example journey consuming the packages.
- [`docs/design.md`](docs/design.md) — the canonical design document;
  [`docs/proposal.md`](docs/proposal.md) — the roadmap (M1 ✅ … M6).

## Quick start

```sh
npm install
npm run dev      # the example tour, via Vite
```

Then press `→` to walk the route, `V` for the narrated tour, `O` for the
accessible outline. See the [example README](examples/svd-tour/README.md)
for the full presenter controls and asset pipeline.
