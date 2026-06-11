/**
 * Minimal presentation compiler CLI.
 *
 *   tsx journey-cli.ts validate  [journey-module]   — schema + route-graph
 *        validation summary; warns when rendered narration audio is missing
 *        or stale relative to the scripts in the document
 *   tsx journey-cli.ts outline   [journey-module]   — emits outline.md, the
 *        derived linear handout, into the current directory
 *   tsx journey-cli.ts narration [journey-module]   — prints the narration
 *        scripts as JSON; consumed by generate-narration.py (TTS renderer)
 *   tsx journey-cli.ts resolve   [journey-module]   — prints the canonical,
 *        fully resolved document (compiled geometry + symbolic provenance)
 *
 * The journey module (default ./src/journey/project.ts, relative to the
 * current directory) must export `journey`, the defineJourney() output.
 * Relative output paths (outline.md, public/assets/narration) also resolve
 * against the current directory, so run from the presentation's root.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ProjectIndex } from "@spatial-present/core";
import type { ContentPrimitive } from "@spatial-present/schema";

const NARRATION_DIR = "public/assets/narration";

const command = process.argv[2] ?? "validate";
const journeyModule = process.argv[3] ?? "src/journey/project.ts";
if (!existsSync(journeyModule)) {
  console.error(`journey module not found: ${resolve(journeyModule)}`);
  process.exit(1);
}
const { journey } = (await import(
  pathToFileURL(resolve(journeyModule)).href
)) as { journey: ProjectIndex };
if (!journey?.project) {
  console.error(`${journeyModule} does not export \`journey\` (defineJourney output)`);
  process.exit(1);
}

if (command === "validate") {
  // journey is built through defineJourney, which already threw on any
  // schema or graph error — reaching this line means the document is valid.
  const p = journey.project;
  console.log(`✔ "${p.title}" is valid`);
  console.log(`  worlds:  ${p.worlds.length} (${p.worlds.map((w) => w.id).join(", ")})`);
  console.log(`  anchors: ${p.anchors.length}`);
  console.log(`  beats:   ${p.beats.length}`);
  console.log(`  routes:  ${p.routes.length}`);
  console.log(`  content: ${p.content.length}`);
  console.log(`  skins:   ${p.skins.length}`);
  const portals = p.routes.filter((r) => r.kind === "portal").length;
  const branches = p.routes.filter((r) => r.kind === "branch" || r.kind === "return").length;
  console.log(`  scale portals: ${portals}, branches/returns: ${branches}`);
  // Symbolic-resolution coverage: how much of the document the compiler
  // laid out and framed, vs. hand-placed escape hatches.
  const viaStation = p.anchors.filter((a) => a.station).length;
  const viaIntent = p.beats.filter((b) => b.cameraIntent).length;
  const autoRouted = p.routes.filter((r) => r.id.startsWith("r-auto-")).length;
  console.log(`  anchors via stations:   ${viaStation} / ${p.anchors.length}`);
  console.log(`  cameras via intents:    ${viaIntent} / ${p.beats.length}`);
  console.log(`  auto-routed primaries:  ${autoRouted} / ${p.routes.length}`);
  const narrated = p.beats.filter((b) => b.narration).length;
  console.log(`  narrated beats: ${narrated} / ${p.beats.length}`);
  for (const w of narrationWarnings()) console.warn(`  ⚠ ${w}`);
} else if (command === "resolve") {
  // The canonical document: resolved geometry plus symbolic provenance.
  // Useful for diffing compiler output and as the contract for AI tooling.
  console.log(JSON.stringify(journey.project, null, 2));
} else if (command === "narration") {
  // The scripts are the semantic source; the renderer derives audio from
  // this export and records provenance in manifest.json next to the clips.
  const beats = journey.project.beats
    .filter((b) => b.narration)
    .map((b) => ({ id: b.id, script: b.narration!.script }));
  console.log(JSON.stringify({ beats }, null, 2));
} else if (command === "outline") {
  const lines: string[] = [];
  const p = journey.project;
  lines.push(`# ${p.title}`);
  lines.push("");
  lines.push(
    `> Linear handout derived from the spatial presentation model — ${journey.outlineOrder.length} beats across ${p.worlds.map((w) => w.name).join(" and ")}.`
  );
  for (const beat of journey.outlineOrder) {
    const anchor = journey.anchorById.get(beat.anchorId)!;
    const world = p.worlds.find((w) => w.id === anchor.worldId)!;
    lines.push("");
    lines.push(`## ${beat.title}`);
    lines.push(`*${world.name} · ${anchor.name}*`);
    for (const cid of anchor.contentIds) {
      const content = journey.contentById.get(cid);
      if (content) lines.push("", ...fallbackMarkdown(content));
    }
    if (beat.narration)
      lines.push("", `**Narration:** ${beat.narration.script}`);
    if (beat.notes) lines.push("", `**Speaker notes:** ${beat.notes}`);
  }
  lines.push("");
  writeFileSync("outline.md", lines.join("\n"));
  console.log(`✔ wrote outline.md (${lines.length} lines)`);
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}

/**
 * Narration audio is a derived asset: each clip's provenance (script hash,
 * engine, voice) is recorded in manifest.json by the renderer. Warn when a
 * clip is missing or its script has changed since it was rendered.
 */
function narrationWarnings(): string[] {
  const warnings: string[] = [];
  const manifestPath = `${NARRATION_DIR}/manifest.json`;
  const manifest: Record<string, { scriptHash?: string }> = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : {};
  for (const beat of journey.project.beats) {
    if (!beat.narration) continue;
    const clip = `${NARRATION_DIR}/${beat.id}.mp3`;
    if (!existsSync(clip)) {
      warnings.push(`narration audio missing for "${beat.id}" — run: python3 scripts/generate-narration.py`);
      continue;
    }
    const hash = createHash("sha256").update(beat.narration.script).digest("hex").slice(0, 16);
    if (manifest[beat.id]?.scriptHash !== hash)
      warnings.push(`narration audio stale for "${beat.id}" (script changed) — run: python3 scripts/generate-narration.py`);
  }
  return warnings;
}

function fallbackMarkdown(content: ContentPrimitive): string[] {
  switch (content.kind) {
    case "text":
      return [
        ...(content.title ? [`### ${content.title}`, ""] : []),
        content.body,
      ];
    case "chart": {
      const rows =
        content.data.type === "bar"
          ? [
              "| | |",
              "| --- | --- |",
              ...content.data.series.map(
                (s) => `| ${s.label} | ${s.value.toLocaleString()} ${content.data.type === "bar" ? content.data.unit ?? "" : ""} |`
              ),
            ]
          : [
              `| | ${content.data.xLabel} | ${content.data.yLabel} |`,
              "| --- | --- | --- |",
              ...content.data.points.map(
                (pt) => `| ${pt.label} | ${pt.x.toLocaleString()} | ${pt.y.toLocaleString()} |`
              ),
            ];
      return [`### ${content.data.title}`, "", content.fallbackText, "", ...rows];
    }
    case "image":
      return [`*Image — ${content.title ?? ""}*: ${content.alt}`];
    case "video":
      return [`*Film — ${content.title ?? ""}*: ${content.alt}`];
  }
}
