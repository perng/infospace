/**
 * Minimal presentation compiler CLI.
 *
 *   npm run validate   — schema + route-graph validation, prints a summary
 *   npm run outline    — emits outline.md, the derived linear handout
 *
 * Both operate on the same project model the 3D runtime renders.
 */
import { writeFileSync } from "node:fs";
import { journey } from "../src/journey/project";
import type { ContentPrimitive } from "../src/framework/schema";

const command = process.argv[2] ?? "validate";

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
    if (beat.notes) lines.push("", `**Speaker notes:** ${beat.notes}`);
  }
  lines.push("");
  writeFileSync("outline.md", lines.join("\n"));
  console.log(`✔ wrote outline.md (${lines.length} lines)`);
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
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
