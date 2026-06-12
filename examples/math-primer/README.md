# Euler's Identity — a short walk

The minimal math presentation built on the `@spatial-present` packages, and
the proof piece for M3 (math primitives) and M4 (animated math + steerable
narration):

> An evening lecture hall with three blackboards. The exponential series and
> the sine/cosine series write themselves out in chalk; substitute *ix*, and
> the tour steps **through the center board** into the math void — a dark
> space where Euler's formula stands in etched glass beside a living unit
> circle, a Manim animation sweeps the half turn one step at a time, and
> `e^{iπ} + 1 = 0` waits on a plinth of light.

## Run it

```sh
npm install        # once, from the repo root
cd examples/math-primer
npm run dev        # → http://localhost:5173
npm run validate   # compile + station/intent coverage + asset staleness
npm run outline    # derived markdown handout (LaTeX + spoken math)

# derived assets (hash-cached; only re-render what changed):
npm run manim:render      # scenes/*.py → public/assets/manim/*.webm + cuepoints
npm run narration:render  # narration scripts → mp3 + timestamps/marks
```

Drive with `→`/`Space` (advance — on the animated beat this steps the clip
cuepoint by cuepoint before moving on), `←` (back), mouse (orbit), `Esc`
(return to route), `K` (search), `O` (outline), `N` (notes), `V` (voice:
the narrated tour — on the animated beat, `[mark:step]` cues in the script
drive the animation at the spoken word, with karaoke captions).

The manim job needs `uv` (it provisions Python 3.13 + manim, cached),
ffmpeg, pkg-config, and a LaTeX install; the narration job needs
kokoro-onnx and its model files.

## What it demonstrates

- **The `formula` primitive.** LaTeX is the semantic source; the spoken-math
  `fallbackText` feeds the outline and screen readers. In-world, MathJax
  (tex-svg, font cache off) renders the LaTeX to self-contained glyph paths
  that become real `THREE.Shape` geometry — crisp at any zoom, loaded
  lazily so non-math journeys never download MathJax.
- **`chalkboard`** — slate, wood frame, chalk tray; formulas *write
  themselves on* glyph by glyph when the beat activates (the default skin
  for formulas). Plain text renders as chalk handwriting.
- **`etchedGlass`** — a transmissive slab with the formula glowing just
  proud of the glass, lit from a bar at its foot.
- **`lecture-hall` and `math-void` world templates** — stations
  (`board.left/center/right`, `plinth.identity`, `gate.return`, …), camera
  intents, and named portal poses (`board-dive`, `void-emerge`). The
  document is positionless: zero coordinates, primary chain auto-routed,
  only the portals and improvisation branches authored.
- **The `manim` primitive + `projection` skin** (M4) — the half-turn beat
  references `scenes/half_turn.py#HalfTurn`; the render job derives a
  transparent VP9 clip with a cuepoint at every `self.play` boundary, and
  the frameless projection composites it straight over the void. With
  `reveal: "stepwise"`, next-presses walk the cuepoints; in voice mode the
  narration's `[mark:step]` cues fire the same steps at the spoken word.

The journey document is
[`src/journey/project.ts`](src/journey/project.ts); scenery lives in
`@spatial-present/worlds`. Same architecture as the flagship
[`svd-tour`](../svd-tour/README.md) — one document, every view derived.
