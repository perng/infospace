# SVD Tour — Example Presentation

The example journey for the Spatial Present framework — a presentation with
no slides: a guided journey through a continuous 3D world, with content
embedded as semantic objects rendered through *spatial skins* — stone
engravings, holograms, constellations, drifting cloud text, framed plaques.

> **Singular Value Decomposition — A Guided Tour.** A roofless marble gallery
> under a field of stars walks through the geometry of `A = U S Vᵀ` — a matrix
> as rotate, stretch, rotate — then dives through a light-splitting prism — a
> *scale portal* — into the decomposition itself, where the image of the unit
> sphere is an ellipsoid and the matrix comes apart into its rank-one layers.

Everything journey-specific lives in this directory: the project document,
the world wiring, and the assets. The framework itself is the
`@spatial-present/*` workspace packages under [`packages/`](../../packages).

## Run it

```sh
npm install        # once, from the repo root (npm workspace)
npm run dev        # local preview (from this directory)
npm run build      # static web bundle (dist/)
npm run validate   # compiler: schema + route-graph validation
npm run outline    # compiler: derived linear handout (outline.md)
```

## Presenting

| Input | Action |
| --- | --- |
| `→` / `Space` | Advance along the primary route |
| `←` | Go back through history |
| Mouse drag / wheel | Manual orbit & zoom around the current focus (manual override) |
| `Esc` | Return to the rehearsed route |
| `K` / `/` / `⌘K` | Command palette — search any beat, anchor, or content and jump |
| `O` | Linear outline view (the accessibility fallback) |
| `N` | Toggle speaker notes |
| `V` | Narrated tour — per-beat voice clips with captions and auto-advance |

The presenter console shows the active world, current beat, speaker notes,
and every outgoing route edge — primary, labelled branches, returns, and
portals — so improvisation never strands you. The left minimap draws the
whole route graph; click any node to jump.

### Narrated tour

`V` turns the presentation into a self-running narrated tour: each beat's
clip plays once the camera settles, the script doubles as the caption, and
when a clip ends the tour advances along the primary route — through scale
portals included — until a beat opts out (`autoAdvance: false` ends the
tour). The presenter always wins: navigating stops the clip, and a grabbed
camera or open palette suppresses auto-advance.

The per-beat `narration.script` in the project document is the semantic
source; audio is a derived asset rendered offline by
`npm run narration:render` (Kokoro TTS, local), cached by script hash with
provenance in `public/assets/narration/manifest.json`. `npm run validate`
warns when a clip is missing or stale.

## Architecture

The **project document is the source of truth** (`src/journey/project.ts`).
It is plain data validated by a zod schema; the 3D scene, the presenter
console, the search index, the linear outline view, and the markdown handout
are all derived views of the same model.

```
this example
  src/journey/project.ts   the project document (15 anchors, 15 beats,
                           20 route edges, 2 worlds, 2 scale portals,
                           15 narration scripts)
  src/main.tsx             composition: PresentationApp + the worlds map
                           ({ atrium: AtriumWorld, spectral: SpectralWorld })
  public/                  generated media, narration clips, fonts
  scripts/generate-assets.py   regenerates the SVD media (diagram, montage, film)

the framework (../../packages)
  @spatial-present/schema    zod schema for the project document
  @spatial-present/core      defineJourney (validate + index), route graph,
                             runtime store, seeded PRNG
  @spatial-present/skins     engraving, hologram chart, constellation scatter,
                             cloud text, framed plaque + AnchorContent
  @spatial-present/renderer  PresentationApp shell, Stage (worlds injected),
                             camera rig, console, minimap, palette, outline,
                             narrator (clips, captions, auto-advance)
  @spatial-present/worlds    AtriumWorld, SpectralWorld + landmark constants
  @spatial-present/cli       journey-cli (validate / outline / narration) +
                             generate-narration.py (Kokoro TTS, hash-cached)
```

### Design principles carried into the code

- **Content stays structured.** A chart rendered as a hologram or a star
  field still carries its series data, units, and fallback text; the outline
  view renders the same primitive as a table.
- **Camera as constraint transitions.** Moves are planned between camera
  poses, never baked frame lists, so the presenter can interrupt at any
  moment and `Esc` always recovers the route.
- **Scale portals are route edges.** The prism dive is an edge with
  `kind: "portal"`, a dive pose, and an emerge pose; the world swap hides
  behind the fade at the midpoint (the "hybrid" strategy from the design doc).
- **Beautiful degradation.** `O` opens a linear, screen-reader-friendly
  document; `npm run outline` exports the same content as markdown.

## Assets

- Procedural geometry only — no glTF downloads; first interactive paint is fast.
- `public/assets/*.png` and `svd-reconstruct.webm` — generated from real
  linear algebra (not stock art) by `scripts/generate-assets.py`: the unit
  circle → ellipse diagram, the truncated-SVD compression montage, and the
  rank-by-rank reconstruction film. Each is referenced from the project
  document like any other asset; re-run the script to regenerate them.
- `public/assets/narration/*.mp3` — narration clips derived from the scripts
  in the project document by `npm run narration:render` (local Kokoro TTS;
  swap the engine by re-rendering, the document doesn't change).
- `public/fonts/` — vendored Cinzel & Inter for SDF text meshes. They carry
  no Greek/subscript glyphs, so in-world strings stay ASCII (`A = U S Vᵀ`)
  while the precise typeset notation lives in the generated diagram.

## What this stage deliberately skips

Stations and camera intents (M2 — authoring still uses raw coordinates),
authoring editor, live audience sync, collaboration, generalized asset
pipeline, WebXR, video export — see [`docs/design.md`](../../docs/design.md)
for the full roadmap.
