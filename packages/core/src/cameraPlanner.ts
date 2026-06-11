import type {
  AuthoredProject,
  CameraIntentSpec,
  CameraPose,
  Envelope,
  ResolvedAnchor,
  ResolvedBeat,
  ResolvedRouteEdge,
  RouteEdge,
  Vec3,
  WorldTemplate,
} from "@spatial-present/schema";
import { builtinCameraIntents } from "./registries";

/** Planning aspect ratio: conservative (narrower than most screens) so
 *  content framed for it still fits wider viewports. */
const PLAN_ASPECT = 1.6;
const DEFAULT_FOV = 52;
const DEFAULT_ENVELOPE: Envelope = { width: 4, height: 3, centerY: 0 };

/**
 * The camera planner: converts a named intent plus the focused anchor's
 * content envelope into a concrete pose. The camera sits along the
 * anchor's facing direction (offset by the intent's azimuth) at the
 * distance where the envelope fits the view, scaled by the intent's
 * padding. Explicit poses pass through untouched.
 */
export function planCameras(
  doc: AuthoredProject,
  anchors: ResolvedAnchor[],
  envelopes: Map<string, Envelope>,
  templates: Map<string, WorldTemplate>,
  routes: RouteEdge[]
): {
  beats: ResolvedBeat[];
  routes: ResolvedRouteEdge[];
  errors: string[];
} {
  const errors: string[] = [];
  const anchorById = new Map(anchors.map((a) => [a.id, a]));
  const beats: ResolvedBeat[] = [];

  // Envelopes for raw-position anchors: fall back to the skin binding's
  // size params (every built-in skin takes width/height), then a default.
  const envelopeFor = (anchorId: string): Envelope => {
    const fromStation = envelopes.get(anchorId);
    if (fromStation) return fromStation;
    const binding = doc.skins.find((s) => s.anchorId === anchorId);
    const params = binding?.params as
      | { width?: number; height?: number }
      | undefined;
    // Holograms float their content above a floor-level base.
    const centerY = binding?.skinKind === "hologram" ? 1.7 : 0;
    return {
      width: params?.width ?? DEFAULT_ENVELOPE.width,
      height: params?.height ?? DEFAULT_ENVELOPE.height,
      centerY,
    };
  };

  for (const beat of doc.beats) {
    if (beat.cameraIntent && beat.camera) {
      errors.push(
        `beat "${beat.id}" gives both a camera intent and an explicit pose — pick one`
      );
      continue;
    }
    if (beat.camera) {
      beats.push({ ...beat, camera: beat.camera });
      continue;
    }
    if (!beat.cameraIntent) {
      errors.push(`beat "${beat.id}" needs either a cameraIntent or a camera`);
      continue;
    }
    const anchor = anchorById.get(beat.anchorId);
    if (!anchor) continue; // validateGraph reports the broken reference
    const template = templates.get(anchor.worldId);

    // A template pose name resolves to a fixed framing; otherwise the name
    // is an intent (template intents shadow the built-in table).
    const fixed = template?.poses?.[beat.cameraIntent];
    if (fixed) {
      beats.push({ ...beat, camera: fixed });
      continue;
    }
    const intent =
      template?.cameraIntents?.[beat.cameraIntent] ??
      builtinCameraIntents[beat.cameraIntent];
    if (!intent) {
      errors.push(
        `beat "${beat.id}" references unknown camera intent "${beat.cameraIntent}" (built-in: ${Object.keys(builtinCameraIntents).join(", ")})`
      );
      continue;
    }
    beats.push({
      ...beat,
      camera: frame(anchor, envelopeFor(anchor.id), intent),
    });
  }

  // Resolve named portal poses against the relevant world's template
  // (dive happens in the source world, emerge in the target world).
  const beatWorld = (beatId: string): string | undefined =>
    anchorById.get(doc.beats.find((b) => b.id === beatId)?.anchorId ?? "")
      ?.worldId;
  const resolvePose = (
    edgeId: string,
    role: "divePose" | "emergePose",
    value: CameraPose | string | undefined,
    worldId: string | undefined
  ): CameraPose | undefined => {
    if (typeof value !== "string") return value;
    const pose = worldId ? templates.get(worldId)?.poses?.[value] : undefined;
    if (!pose) {
      errors.push(
        `route "${edgeId}" references unknown ${role} "${value}" in world "${worldId ?? "?"}"`
      );
      return undefined;
    }
    return pose;
  };
  const resolvedRoutes: ResolvedRouteEdge[] = routes.map((e) => ({
    ...e,
    divePose: resolvePose(e.id, "divePose", e.divePose, beatWorld(e.from)),
    emergePose: resolvePose(e.id, "emergePose", e.emergePose, beatWorld(e.to)),
  }));

  return { beats, routes: resolvedRoutes, errors };
}

/** Compute the pose: fit the envelope in view, then apply the intent. */
function frame(
  anchor: ResolvedAnchor,
  envelope: Envelope,
  intent: CameraIntentSpec
): CameraPose {
  const fov = intent.fov ?? DEFAULT_FOV;
  const halfTan = Math.tan(((fov / 2) * Math.PI) / 180);
  const fitH = envelope.height / 2 / halfTan;
  const fitW = envelope.width / 2 / (halfTan * PLAN_ASPECT);
  const distance =
    Math.max(fitH, fitW, intent.minDistance ?? 2) * intent.padding;

  const yaw = anchor.rotationY + (intent.azimuth ?? 0);
  const dir: Vec3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const center: Vec3 = [
    anchor.position[0],
    anchor.position[1] + (envelope.centerY ?? 0),
    anchor.position[2],
  ];
  const position: Vec3 = [
    center[0] + dir[0] * distance,
    center[1] + (intent.lift ?? 0) * distance,
    center[2] + dir[2] * distance,
  ];
  const push = (intent.targetPush ?? 0) * distance;
  const target: Vec3 = push
    ? [center[0] - dir[0] * push, center[1], center[2] - dir[2] * push]
    : [center[0], center[1] - (intent.targetDrop ?? 0), center[2]];
  return { position, target, fov };
}

/**
 * Auto-routing: default the primary chain from beat order. A beat without
 * an explicit primary or portal egress flows to the next beat in document
 * order; its `arrive` hint picks the transition. Authors only write
 * branches, returns, and portals.
 */
export function autoRoute(doc: AuthoredProject): RouteEdge[] {
  const explicit = doc.routes;
  const hasEgress = new Set(
    explicit
      .filter((e) => e.kind === "primary" || e.kind === "portal")
      .map((e) => e.from)
  );
  const generated: RouteEdge[] = [];
  for (let i = 0; i < doc.beats.length - 1; i++) {
    const from = doc.beats[i];
    const to = doc.beats[i + 1];
    if (hasEgress.has(from.id)) continue;
    generated.push({
      id: `r-auto-${from.id}`,
      from: from.id,
      to: to.id,
      kind: "primary",
      transition: to.arrive ?? "fly",
    });
  }
  return [...explicit, ...generated];
}
