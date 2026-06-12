# Proposal: From One Presentation to a Reusable, AI-Authorable Framework

**Status:** design proposal · **Audience:** maintainers and contributors · **Companion docs:** [design.md](design.md) (vision), [README.md](../examples/svd-tour/README.md) (what runs today)

This document answers three questions:

1. **What can the framework do today?** (honest inventory of MVP 1)
2. **What input should a finished framework take** — a prompt language, an API, or both?
3. **What has to be built** to get from "one hand-authored presentation" to "describe it and the framework + AI produce it" — including first-class **math** support (LaTeX formulas + **Manim** visualizations).

---

## 1. Where we are today

MVP 1 is a **runtime** plus a **single hand-authored journey** ("Singular Value Decomposition — A Guided Tour"); since M1 landed it lives as the `@spatial-present/*` packages under `packages/` with the journey in `examples/svd-tour/`. The important thing it proved is the *architecture*, not the one presentation:

- **The project document is the single source of truth.** Everything else — the 3D scene, the presenter console, search, the linear outline, the markdown handout — is a derived view of one validated data structure ([`schema`](../packages/schema/src/index.ts), [`defineJourney.ts`](../packages/core/src/defineJourney.ts)).
- **Content is separated from presentation.** A `ContentPrimitive` owns data + semantics; a `SpatialSkin` owns how it looks in 3D. The same chart can be a hologram or an accessible table ([`skins`](../packages/skins/src/), [`OutlineView.tsx`](../packages/renderer/src/OutlineView.tsx)).
- **The route graph is explicit and navigable.** Beats are nodes; edges are `primary | branch | return | portal`. Camera moves are planned as **transitions between poses** so the presenter can interrupt and recover ([`store.ts`](../packages/core/src/store.ts), [`CameraRig.tsx`](../packages/renderer/src/CameraRig.tsx)).
- **Scale portals work** as a special edge that swaps worlds behind a fade.
- **Validation exists**: zod schema + graph integrity/reachability checks, surfaced through a CLI (`npm run validate`, `npm run outline`).

### Current vocabulary (what the schema accepts now)

| Dimension | Today's values |
| --- | --- |
| Content primitives | `text`, `chart` (bar / scatter), `image`, `video` |
| Spatial skins | `engraving`, `hologram`, `constellation`, `cloudText`, `plaque` |
| Worlds | 2 hand-coded procedural scenes (`MuseumWorld`, `CellWorld`) |
| Route edges | `primary`, `branch`, `return`, `portal` |
| Transitions | `cut`, `dolly`, `fly`, `portal` |
| Authoring | code-first only — a human writes `project.ts` and hand-places every 3D coordinate |

### The honest gaps (why it is not yet a framework)

1. **It is fused to one presentation.** Worlds, skins, and the journey live in the same app. There is no package boundary, registry, or plugin seam.
2. **Authoring requires hand-placing 3D coordinates and camera poses.** This is the single biggest blocker to AI authoring — language models are poor at raw `[x, y, z]` and good camera framing. There is no auto-layout or auto-framing.
3. **No content-to-skin negotiation.** Bindings are written by hand. Nothing decides "a scatter plot suits a constellation."
4. **No asset pipeline.** Images/video are dropped in `public/`. There is no place for *generated* assets (AI art, **Manim renders**, optimized glTF).
5. **No AI generator.** The "three creation paths" of the design doc — AI, visual editor, code — exist only as the code path.
6. **No math.** No formula primitive, no LaTeX, no Manim.

---

## 2. Prompt language, or API? — A layered answer

**Recommendation: do not invent a single natural-language DSL that users must learn.** A brittle "presentation prompt grammar" would be hard to write, hard to validate, and hard to diff. Instead, expose **four layers that all target the same canonical document**, so a user can enter at whatever altitude suits them and AI is always constrained by a real schema.

```
 Layer A   Free-form brief            "A 20-min talk on the Fourier transform for
 (human)   (prose + light structure)   undergrads. Use a concert-hall metaphor. Lead
                                        with the heat equation; end on the FFT."
              │  AI generator (LLM + framework knowledge)
              ▼
 Layer B   Authoring Spec             declarative *intent*: sources, world choice,
 (AI ⇄      (YAML / MDX front-matter)  ordered "scenes", content refs, skin hints.
  human)                               High-level, lossy, human-editable. ← the real
                                        "prompt language": you describe WHAT, not WHERE.
              │  compiler: layout solver + skin resolver + camera planner
              ▼
 Layer C   Project Document           the canonical, fully-resolved artifact the
 (contract) project.spatial.json       runtime renders. Validated by zod + graph rules.
                                        EXISTS TODAY (schema.ts).
              ▲  defineJourney() / SDK
              │
 Layer D   Code-first SDK             TypeScript/TSX for power users who want exact
 (human)   defineJourney({...})        control. EXISTS TODAY.
```

Key principles:

- **The canonical document (Layer C) is the contract.** AI, the future visual editor, and hand-code all produce it. If a generated artifact fails `validateGraph`, it is rejected — AI cannot emit something the runtime can't render.
- **The "prompt language" the user actually touches is Layer A (prose) and Layer B (intent spec)** — never raw 3D coordinates. Layer B is declarative and *positionless*: you say "put the heat-equation derivation on the main blackboard," not "place it at `[6, 2, -4]`." The **compiler** resolves slots → coordinates and frames cameras.
- **It is "a set of APIs" AND "a format."** Layer C/D is the API (typed SDK + JSON Schema). Layer B is the format. Layer A is the prompt. They are three interfaces to one artifact, exactly as [design.md](design.md) intends.

### Why Layer B (the intent spec) is the linchpin

AI is reliable at *what goes where in the story* and unreliable at *3D geometry*. So the intent spec lets AI choose from **named, semantic slots** a world template exposes, and lets the framework own the geometry:

```yaml
# talk.spec.yaml  — Layer B, what AI emits and humans tweak
title: The Fourier Transform
world: lecture-hall          # a registered template
audience: undergraduate
theme: chalk-on-slate
sources:
  - content/heat-equation.mdx
  - data/spectrum.csv
scenes:
  - id: intro
    station: hall.lectern         # a NAMED slot, not coordinates
    show: { text: content/intro.mdx, as: engraving }
    camera: wide-establishing      # a NAMED camera intent, not a pose
  - id: heat
    station: hall.blackboard.center
    show: { formula: "\\frac{\\partial u}{\\partial t}=\\alpha\\nabla^2 u", as: chalkboard }
    next: fourier
  - id: fourier
    station: hall.blackboard.center
    show: { manim: scenes/fourier_decompose.py#FourierDecompose, as: projection }
    reveal: stepwise               # beat advances step through the Manim animation
```

The compiler turns `hall.blackboard.center` + content size into a real transform, and `wide-establishing` into a `CameraPose` framed against the content's bounds. That is what makes the whole thing AI-authorable.

---

## 3. What the finished framework takes as input (concretely)

A completed framework accepts input at any layer. Here is the same math talk expressed at three altitudes.

**Layer A — a prompt** (what most users will write):

> Make a 15-minute talk introducing the Fourier transform to first-year students. Use a lecture-hall world with a chalkboard aesthetic. Start from the heat equation, build intuition with rotating phasors, show a square-wave decomposition as an animation, and finish on why the FFT matters. I'll provide the square-wave Manim scene.

**Layer B — the intent spec** (AI's first draft; you edit it): the YAML above.

**Layer C — the canonical document** (compiler output; rarely hand-edited but always inspectable/diffable) — the same shape as today's [`project.ts`](../examples/svd-tour/src/journey/project.ts), extended with the new primitives (§5).

**Layer D — the SDK** (escape hatch for exact control):

```tsx
import { defineJourney, world, station, beat, route } from "@spatial-present/core";
import { LectureHall, Chalkboard, ManimProjection, Formula } from "@spatial-present/templates";

export default defineJourney({
  title: "The Fourier Transform",
  worlds: [world("hall", LectureHall({ theme: "chalk-on-slate" }))],
  anchors: [
    station("hall.blackboard.center", {
      content: <Formula tex="\\frac{\\partial u}{\\partial t}=\\alpha\\nabla^2 u" as="chalkboard" />,
    }),
    station("hall.projector", {
      content: <ManimProjection scene="scenes/fourier_decompose.py#FourierDecompose" reveal="stepwise" />,
    }),
  ],
  beats: [ beat("heat", { anchor: "hall.blackboard.center", camera: "orbit-focus" }) /* … */ ],
  routes: [ route("heat", "fourier", { kind: "primary", transition: "dolly" }) ],
});
```

Note `station(...)` instead of raw `position: [x,y,z]` — the template resolves the slot. This API is the natural evolution of today's `defineJourney`.

---

## 4. What must be built to make it reusable

Ordered roughly by leverage. Items marked **(math)** are also required for §5.

### 4.1 Split into packages (decouple framework from content) — ✅ done
Carve the framework into publishable packages with clean seams (mirrors the repo layout in [design.md](design.md)):
`@spatial-present/schema`, `/core` (defineJourney, route graph, store), `/renderer` (camera rig, Stage, presenter UI), `/skins`, `/worlds`, `/cli`. The SVD tour becomes `examples/svd-tour` consuming the packages.

Shipped as an npm workspace: packages export TypeScript source directly (no per-package build yet — revisit when publishing); the renderer takes a `worlds` component map from the host app instead of importing scenery; per-world UI colors come from the document (`ambience.accent`); the CLI takes a journey-module path.

### 4.2 Registries + plugin API — ✅ done (as static tables)
Three open registries so the vocabulary is extensible without editing the core:
- **World templates** — register a world by id; each exposes **named stations** (slots) and **camera intents**.
- **Skins** — register `skinKind → React component + capability descriptor` (which content kinds it accepts, size hints, whether it supports stepwise reveal).
- **Content primitives** — register `kind → { schema, defaultSkins, fallback renderer }`.

The skin/world registries are what let AI (and humans) pick by name. The capability descriptors are what let the **skin resolver** auto-suggest a skin for a primitive.

Shipped in M2 as data tables in `@spatial-present/core` (`skinCapabilities`, `defaultSkinFor`, `builtinCameraIntents`) plus `WorldTemplate` objects passed to `defineJourney({ templates })`; capability data stays React-free so the CLI compiles documents without a DOM. The *open plugin API* (third-party registration) remains future work.

### 4.3 Layout solver + camera planner (the AI-enablement core) — ✅ done
- **Stations**: world templates publish slots with a transform and a content "envelope" (max size, facing). Authors/AI reference `hall.blackboard.center`; the solver assigns coordinates and avoids collisions.
- **Auto-framing**: given an anchor's bounds + content size, compute a `CameraPose` from a named intent (`wide-establishing`, `orbit-focus`, `read-close`). This removes hand-authored poses — the thing blocking AI today.
- **Auto-routing**: default a `primary` chain from scene order; AI only adds branches/portals.

Shipped in M2: `defineJourney` is now the compiler pipeline (solver → skin resolver → auto-router → camera planner), the canonical document keeps `station`/`cameraIntent` as provenance for re-flow, templates also publish **named poses** for portal dives, and the SVD example compiles from zero coordinates (`journey-cli validate` reports coverage; `resolve` dumps the canonical document).

### 4.4 AI generator service
- A prompt → **Authoring Spec** model call, grounded with the registries (so it can only reference real worlds/skins/stations) and the JSON Schema (structured output).
- **Spec → document compiler** runs the solver/resolver/planner, then `validateGraph`. Invalid output is repaired or rejected, never rendered.
- **Provenance**: store the prompt, model, and settings on generated nodes; support **locking** hand-tuned nodes so regeneration leaves them alone (per design.md's AI constraints).
- **Semantic diff**: show what changed at the document level, not pixels.

### 4.5 Content ingestion
Parsers that turn real source material into primitives: MDX/Markdown → `text`; CSV/JSON → `chart`/`table`; `.tex`/Markdown-math → `formula` **(math)**; images/video → media; **`.py` Manim scene → `manim` clip (math)**.

### 4.6 Asset pipeline **(math-critical)**
A job runner that produces and caches binary assets referenced by the document:
- glTF optimization (Draco/Meshopt/KTX2) for imported worlds.
- AI image/texture generation (already proven manually via the image-gen pipeline).
- **Manim rendering** (see §5.2) — the most important new job for your use case.
Cache by content hash so re-compiles are incremental.

### 4.7 Reduced-coordinate document option
Add an optional `station`/`cameraIntent` form to the schema so Layer C can store *resolved* coordinates **and** the symbolic slot they came from — making documents re-flowable when a world template changes.

---

## 5. Math mode (the special ask)

Two new content primitives, supporting skins, and one asset job. Both keep a **semantic LaTeX source** so they stay accessible, searchable, and exportable to the outline/handout.

### 5.1 The `formula` primitive (LaTeX) — ✅ done (M3)

Add to the `ContentPrimitive` discriminated union in [`schema`](../packages/schema/src/index.ts):

```ts
{
  id: string;
  kind: "formula";
  latex: string;                 // semantic source, e.g. "\\int_{-\\infty}^{\\infty} f(x)e^{-2\\pi i x\\xi}\\,dx"
  display: "block" | "inline";
  numbered?: boolean;
  fallbackText: string;          // spoken-math / description for outline + screen readers
}
```

**Rendering** (shipped default in bold; the proposal originally assumed "KaTeX → SVG," but KaTeX has no SVG backend — see design.md):
- **MathJax tex-svg (font cache off) → `SVGLoader` → flat glyph geometry.** Self-contained glyph paths, real `THREE.Shape` meshes: crisp at any zoom, and each skin owns the glyph material (chalk, etched glow). Dynamically imported, so journeys without formulas never download MathJax.
- KaTeX → `drei <Html>` overlay billboard. Perfect typography + selectable text, but it's a DOM layer (breaks occlusion/scale-portal immersion). Good as a high-contrast fallback / companion view.

**Accessibility:** the outline renders the LaTeX source plus `fallbackText` (spoken math); MathML output from the same MathJax document is a later addition — consistent with the framework's "fallback is derived, never the source" rule.

**Math skins** (new `skinKind`s, registered per §4.2):
- `chalkboard` — ✅ chalk strokes on slate; formulas write themselves on glyph by glyph, plain text renders as chalk handwriting.
- `etchedGlass` — ✅ formula etched into a lit glass slab (reuses the engraving idea).
- `neonManifold` — glowing 3Blue1Brown-style line work on a dark void (future).
A formula is still a formula under any of them.

Shipped with `lecture-hall` and `math-void` world templates and `examples/math-primer` ("Euler's Identity — a short walk": chalk series in the hall, a portal through the center board, the identity in etched glass beside a living unit circle).

### 5.2 Manim integration (build-time render → in-world projection) — ✅ done (M4)

Manim is a **Python, offline renderer** — it cannot run in the browser. So integrate it as an **asset job**, not a runtime dependency. This is clean and cache-friendly.

```ts
{
  id: string;
  kind: "manim";
  scene: string;                 // "scenes/fourier.py#FourierDecompose" (file#ClassName)
  quality?: "l" | "m" | "h" | "k";
  transparent?: boolean;         // alpha channel → composite into the 3D scene
  reveal?: "play" | "loop" | "stepwise";
  fallbackText: string;          // describes the animation for the outline
  // filled by the asset pipeline:
  rendered?: { assetId: string; durationMs: number; cuepoints?: number[] };
}
```

**The `manim-render` job:**
1. Hash `(scene source + Manim version + quality + flags)`.
2. On cache miss, run `manim render` in a sandboxed Python worker; with `transparent` produce an alpha video (e.g. `.webm`/`.mov`) so the animation composites over the world, not a black rectangle.
3. Optionally emit an **image sequence + cuepoints** so beats can scrub it (see stepwise below).
4. Register output as an `AssetRef`; store provenance (scene hash, version) on the node.

**Rendering in-world** via a `projection` skin (a richer `plaque`): the clip plays on a lecture screen, a floating slab, or as a free-standing volumetric panel. With `transparent`, glowing Manim graphics float in a dark "math void" world with no visible frame — the 3Blue1Brown look.

**Stepwise reveal — the powerful bit:** map **beat advancement to Manim animation time**. Manim scenes are sequences of `self.play(...)` steps; if the job emits cuepoints (per `play` boundary), then pressing → at a beat advances the clip to the next cuepoint instead of changing camera. The presenter walks the derivation one transformation at a time, inside the spatial world. This reuses the existing reveal-state concept in `Beat`.

**Manim-flavored world templates / skins to ship:** `math-void` (dark, glowing graphs), `lecture-hall` (board + projector + seats), `number-line-promenade`, `geometry-garden` (proofs as growing constructions). These give AI good defaults for math talks.

### 5.3 Why this division of labor is right
- LaTeX in-browser (KaTeX) → **static formulas**: instant, scalable, accessible, no build step.
- Manim offline → **animated/visual math**: full power of Manim, rendered once, cached, streamed. The framework treats the result as just another timed asset, so presenter controls, fallbacks, and exports all work unchanged.

---

## 6. Worked example (end to end, when complete)

1. User writes the Layer-A prompt from §3 and drops `fourier_decompose.py` in the project.
2. AI emits `talk.spec.yaml` (Layer B), choosing the `lecture-hall` world, `chalkboard`/`projection` skins, an ordered scene list, and `reveal: stepwise` on the Manim scene.
3. Compiler: layout solver assigns board/projector stations → coordinates; camera planner frames each beat; skin resolver confirms `formula → chalkboard` and `manim → projection`; emits `project.spatial.json`; `validateGraph` passes.
4. Asset pipeline renders KaTeX formulas to textures and runs `manim-render` (transparent, with cuepoints), caching both.
5. User opens the runtime: walks the hall, the heat equation is chalked on the board, → steps through the Fourier decomposition animation transform-by-transform, a scale portal dives into a single phasor. `O` shows the linear outline with MathML equations and animation descriptions for accessibility.
6. Everything is committed as inspectable source: `talk.spec.yaml`, `project.spatial.json`, `content/*.mdx`, `scenes/*.py`. AI, the editor, and hand-code can each take it from here.

---

## 7. Roadmap

| Milestone | Delivers | Unblocks |
| --- | --- | --- |
| **M1 — Packagize** ✅ shipped | split schema/core/renderer/skins/worlds/cli into `packages/`; the SVD tour as `examples/svd-tour` | clean seams for everything else |
| **M2 — Registries + layout solver + camera planner** ✅ shipped | stations, named camera intents, auto-routing; positionless example document | **AI authoring becomes possible** (no hand coordinates) |
| **M3 — Math primitives** ✅ shipped | `formula` (MathJax SVG→glyph geometry, spoken fallback) + `chalkboard`/`etchedGlass` skins; `math-void` + `lecture-hall` world templates; `examples/math-primer` | static math talks hand/SDK-authored |
| **M4 — Asset pipeline + Manim** ✅ shipped | `manim-render` job (transparent VP9, auto cuepoints via a `Scene.play` hook), `projection` skin, stepwise reveal (next-press or narration `[mark:step]` cues), `tts-narrate` timestamps | **animated math**; generated-art caching |
| **M5 — AI generator** | prompt → Authoring Spec → document, grounded by registries + schema; provenance + locking + semantic diff | the "describe it and get a presentation" experience |
| **M6 — Visual editor** | direct manipulation over the same document | the approachable third path |

**Most leverage for your goal:** M2 (auto-layout/auto-framing) is the true unlock for AI authoring; M3–M4 deliver the math/Manim capability you specifically need. M5 ties prompts to it. M1 should come first because it makes the rest tractable.
