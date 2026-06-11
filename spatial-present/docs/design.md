# Spatial Presentation Framework — Design

## Summary

A presentation framework that removes the slide as the core unit of thought.
A presentation is a guided journey through a continuous 3D world; the
presenter controls a camera that can follow a rehearsed route, branch,
improvise, orbit objects, and zoom through scale portals. Text, charts,
images, and video are embedded in the environment as semantic content
rendered through spatial forms.

## Product principles

1. **Spatial first, not slide first** — the base artifact is a navigable
   world; linear exports are derived views.
2. **Presenter agency** — scripted cinematic beats and live exploration both
   work; departing from the route never breaks the experience.
3. **Content remains structured** — a chart painted as a hologram is still a
   chart; visual treatment never destroys semantics or accessibility.
4. **Worlds are templates** — reusable environments and skins, not one-off
   art projects.
5. **Beautiful degradation** — outline view, handouts, reduced motion.
6. **Scale is a storytelling tool** — macro → human → object → micro in one
   narrative, via first-class scale portals.
7. **AI-native but not AI-only** — AI emits the same inspectable project
   files humans hand-edit.
8. **Hand-code remains a power path** — TypeScript SDK, schema, CLI.

## Core concepts

| Concept | Meaning |
| --- | --- |
| **World** | Continuous 3D environment: scenery, lighting, ambience, scale. |
| **Anchor** | Semantic point of interest that receives content and camera focus. |
| **Beat** | A presentable moment: camera pose, focus, reveal state, notes. A node in a graph, not a page in a list. |
| **RouteGraph** | Edges between beats: primary path, branches, returns, jumps, portals. |
| **ContentPrimitive** | Structured information before it becomes visual: text, chart, table, image, video, … |
| **SpatialSkin** | Transforms a primitive into an environmental form (engraving, hologram, constellation, cloud text, plaque, …). The skin owns style and reveal animation; the primitive owns data and semantics. |
| **ScalePortal** | A route edge connecting two coordinate spaces of different scales, hidden behind a cinematic transition. |

## MVP 1 — runtime prototype (THIS REPO)

Status: **implemented**, in `spatial-present/`.

| Requirement | Status |
| --- | --- |
| One handcrafted educational world | ✅ "The Living Cell" — museum + cell interior |
| 10–20 anchors | ✅ 15 anchors |
| Nonlinear route graph | ✅ 20 edges: primary, branch, return, portal |
| Presenter camera: scripted + manual orbit/focus | ✅ pose-to-pose planner + OrbitControls override + return-to-route |
| Text, chart, image, video primitives | ✅ all four, schema-validated |
| ≥3 spatial skins (engraving, hologram, constellation/cloud) | ✅ five: engraving, hologram, constellation, cloudText, plaque |
| One scale portal | ✅ two: microscope dive and return ring |
| Linear fallback outline | ✅ in-app outline view + `npm run outline` markdown handout |
| Static publishable bundle | ✅ `npm run build` |

Implementation decisions:

- **Hybrid scale transition** (as recommended): both worlds live in one scene
  at distant coordinate neighbourhoods; the portal edge carries a dive pose
  and an emerge pose, and the camera teleports behind a radial fade at the
  transition midpoint.
- **Camera moves are constraint transitions, not keyframes**: the rig captures
  the live camera as the origin pose whenever a transition starts, so beats
  can be interrupted, re-entered from manual orbit, or chained mid-flight.
- **Procedural scenery only** in MVP 1 — keeps the bundle tiny and removes
  the asset pipeline from the critical path. glTF import is a later MVP.
- **The project document is plain data** (`src/journey/project.ts`),
  validated by zod (`src/framework/schema.ts`) and by graph rules
  (referential integrity, reachability). `defineJourney()` is the code-first
  SDK entry; an AI generator or visual editor would emit the same document.

## Roadmap (later MVPs)

- **MVP 2 — authoring prototype**: place anchors, edit beats, connect route
  graph, bind markdown/chart data, publish static bundle.
- **MVP 3 — live presentation**: presenter console as separate surface,
  audience follow mode, WebSocket sync, session recording, branch votes.
- **MVP 4 — template system**: museum/garden/palace/micro world templates,
  skin parameter controls, asset optimization pipeline (glTF, Draco/Meshopt,
  KTX2).
- Long-term: WebXR mode, AI world generation, live data bindings,
  marketplace, spatial analytics.

## Risks tracked

- **Presenter disorientation** → console always shows current beat, next
  edges, route minimap, and a one-key return to route.
- **Legibility** → skins keep readable type sizes and the outline is one key
  away; screen-space legibility rules are future work.
- **Performance** → procedural geometry, additive materials with
  `depthWrite: false`, capped light counts; LOD/streaming arrive with real
  assets.
- **Accessibility** → every primitive carries fallback text; outline and
  handout derive from the same semantic model as the 3D scene.
