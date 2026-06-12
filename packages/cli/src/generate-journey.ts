/**
 * The AI generator — Layer A to Layer B of the layered input model.
 *
 *   tsx generate-journey.ts --brief brief.md --worlds lecture-hall,math-void \
 *       --out . [--model <model>] [--regen]
 *
 * Takes a free-form brief and emits an Authoring Spec, grounded by the
 * registries: the prompt contains exactly the stations, camera intents,
 * poses, and skins that exist, so the model can only reference real
 * vocabulary. The output is validated (spec schema → spec compiler →
 * defineJourney); invalid output gets one repair round with the errors
 * fed back, and is rejected if still broken — never rendered.
 *
 * Artifacts written to --out (all diffable source, never only pixels):
 *   talk.spec.yaml           the Layer B spec (human-editable)
 *   src/journey/document.json  the compiled authored document (positionless)
 *   talk.provenance.json     prompt, engine, model, attempts, locked ids
 *
 * With --regen, scenes marked `locked: true` in the existing spec are
 * preserved verbatim: they are shown to the model as immutable and
 * re-inserted by id afterwards, so hand-tuned scenes survive.
 *
 * The engine is the locally authenticated Claude Code CLI (`claude -p`),
 * pluggable behind runEngine() the way TTS engines sit behind the
 * narration job.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
  authoringSpecSchema,
  type AuthoringSpec,
  type SceneSpec,
  type WorldTemplate,
} from "@spatial-present/schema";
import {
  builtinCameraIntents,
  compileSpec,
  defineJourney,
  skinCapabilities,
} from "@spatial-present/core";
import {
  AtriumTemplate,
  SpectralTemplate,
  LectureHallTemplate,
  MathVoidTemplate,
} from "@spatial-present/worlds";

const ALL_TEMPLATES: WorldTemplate[] = [
  AtriumTemplate,
  SpectralTemplate,
  LectureHallTemplate,
  MathVoidTemplate,
];

// ---------------------------------------------------------------- args

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const briefPath = arg("brief");
const worldIds = arg("worlds")?.split(",") ?? [];
const outDir = arg("out") ?? ".";
const model = arg("model");
const engine = arg("engine") ?? "claude"; // claude | codex
const regen = process.argv.includes("--regen");

if (!briefPath || !worldIds.length) {
  console.error(
    "usage: generate-journey --brief <file> --worlds <id,id> [--out <dir>] [--model <model>] [--regen]"
  );
  process.exit(1);
}
const templates = worldIds.map((id) => {
  const t = ALL_TEMPLATES.find((t) => t.id === id);
  if (!t) {
    console.error(
      `unknown world template "${id}" (available: ${ALL_TEMPLATES.map((t) => t.id).join(", ")})`
    );
    process.exit(1);
  }
  return t;
});
const brief = readFileSync(briefPath, "utf8");

// ---------------------------------------------------- grounding menu

/** The registry menu: the only names the model may reference. */
function groundingMenu(templates: WorldTemplate[]): string {
  const lines: string[] = [];
  lines.push("## World templates (use these ids; one scene per station)");
  for (const t of templates) {
    lines.push(`- world \`${t.id}\` — ${t.defaults?.name ?? t.id}`);
    lines.push(
      `  stations: ${Object.entries(t.stations)
        .map(([name, s]) => `\`${name}\` (${s.envelope.width}×${s.envelope.height})`)
        .join(", ")}`
    );
    if (t.poses)
      lines.push(
        `  portal poses: ${Object.keys(t.poses)
          .map((p) => `\`${p}\``)
          .join(", ")}`
      );
    if (t.cameraIntents)
      for (const [name, spec] of Object.entries(t.cameraIntents))
        lines.push(`  extra camera intent: \`${name}\` — ${spec.description ?? ""}`);
  }
  lines.push("");
  lines.push("## Camera intents (`camera:` per scene; default read-close)");
  for (const [name, spec] of Object.entries(builtinCameraIntents))
    lines.push(`- \`${name}\` — ${spec.description}`);
  lines.push("");
  lines.push("## Skins (`skin:` per scene; omit for the default)");
  for (const [name, cap] of Object.entries(skinCapabilities)) {
    if (!cap.accepts.some((k) => k === "text" || k === "formula" || k === "chart"))
      continue;
    const charts = cap.chartTypes ? ` (${cap.chartTypes.join("/")} charts)` : "";
    lines.push(`- \`${name}\` accepts ${cap.accepts.join("/")}${charts} — ${cap.description}`);
  }
  return lines.join("\n");
}

const FORMAT_GUIDE = `
## Output format — an Authoring Spec, as YAML

\`\`\`yaml
id: my-talk            # kebab-case
title: My Talk
worlds: [lecture-hall, math-void]   # template ids, in narrative order
scenes:
  - id: welcome        # kebab-case, unique
    title: Welcome
    world: lecture-hall
    station: board.left
    role: chapter      # chapter|detail|chart|quote|media|portal (default detail)
    content:
      kind: text       # text | formula | chart
      title: Optional Heading
      body: |
        Two or three short paragraphs. Plain ASCII only.
    camera: read-close # optional
    narrate: >
      Two to four spoken sentences for the narrated tour. Plain ASCII,
      numbers and symbols written out as words.
    notes: One or two presenter bullets.
  - id: key-formula
    title: The key formula
    world: lecture-hall
    station: board.center
    content:
      kind: formula
      latex: "\\\\sum_{n=1}^{\\\\infty} \\\\frac{1}{n^{2}}"
      spoken: the sum over n of one over n squared
  - id: some-data
    title: Some data
    world: lecture-hall
    station: board.right
    content:
      kind: chart      # bar or scatter; small inline datasets only
      data:
        type: bar
        title: Chart title
        unit: "%"
        series:
          - { label: one, value: 12 }
          - { label: two, value: 34 }
      summary: One sentence reading the chart aloud.
portals:               # REQUIRED between consecutive scenes in different worlds
  - from: key-formula
    to: some-void-scene
    label: Step through the board
    dive: board-dive   # a pose of the source world
    emerge: void-emerge  # a pose of the target world
branches:              # optional improvisation edges (branch skips ahead, return goes back)
  - { from: welcome, to: key-formula, label: Skip ahead, kind: branch }
\`\`\`

## Rules
- Reference ONLY the stations, poses, intents, and skins listed above; never invent names, never use coordinates.
- One scene per station — a station cannot host two scenes.
- 6–10 scenes; the narrative should flow station to station, ending somewhere conclusive.
- The LAST scene should set \`role: portal\` only if you also add a return portal from it.
- Defaults are good: omit \`skin\` unless you want the non-default look (cloudText for poetic text, etchedGlass for a hero formula).
- formula latex: presentation-sized (one line or a small aligned block), double-escape backslashes in YAML double-quoted strings or use single quotes.
- narrate: every scene, 2–4 sentences, plain ASCII, spoken style (this becomes the self-running tour audio).
- In-world text is ASCII-only (the 3D fonts have no Greek/subscripts): write "pi", "n squared", "1/n^2" in text/titles; real notation belongs in formula latex.
- Output ONLY the YAML, fenced in a single \`\`\`yaml block. No commentary.
`;

// -------------------------------------------------------------- engine

function runEngine(prompt: string): string {
  const [bin, args] =
    engine === "codex"
      ? [
          "codex",
          ["exec", "--sandbox", "read-only", "--skip-git-repo-check", "-"],
        ]
      : ["claude", ["-p", "--output-format", "text"]];
  if (model) args.push("--model", model);
  // When this generator itself runs inside a Claude Code session, the
  // child CLI must not inherit the session's proxy/auth environment —
  // scrub it so the standalone CLI uses its own stored credentials.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([k]) => !k.startsWith("ANTHROPIC_") && !k.startsWith("CLAUDE_")
    )
  );
  return execFileSync(bin, args, {
    input: prompt,
    encoding: "utf8",
    cwd: tmpdir(), // outside any repo, so no CLAUDE.md/AGENTS.md leaks in
    env,
    timeout: 600_000,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function extractYaml(output: string): string {
  const fenced = output.match(/```ya?ml\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : output).trim();
}

// ------------------------------------------------------------ validate

function tryCompile(yamlText: string): { spec: AuthoringSpec } | { errors: string } {
  try {
    const spec = authoringSpecSchema.parse(parseYaml(yamlText));
    defineJourney(compileSpec(spec, templates), { templates });
    return { spec };
  } catch (error) {
    return { errors: error instanceof Error ? error.message : String(error) };
  }
}

// ---------------------------------------------------------------- main

const existingSpecPath = join(outDir, "talk.spec.yaml");
const locked: SceneSpec[] =
  regen && existsSync(existingSpecPath)
    ? authoringSpecSchema
        .parse(parseYaml(readFileSync(existingSpecPath, "utf8")))
        .scenes.filter((s) => s.locked)
    : [];

const basePrompt = [
  "You are generating a spatial presentation for a framework that replaces slides with a guided journey through a 3D world. You write the Authoring Spec; a compiler owns all geometry.",
  "",
  "# Brief",
  brief.trim(),
  "",
  groundingMenu(templates),
  FORMAT_GUIDE,
  locked.length
    ? "\n## Locked scenes (immutable)\nThese scenes already exist and are locked by the author. Include each one in your output with EXACTLY this content (you may move their position in the scene order):\n```yaml\n" +
      stringifyYaml(locked) +
      "```"
    : "",
].join("\n");

console.log(
  `generating "${briefPath}" with worlds [${worldIds.join(", ")}]${locked.length ? ` (${locked.length} locked scenes)` : ""}…`
);

let attempts = 0;
let yamlText: string;
let spec: AuthoringSpec | null = null;
let prompt = basePrompt;
while (attempts < 2 && !spec) {
  attempts += 1;
  yamlText = extractYaml(runEngine(prompt));
  // Locked scenes are re-inserted verbatim regardless of what came back.
  if (locked.length) {
    const parsed = parseYaml(yamlText) as Record<string, unknown>;
    const scenes = (parsed.scenes ?? []) as Record<string, unknown>[];
    parsed.scenes = scenes.map(
      (s) => locked.find((l) => l.id === s.id) ?? s
    );
    for (const l of locked)
      if (!scenes.some((s) => s.id === l.id))
        (parsed.scenes as unknown[]).push(l);
    yamlText = stringifyYaml(parsed);
  }
  const result = tryCompile(yamlText);
  if ("spec" in result) {
    spec = result.spec;
  } else if (attempts < 2) {
    console.log(`  attempt ${attempts} invalid — sending errors back for repair…`);
    prompt =
      basePrompt +
      "\n\n## Your previous output (invalid)\n```yaml\n" +
      yamlText +
      "\n```\n\n## Validation errors — fix these and output the complete corrected YAML\n" +
      result.errors;
  } else {
    console.error("generation failed after repair attempt; last errors:\n" + result.errors);
    process.exit(1);
  }
}

const doc = compileSpec(spec!, templates);
mkdirSync(join(outDir, "src", "journey"), { recursive: true });
writeFileSync(
  existingSpecPath,
  "# Generated Authoring Spec (Layer B) — edit freely; scenes marked\n" +
    "# `locked: true` survive --regen verbatim. Recompile with:\n" +
    "#   npm run spec:compile\n" +
    stringifyYaml(spec)
);
writeFileSync(
  join(outDir, "src", "journey", "document.json"),
  JSON.stringify(doc, null, 2) + "\n"
);
writeFileSync(
  join(outDir, "talk.provenance.json"),
  JSON.stringify(
    {
      brief: briefPath,
      briefHash: createHash("sha256").update(brief).digest("hex").slice(0, 16),
      engine,
      model: model ?? "default",
      attempts,
      lockedScenes: locked.map((l) => l.id),
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + "\n"
);

console.log(
  `✔ generated ${spec!.scenes.length} scenes across ${spec!.worlds.length} worlds (${attempts} attempt${attempts > 1 ? "s" : ""})`
);
console.log(`  ${existingSpecPath}`);
console.log(`  ${join(outDir, "src", "journey", "document.json")}`);
console.log(`  ${join(outDir, "talk.provenance.json")}`);
