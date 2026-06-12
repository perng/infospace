# The Basel Problem — an AI-generated journey

This example was **generated, not hand-authored** — the M5 proof piece.
The pipeline, top to bottom of the layered input model:

```
brief.md                Layer A — a one-paragraph free-form brief (human)
  │  npm run generate      (generate-journey: registry-grounded LLM call,
  ▼                         validate → repair → reject; engine: claude|codex CLI)
talk.spec.yaml          Layer B — the Authoring Spec: scenes naming stations,
  │                      intents, skins; content inline; zero coordinates.
  │  npm run spec:compile  (compileSpec + defineJourney revalidation)
  ▼
src/journey/document.json   the authored document (still positionless)
  ▼  defineJourney at load — solver, skin resolver, auto-router, planner
the running 3D tour
```

Nine scenes across the lecture hall and the math void: the series posed in
chalk, convergence bounded, partial sums charted as a hologram, then
through the board for Euler's sine-product leap and the reveal —
`ζ(2) = π²/6` in etched glass. Every beat narrated (`V` for the
self-running tour).

What the generation run demonstrated:

- **Grounding works.** First attempt was valid: every station real, used
  once; the portal exactly at the world change; correct mathematics.
- **Review is the human's job.** Two post-generation edits, both in the
  spec: one camera intent swap, one body trimmed to fit its board.
- **Locking works.** `reveal-answer` is `locked: true`; a `--regen`
  produced a different talk around it with the scene byte-identical.
- **Provenance:** `talk.provenance.json` records the brief hash, engine,
  model, and attempt count.

Regenerate with `npm run generate:regen` (locked scenes survive), rebuild
narration with `npm run narration:render`, inspect changes with
`npx tsx ../../packages/cli/src/journey-cli.ts diff <a> <b>`.
