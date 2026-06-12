# Presentation Creation Guide — for AI assistants

You are helping a human create or edit an Infospace presentation. This guide is
self-contained: everything you need — the format, the complete vocabulary of
names, the compiler's rules, and the commands — is here. You should not need to
scan the framework source (`packages/`). The human-facing tutorial is
`manual/index.html`; the canonical design document is `docs/design.md`.

## The mental model

An Infospace presentation is a **journey through continuous 3D worlds**, not
slides. A talk is a sequence of **scenes**; each scene is a piece of semantic
content (text, formula, chart) placed at a named **station** in a **world**,
framed by a named **camera intent**, rendered by a **skin**, optionally
narrated. Scenes play in list order; **portals** carry the tour between worlds;
**branches** are optional presenter shortcuts.

Two invariants govern everything you write:

1. **Positionless authoring.** Never emit coordinates, camera poses, sizes, or
   colors. You reference stations, intents, skins, and poses *by name*, from
   the vocabulary below. The layout solver and camera planner own geometry.
2. **Semantic content is the source of truth.** Every formula carries its
   spoken reading, every chart a one-sentence summary; narration is text first,
   audio second. Visual/spatial/audio forms are derived, never the reverse.

## The authoring surface: `talk.spec.yaml`

Author at the **Authoring Spec** layer (Layer B) — a YAML file in the
presentation's root directory. It compiles to `src/journey/document.json`,
which the app loads. **After every spec edit, run `npm run spec:compile`** (the
app does not read the YAML directly).

### Top-level shape

```yaml
id: my-talk                  # kebab-case: ^[a-z0-9][a-z0-9-]*$
title: My Talk
worlds:                      # world template ids, in narrative order
  - lecture-hall
  - math-void
scenes: [...]                # at least 1; see below
portals: [...]               # required at every consecutive world change
branches: [...]              # optional presenter shortcuts
```

World display names, scale, and ambience come from each template's defaults —
never write them.

### Scene fields

```yaml
- id: definition           # kebab-case, unique within the talk     REQUIRED
  title: Defining Phi      # outline / palette / console label      REQUIRED
  world: lecture-hall      # an id listed in worlds:                REQUIRED
  station: board.center    # a station of that world; ONE scene
                           # per station, talk-wide                 REQUIRED
  content: {...}           # see Content kinds                      REQUIRED
  skin: chalkboard         # optional; omit for the kind's default
  camera: read-close       # optional; intent or world pose name (default read-close)
  role: detail             # optional: chapter|detail|chart|quote|media|portal
  place: The Center Board  # optional display name (defaults to title)
  narrate: >               # optional but expected on every scene: 2-4 spoken
    Two to four sentences. # sentences, plain ASCII, numbers/symbols as words
  notes: Presenter bullet. # optional presenter notes
  arrive: fly              # optional: cut|dolly|fly (default fly)
  locked: true             # optional: survives --regen byte-for-byte
```

### Content kinds

Only kinds that need no external assets are allowed in the spec (so a generated
talk always renders). Media/animations enter at the document layer (see below).

```yaml
content:                       # ---- text ----
  kind: text
  title: Optional Heading
  body: |
    Two or three short paragraphs. PLAIN ASCII ONLY — the 3D fonts have no
    Greek or subscripts. Write "pi", "n squared", "1/n^2" here; real
    notation belongs in a formula scene.

content:                       # ---- formula ----
  kind: formula
  latex: \sum_{n=1}^{\infty} \frac{1}{n^{2}} = \frac{\pi^{2}}{6}
  spoken: the sum from n equals one to infinity of one over n squared
    equals pi squared over six

content:                       # ---- chart (bar) ----
  kind: chart
  data:
    type: bar
    title: Partial sums of 1/n^2
    unit: value                # optional; logScale: true also available
    series:
      - { label: N=1,  value: 1 }
      - { label: N=10, value: 1.54977 }
  summary: One sentence reading the chart aloud.

content:                       # ---- chart (scatter) ----
  kind: chart
  data:
    type: scatter
    title: Title
    xLabel: x axis
    yLabel: y axis
    points:
      - { x: 1, y: 2, label: point name }
  summary: One sentence reading the chart aloud.
```

LaTeX in YAML: prefer plain (unquoted) scalars — backslashes pass through
(`latex: \frac{\pi^{2}}{6}`). In double-quoted strings every backslash must be
doubled. Keep LaTeX presentation-sized (one line or a small aligned block);
base + amsmath only, no exotic packages.

### Portals and branches

```yaml
portals:                     # REQUIRED between consecutive scenes in different worlds
  - from: leaving-the-hall   # scene id (source world)
    to: self-similar         # scene id (target world)
    label: Step through the board
    dive: board-dive         # pose name published by the SOURCE world
    emerge: void-emerge      # pose name published by the TARGET world

branches:
  - { from: opening, to: fibonacci, label: Skip ahead, kind: branch }
    # kind: branch (skip ahead) | return (go back)
```

## The vocabulary (complete — never invent names)

### Worlds and stations

Sizes are envelope width × height in world units — how much content fits.
One scene per station, across the whole talk.

**`lecture-hall`** — "The Evening Lecture Hall" (warm, intimate; setup and
board work):

| Station | Size | Suits |
|---|---|---|
| `board.left` | 3.8 × 2.8 | chalk text / formula |
| `board.center` | 3.8 × 2.8 | chalk text / formula; the portal dives through it |
| `board.right` | 3.8 × 2.8 | chalk text / formula / small chart |
| `wall.west` | 4 × 3 | a turn-away moment, portal send-off |

Poses: `board-dive` (exit), `board-emerge` (entry).

**`math-void`** — "The Math Void" (dark, weightless; the payoff world):

| Station | Size | Suits |
|---|---|---|
| `plinth.identity` | 5.5 × 3 | the hero formula |
| `gallery.west` | 6 × 3.2 | supporting formula |
| `circle.overlook` | 8 × 3.5 | wide closing thoughts |
| `screen.theatre` | 7 × 4.4 | projection / big reveal |
| `gate.return` | 6.5 × 3 | natural final stop |

Poses: `void-emerge` (entry: plunge from above), `gate-dive` (exit).

**`atrium`** — "The Atrium of Linear Maps" (marble gallery around a prism):

| Station | Size | Suits |
|---|---|---|
| `entry.tablet` | 5 × 3.4 | opening |
| `west-wall.bay-1` | 5.4 × 3.6 | wall content |
| `west-wall.bay-2` | 5 × 2.2 | wall content (short) |
| `east-wall.bay-1` | 4.5 × 2.6 | wall content |
| `east-wall.bay-2` | 5 × 3 | wall content |
| `east-wall.bay-3` | 4 × 2.4 | wall content (small) |
| `floor.hologram` | 4.4 × 3.2 | hologram chart |
| `air.quote` | 9 × 3.5 | floating quote (`cloudText` + `quote-gaze`) |
| `sky.dome` | 20 × 10 | vast overhead content (`sky-gaze`) |
| `prism.plinth` | 3.6 × 2.6 | beside the portal |

Poses: `prism-approach` (a framing), `prism-dive` (exit), `lens-emerge` (entry).

**`spectral`** — "Inside the Decomposition" (micro-scale interior):

| Station | Size | Suits |
|---|---|---|
| `arrival.overlook` | 11 × 4 | wide arrival |
| `core.plate` | 4.8 × 3.2 | core content |
| `field.hologram` | 3.6 × 3.2 | hologram chart |
| `layers.gallery` | 9 × 3.5 | long gallery |
| `ring.return` | 8 × 3 | natural last stop |

Poses: `ring-dive` (exit), `deep-emerge` (entry).

Classic portal pairings: lecture-hall→math-void `board-dive`/`void-emerge`,
back `gate-dive`/`board-emerge`; atrium→spectral `prism-dive`/`deep-emerge`,
back `ring-dive`/`lens-emerge`.

### Camera intents (`camera:`)

| Intent | Framing |
|---|---|
| `read-close` | square-on, close enough to read body text (the default) |
| `wide-establishing` | steps back, looks past the content into the world — arrivals/departures |
| `orbit-focus` | off-axis three-quarter view — charts and objects |
| `sky-gaze` | from low ground, gazing up at content overhead |
| `quote-gaze` | slightly below floating text, looking up at it |

`camera:` may also name a world pose (e.g. `prism-approach`) for framings
about the world's own geometry.

### Skins (`skin:`)

A skin must accept its content's kind (validated). Omit `skin:` for defaults.

| Skin | Accepts | Look |
|---|---|---|
| `engraving` | text | carved into a lit stone tablet — **default for text** |
| `chalkboard` | formula, text | chalk on slate; formulas write themselves — **default for formula** |
| `etchedGlass` | formula | etched into a lit glass slab, glowing — hero formulas |
| `cloudText` | text | luminous drifting text in a particle nebula — poetic moments |
| `hologram` | chart (bar) | glowing volumetric bars — **default for bar charts** |
| `constellation` | chart (scatter) | linked stars in a dark dome — **default for scatter** |
| `plaque` | image, video | framed media on a wall — *document layer only* |
| `projection` | manim | frameless floating animation panel — *document layer only* |

## Hard rules (compile errors if violated)

- Reference ONLY names listed above. Never coordinates, never invented names.
- One scene per station, across the whole talk (double-booking is an error).
- Consecutive scenes in different worlds REQUIRE a portal `from` the first
  `to` the second. Portals are the only world crossings.
- Scene ids kebab-case (`^[a-z0-9][a-z0-9-]*$`), unique; portal/branch
  `from`/`to` must name existing scene ids.
- `worlds:` entries must be template ids: `atrium`, `spectral`,
  `lecture-hall`, `math-void` — and every scene's `world` must be listed.
- A skin must accept its content kind (see table).

## Style rules (make the talk good, not just valid)

- 6–10 scenes; flow station to station within a world, end somewhere
  conclusive (`gate.return`, `ring.return`, or a wide overlook).
- Give the dramatic peak a hero treatment: `etchedGlass`, a roomy station,
  `wide-establishing` or `quote-gaze`.
- `role:` marks structure: `chapter` for section openers, `portal` for
  send-off scenes, `chart`/`quote` as appropriate; default `detail`.
- Narrate every scene: 2–4 sentences, spoken style, plain ASCII, numbers and
  symbols written out as words ("pi squared over six").
- Fit text to the station: ~3 short paragraphs on a 3.8 × 2.8 board; if the
  user reports overflow, cut words rather than fight layout.
- Defaults are good — set `skin:`/`camera:` only for a deliberate effect.
- Charts: small inline datasets only (≤ ~8 bars / ~12 points).
- Respect `locked: true` scenes: never modify them; on regeneration they are
  preserved byte-for-byte.

## Workflow and commands

A presentation lives in its own directory (e.g. `examples/my-talk/`); run all
commands from there:

| Command | Does |
|---|---|
| `npm run spec:compile` | `talk.spec.yaml` → `src/journey/document.json` — **run after every spec edit** |
| `npm run validate` | structural validation + coverage report + asset-staleness warnings |
| `npm run outline` | the talk as a readable text outline (fast proofread) |
| `npm run dev` | launch in the browser |
| `npm run generate` | brief.md → spec → document via an AI CLI engine (`--engine claude` default, `codex` alternative) |
| `npm run generate:regen` | regenerate from the brief, preserving `locked: true` scenes |
| `npm run narration` | print narration scripts as JSON |
| `npm run narration:render` | render TTS audio clips (hash-cached; only changed scripts re-render) |
| `npm run diff -- <a> <b>` | semantic diff between two journey modules |

The edit loop: edit `talk.spec.yaml` → `spec:compile` → `validate` → (if
narration changed) `narration:render`. A change is not done until
`npm run build`, `npm run lint` (repo root), and `npm run validate` pass.

### File layout of a presentation

```
examples/my-talk/
  brief.md                  Layer A — the human's one-paragraph idea
  talk.spec.yaml            Layer B — the Authoring Spec (EDIT THIS)
  talk.provenance.json      generation record (brief hash, engine, attempts)
  src/journey/document.json compiled authored document (GENERATED — don't hand-edit)
  src/journey/project.ts    wraps the document in defineJourney with the world templates
  src/main.tsx              mounts PresentationApp with the world components map
  public/assets/narration/  rendered audio clips + manifest (derived, cached)
```

### Creating a new presentation

Copy an example and empty it:

```bash
cp -r examples/basel-problem examples/my-talk
cd examples/my-talk
rm -rf node_modules dist public/assets/narration talk.spec.yaml talk.provenance.json
# package.json: set "name"; adjust --worlds in the generate scripts
# index.html: set the <title>
# src/main.tsx + src/journey/project.ts: world components/templates must match worlds:
cd ../.. && npm install     # register the workspace
```

If the chosen worlds change, two files must agree with `worlds:`:
`src/main.tsx` (the `worlds={{...}}` component map: `AtriumWorld`,
`SpectralWorld`, `LectureHallWorld`, `MathVoidWorld` from
`@spatial-present/worlds`) and `src/journey/project.ts` (the `templates: [...]`
array: `AtriumTemplate`, `SpectralTemplate`, `LectureHallTemplate`,
`MathVoidTemplate`).

## Error messages you may see

| Message (abridged) | Meaning / fix |
|---|---|
| `scenes "x" (...) and "y" (...) are consecutive but in different worlds — add a portal` | add a `portals:` entry from x to y with dive/emerge poses |
| `station "..." in world "..." is double-booked by anchors "a-x" and "a-y"` | scenes x and y claim one station; move one (anchor `a-<scene-id>` maps back to the scene) |
| `anchor "a-x" references unknown station "..." (available: ...)` | typo or wrong world; pick from the listed names |
| `unknown world template "..."` | `worlds:` must use exact template ids |
| `portal N references unknown scene "..."` | portal `from`/`to` must be scene ids |
| zod parse errors on the spec | a field is missing/mistyped; check the scene-field table |

Compiled ids are derived from scene ids — content `c-<id>`, anchor `a-<id>`,
beat `b-<id>`, skin `s-<id>` — so document-level errors map straight back to
the spec scene.

## The document layer (when the spec isn't enough)

The spec covers text/formula/chart only. For more, edit the authored document
(`src/journey/document.json`, or a hand-written `project.ts` like
`examples/svd-tour`'s) — still positionless. The extra powers:

- **image / video content**: `{ kind: "image"|"video", src, title?, caption?, alt }`
  with files under `public/`; rendered by the `plaque` skin.
- **manim content**: `{ kind: "manim", scene: "scenes/file.py#ClassName",
  quality?, transparent?, reveal: "play"|"loop"|"stepwise", fallbackText }`.
  Render clips with `python3 ../../packages/cli/render-manim.py` (needs `uv`,
  ffmpeg, TeX); clips land at `/assets/manim/<contentId>.webm` with cuepoints.
  `stepwise` makes each advance step one cuepoint; a `[mark:step]` token inside
  a narration script fires the same step at that spoken moment.
- **narration audio** is expected at `/assets/narration/<beatId>.mp3` —
  exactly what `narration:render` produces.
- **explicit camera poses and raw positions** exist as escape hatches
  (`camera:`/`position:` instead of `cameraIntent:`/`station:`) — avoid them;
  they break re-flow.

If a request truly needs new stations, skins, worlds, or intents, that is
framework work in `packages/` (TypeScript), out of scope for content authoring
— flag it to the user rather than faking it with raw coordinates.

## What NOT to do

- Don't hand-edit `src/journey/document.json` when `talk.spec.yaml` exists —
  the next `spec:compile` would overwrite your edits. Edit the spec.
- Don't put non-ASCII (Greek, ², ½, smart quotes, em dashes) in in-world
  text/titles — the 3D fonts lack the glyphs. ASCII in text; notation in latex.
- Don't write coordinates, sizes, colors, or ambience anywhere.
- Don't modify `locked: true` scenes.
- Don't put content in `packages/` — framework packages never import journey
  content.
- Don't promise narration changes without re-rendering: edit `narrate:` →
  `spec:compile` → `narration:render`.
