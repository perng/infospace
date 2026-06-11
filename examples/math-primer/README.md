# Euler's Identity — a short walk

The minimal math presentation built on the `@spatial-present` packages, and
the proof piece for M3 (math primitives):

> An evening lecture hall with three blackboards. The exponential series and
> the sine/cosine series write themselves out in chalk; substitute *ix*, and
> the tour steps **through the center board** into the math void — a dark
> space where Euler's formula stands in etched glass beside a living unit
> circle, and `e^{iπ} + 1 = 0` waits on a plinth of light.

## Run it

```sh
npm install        # once, from the repo root
cd examples/math-primer
npm run dev        # → http://localhost:5173
npm run validate   # compile + station/intent coverage
npm run outline    # derived markdown handout (LaTeX + spoken math)
```

Drive with `→`/`Space` (advance), `←` (back), mouse (orbit), `Esc`
(return to route), `K` (search), `O` (outline), `N` (notes).

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

The journey document is
[`src/journey/project.ts`](src/journey/project.ts); scenery lives in
`@spatial-present/worlds`. Same architecture as the flagship
[`svd-tour`](../svd-tour/README.md) — one document, every view derived.
