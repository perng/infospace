# Spatial Present — MVP 1 Runtime Prototype

A presentation framework with no slides. A presentation is a guided journey
through a continuous 3D world; content is embedded into the environment as
semantic objects rendered through *spatial skins* — stone engravings,
holograms, constellations, drifting cloud text, museum plaques.

This repository is **MVP 1: the runtime prototype**, proving the mental model
with one handcrafted educational journey:

> **The Living Cell — A Night Tour.** A roofless marble gallery under a
> starry sky walks through the discovery and anatomy of the cell, then dives
> through the lens of a giant brass microscope — a *scale portal* — into the
> interior of a living cell, ten thousand times smaller.

## Run it

```sh
npm install
npm run dev        # local preview
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

The presenter console shows the active world, current beat, speaker notes,
and every outgoing route edge — primary, labelled branches, returns, and
portals — so improvisation never strands you. The left minimap draws the
whole route graph; click any node to jump.

## Architecture

The **project document is the source of truth** (`src/journey/project.ts`).
It is plain data validated by a zod schema; the 3D scene, the presenter
console, the search index, the linear outline view, and the markdown handout
are all derived views of the same model.

```
src/framework/          the reusable engine
  schema.ts             zod schema for the project document (worlds, anchors,
                        beats, route edges, content primitives, skin bindings)
  defineJourney.ts      code-first SDK entry: validate + index
  routeGraph.ts         graph indexes, linearization, search, validation
  store.ts              runtime state machine (beats, transitions, history)
  camera/CameraRig.tsx  pose-to-pose camera planner with portal dives and
                        manual-override orbit controls
  skins/                spatial skins: engraving, hologram chart,
                        constellation scatter, cloud text, museum plaque
src/journey/            the handcrafted presentation (15 anchors, 15 beats,
                        20 route edges, 2 worlds, 2 scale portals)
  project.ts            the project document
  worlds/               procedural scenery: MuseumWorld, CellWorld
src/app/                presenter UI: console, minimap, palette, outline
scripts/journey-cli.ts  mini compiler: validate / export handout
```

### Design principles carried into the code

- **Content stays structured.** A chart rendered as a hologram or a star
  field still carries its series data, units, and fallback text; the outline
  view renders the same primitive as a table.
- **Camera as constraint transitions.** Moves are planned between camera
  poses, never baked frame lists, so the presenter can interrupt at any
  moment and `Esc` always recovers the route.
- **Scale portals are route edges.** The microscope dive is an edge with
  `kind: "portal"`, a dive pose, and an emerge pose; the world swap hides
  behind the fade at the midpoint (the "hybrid" strategy from the design doc).
- **Beautiful degradation.** `O` opens a linear, screen-reader-friendly
  document; `npm run outline` exports the same content as markdown.

## Assets

- Procedural geometry only — no glTF downloads; first interactive paint is fast.
- `public/assets/exhibit-film.webm` — real Paramecium microscopy footage
  (Wikimedia Commons, CC).
- `public/assets/*.png` — AI-generated period artwork (portrait & cork
  engraving), referenced from the project document like any other asset.
- `public/fonts/` — vendored Cinzel & Inter for SDF text meshes.

## What MVP 1 deliberately skips

Authoring editor, live audience sync, collaboration, asset pipeline,
WebXR, video export — see `docs/design.md` for the full roadmap.
