import {
  authoringSpecSchema,
  type AuthoredProjectInput,
  type AuthoringSpecInput,
  type ContentPrimitive,
  type RouteEdge,
  type SceneSpec,
  type WorldTemplate,
} from "@spatial-present/schema";

/**
 * The spec compiler: expands an Authoring Spec (Layer B — what AI emits
 * and humans tweak) into an authored document (what defineJourney
 * compiles). One scene becomes a content primitive, an anchor at the
 * named station, a beat with the named camera intent, and a skin binding;
 * worlds inherit their template's defaults; portals and branches become
 * routes. The result is still positionless — geometry stays the layout
 * solver's and camera planner's job.
 */
export function compileSpec(
  input: AuthoringSpecInput,
  templates: WorldTemplate[]
): AuthoredProjectInput {
  const spec = authoringSpecSchema.parse(input);
  const templateById = new Map(templates.map((t) => [t.id, t]));
  const errors: string[] = [];

  const worlds = spec.worlds.map((id) => {
    const template = templateById.get(id);
    if (!template?.defaults) {
      errors.push(
        template
          ? `world template "${id}" publishes no defaults — the spec layer needs them`
          : `unknown world template "${id}" (available: ${templates.map((t) => t.id).join(", ")})`
      );
      return { id, name: id, unitScale: "human" as const, ambience: { background: "#000000" } };
    }
    return { id, ...template.defaults };
  });

  const sceneIds = new Set(spec.scenes.map((s) => s.id));
  const beatId = (sceneId: string) => `b-${sceneId}`;
  const requireScene = (ref: string, where: string) => {
    if (!sceneIds.has(ref))
      errors.push(`${where} references unknown scene "${ref}"`);
  };

  const content = spec.scenes.map(sceneContent);
  const anchors = spec.scenes.map((s) => ({
    id: `a-${s.id}`,
    worldId: s.world,
    name: s.place ?? s.title,
    station: s.station,
    semanticRole: s.role ?? "detail",
    contentIds: [`c-${s.id}`],
  }));
  const beats = spec.scenes.map((s) => ({
    id: beatId(s.id),
    anchorId: `a-${s.id}`,
    title: s.title,
    cameraIntent: s.camera ?? "read-close",
    ...(s.arrive ? { arrive: s.arrive } : {}),
    ...(s.notes ? { notes: s.notes } : {}),
    ...(s.narrate ? { narration: { script: s.narrate } } : {}),
  }));
  const skins = spec.scenes.map((s) => {
    // The kind-level default for charts is the bar hologram; route
    // scatter data to the constellation unless the spec chose a skin.
    const skin =
      s.skin ??
      (s.content.kind === "chart" && s.content.data.type === "scatter"
        ? ("constellation" as const)
        : undefined);
    return {
      id: `s-${s.id}`,
      contentId: `c-${s.id}`,
      anchorId: `a-${s.id}`,
      ...(skin ? { skinKind: skin } : {}),
      params: skinParams(s, templateById.get(s.world)),
    };
  });

  const routes: RouteEdge[] = [
    ...spec.portals.map((p, i) => {
      requireScene(p.from, `portal ${i + 1}`);
      requireScene(p.to, `portal ${i + 1}`);
      return {
        id: `r-portal-${p.from}`,
        from: beatId(p.from),
        to: beatId(p.to),
        kind: "portal" as const,
        label: p.label,
        transition: "portal" as const,
        ...(p.dive ? { divePose: p.dive } : {}),
        ...(p.emerge ? { emergePose: p.emerge } : {}),
      };
    }),
    ...spec.branches.map((b, i) => {
      requireScene(b.from, `branch ${i + 1}`);
      requireScene(b.to, `branch ${i + 1}`);
      return {
        id: `r-${b.kind}-${b.from}-${b.to}`,
        from: beatId(b.from),
        to: beatId(b.to),
        kind: b.kind,
        label: b.label,
        transition: "fly" as const,
      };
    }),
  ];

  // Consecutive scenes in different worlds need a portal: the auto-routed
  // primary chain cannot swap worlds (only portal edges do).
  for (let i = 0; i < spec.scenes.length - 1; i++) {
    const here = spec.scenes[i];
    const next = spec.scenes[i + 1];
    if (
      here.world !== next.world &&
      !spec.portals.some((p) => p.from === here.id && p.to === next.id)
    ) {
      errors.push(
        `scenes "${here.id}" (${here.world}) and "${next.id}" (${next.world}) are consecutive but in different worlds — add a portal from "${here.id}" to "${next.id}"`
      );
    }
  }

  if (errors.length) {
    throw new Error(
      `Authoring Spec "${spec.title}" failed to compile:\n` +
        errors.map((e) => `  - ${e}`).join("\n")
    );
  }

  return {
    schemaVersion: "0.1",
    id: spec.id,
    title: spec.title,
    startBeatId: beatId(spec.scenes[0].id),
    worlds,
    content,
    anchors,
    beats,
    routes,
    skins,
  };
}

function sceneContent(s: SceneSpec): ContentPrimitive {
  const id = `c-${s.id}`;
  switch (s.content.kind) {
    case "text":
      return { id, kind: "text", title: s.content.title, body: s.content.body };
    case "formula":
      return {
        id,
        kind: "formula",
        latex: s.content.latex,
        display: "block",
        fallbackText: s.content.spoken,
      };
    case "chart":
      return {
        id,
        kind: "chart",
        data: s.content.data,
        fallbackText: s.content.summary,
      };
  }
}

/** Skin size from the station's envelope, with a small breathing margin —
 *  the same hand-tuning rule the authored examples follow. */
function skinParams(
  s: SceneSpec,
  template: WorldTemplate | undefined
): Record<string, unknown> {
  const envelope = template?.stations[s.station]?.envelope;
  if (!envelope) return {};
  return {
    width: Math.max(2, round1(envelope.width - 0.4)),
    height: Math.max(1.5, round1(envelope.height - 0.4)),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
