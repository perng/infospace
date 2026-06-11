import { z } from "zod";

/**
 * Project document schema — the single source of truth shared by the
 * code-first SDK, the (future) visual editor, and AI generation.
 * Binary assets are referenced by URL, never embedded.
 */

export const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof vec3Schema>;

export const cameraPoseSchema = z.object({
  position: vec3Schema,
  target: vec3Schema,
  fov: z.number().min(10).max(120).optional(),
});
export type CameraPose = z.infer<typeof cameraPoseSchema>;

/**
 * The content envelope of a station: the footprint content may occupy
 * there. The camera planner frames this box, so it should include any
 * margin the skin adds around the raw content.
 */
export const envelopeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  /** Vertical offset of the content's center above the station origin
   *  (e.g. holograms float above a floor-level base). */
  centerY: z.number().optional(),
});
export type Envelope = z.infer<typeof envelopeSchema>;

/**
 * A named content slot published by a world template. Documents reference
 * stations symbolically ("west-wall.bay-1"); the layout solver owns the
 * geometry. One anchor per station — double-booking is a compile error.
 */
export const stationSchema = z.object({
  position: vec3Schema,
  rotationY: z.number().optional(),
  envelope: envelopeSchema,
});
export type Station = z.infer<typeof stationSchema>;

/**
 * Parameters of a named camera framing. The planner combines an intent
 * with the focused station's envelope to compute a concrete CameraPose:
 * the camera sits along the station's facing direction at a distance that
 * fits the envelope in view, scaled by `padding`.
 */
export interface CameraIntentSpec {
  /** Multiplier on the fit distance (1 = envelope exactly fills the view). */
  padding: number;
  fov?: number;
  /** Horizontal angle off the station's facing direction, radians. */
  azimuth?: number;
  /** Camera height offset as a fraction of the camera distance. */
  lift?: number;
  /** Drop the look-at target below the content center (world units). */
  targetDrop?: number;
  /** Push the target past the content center, as a fraction of distance —
   *  frames the content against the world behind it. */
  targetPush?: number;
  minDistance?: number;
}

/**
 * A world template: the symbolic vocabulary a world publishes to documents
 * and to AI — stations to place content, camera intents to frame it, and
 * named fixed poses (portal dives, special approaches). Templates are code,
 * not document data, so this is a plain interface.
 */
export interface WorldTemplate {
  id: string;
  stations: Record<string, Station>;
  /** World-specific additions/overrides to the built-in intent table. */
  cameraIntents?: Record<string, CameraIntentSpec>;
  /** Named fixed framings, referenced by beats and portal routes. */
  poses?: Record<string, CameraPose>;
}

export const worldSchema = z.object({
  id: z.string(),
  name: z.string(),
  unitScale: z.enum(["macro", "human", "object", "micro"]),
  ambience: z.object({
    background: z.string(),
    fogColor: z.string().optional(),
    fogNear: z.number().optional(),
    fogFar: z.number().optional(),
    /** UI accent for this world (minimap nodes, world chip). */
    accent: z.string().optional(),
  }),
});
export type World = z.infer<typeof worldSchema>;

export const anchorSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  name: z.string(),
  /** Symbolic slot in the world template, e.g. "west-wall.bay-1". The
   *  layout solver resolves it; raw position is the escape hatch. Exactly
   *  one of `station` / `position` must be given when authoring. */
  station: z.string().optional(),
  position: vec3Schema.optional(),
  rotationY: z.number().optional(),
  semanticRole: z.enum([
    "chapter",
    "detail",
    "chart",
    "quote",
    "media",
    "portal",
  ]),
  contentIds: z.array(z.string()),
});
export type Anchor = z.infer<typeof anchorSchema>;

/** An anchor after the layout solver ran: geometry resolved, symbolic
 *  source kept as provenance so the document stays re-flowable. */
export const resolvedAnchorSchema = anchorSchema.extend({
  position: vec3Schema,
  rotationY: z.number(),
});
export type ResolvedAnchor = z.infer<typeof resolvedAnchorSchema>;

const barChartData = z.object({
  type: z.literal("bar"),
  title: z.string(),
  unit: z.string().optional(),
  logScale: z.boolean().optional(),
  series: z.array(z.object({ label: z.string(), value: z.number() })),
});

const scatterChartData = z.object({
  type: z.literal("scatter"),
  title: z.string(),
  xLabel: z.string(),
  yLabel: z.string(),
  points: z.array(
    z.object({ x: z.number(), y: z.number(), label: z.string() })
  ),
});

export const chartDataSchema = z.discriminatedUnion("type", [
  barChartData,
  scatterChartData,
]);
export type ChartData = z.infer<typeof chartDataSchema>;

export const contentPrimitiveSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string(),
    kind: z.literal("text"),
    title: z.string().optional(),
    body: z.string(),
    fallbackText: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("chart"),
    data: chartDataSchema,
    fallbackText: z.string(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("image"),
    src: z.string(),
    title: z.string().optional(),
    /** One-line wall label shown in-world beneath the frame. */
    caption: z.string().optional(),
    alt: z.string(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("video"),
    src: z.string(),
    title: z.string().optional(),
    caption: z.string().optional(),
    alt: z.string(),
  }),
  z.object({
    id: z.string(),
    kind: z.literal("formula"),
    /** LaTeX source — the semantic truth of the equation. The 3D glyphs,
     *  the outline rendering, and any export all derive from it. */
    latex: z.string(),
    display: z.enum(["block", "inline"]).default("block"),
    numbered: z.boolean().optional(),
    /** Spoken-math description for the outline and screen readers,
     *  e.g. "e to the i pi plus one equals zero". */
    fallbackText: z.string(),
  }),
]);
export type ContentPrimitive = z.infer<typeof contentPrimitiveSchema>;

export const skinKindSchema = z.enum([
  "engraving", // text carved into stone
  "hologram", // glowing volumetric chart / glass panel
  "constellation", // scatter data as stars in a dark dome
  "cloudText", // quote as drifting luminous text
  "plaque", // framed image / film on a gallery wall
  "chalkboard", // formula or text as chalk strokes on slate
  "etchedGlass", // formula etched into a lit glass slab
]);
export type SkinKind = z.infer<typeof skinKindSchema>;

export const skinBindingSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  anchorId: z.string(),
  /** Omit to let the skin resolver pick the content kind's default skin. */
  skinKind: skinKindSchema.optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});
export type SkinBinding = z.infer<typeof skinBindingSchema>;

export const resolvedSkinBindingSchema = skinBindingSchema.extend({
  skinKind: skinKindSchema,
});
export type ResolvedSkinBinding = z.infer<typeof resolvedSkinBindingSchema>;

export const narrationSchema = z.object({
  /** The semantic source. Captions, transcripts, and audio derive from it. */
  script: z.string(),
  /** Advance along the primary route when the clip ends (default true). */
  autoAdvance: z.boolean().optional(),
});
export type Narration = z.infer<typeof narrationSchema>;

/**
 * Where the asset pipeline puts a beat's rendered narration clip. The audio
 * file is a derived asset (regenerate with scripts/generate-narration.py);
 * the script in the document is the source of truth.
 */
export function narrationAudioSrc(beatId: string): string {
  return `/assets/narration/${beatId}.mp3`;
}

export const transitionKindSchema = z.enum(["cut", "dolly", "fly", "portal"]);
export type TransitionKind = z.infer<typeof transitionKindSchema>;

export const beatSchema = z.object({
  id: z.string(),
  anchorId: z.string(),
  title: z.string(),
  /** Named framing — a built-in/template camera intent ("read-close") or a
   *  template pose name ("prism-approach"). The camera planner resolves it;
   *  an explicit pose is the escape hatch. Exactly one of `cameraIntent` /
   *  `camera` must be given when authoring. */
  cameraIntent: z.string().optional(),
  camera: cameraPoseSchema.optional(),
  /** How the auto-routed primary edge arrives at this beat (default fly). */
  arrive: transitionKindSchema.exclude(["portal"]).optional(),
  notes: z.string().optional(),
  narration: narrationSchema.optional(),
  durationHintMs: z.number().optional(),
});
export type Beat = z.infer<typeof beatSchema>;

/** A beat after the camera planner ran: pose resolved, intent kept. */
export const resolvedBeatSchema = beatSchema.extend({
  camera: cameraPoseSchema,
});
export type ResolvedBeat = z.infer<typeof resolvedBeatSchema>;

export const routeEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  kind: z.enum(["primary", "branch", "return", "portal"]),
  label: z.string().optional(),
  transition: transitionKindSchema,
  /** Cinematic poses hiding a portal's world swap. Either an explicit pose
   *  or the name of a pose published by the relevant world template
   *  (dive: the source world; emerge: the target world). */
  divePose: z.union([cameraPoseSchema, z.string()]).optional(),
  emergePose: z.union([cameraPoseSchema, z.string()]).optional(),
});
export type RouteEdge = z.infer<typeof routeEdgeSchema>;

export const resolvedRouteEdgeSchema = routeEdgeSchema.extend({
  divePose: cameraPoseSchema.optional(),
  emergePose: cameraPoseSchema.optional(),
});
export type ResolvedRouteEdge = z.infer<typeof resolvedRouteEdgeSchema>;

/**
 * The authored document — what the SDK, the visual editor, and AI emit.
 * May be positionless: stations instead of positions, intents instead of
 * poses, and only the non-primary routes (the compiler defaults the
 * primary chain from beat order).
 */
export const authoredProjectSchema = z.object({
  schemaVersion: z.literal("0.1"),
  id: z.string(),
  title: z.string(),
  startBeatId: z.string(),
  worlds: z.array(worldSchema).min(1),
  anchors: z.array(anchorSchema),
  beats: z.array(beatSchema),
  routes: z.array(routeEdgeSchema).default([]),
  content: z.array(contentPrimitiveSchema),
  skins: z.array(skinBindingSchema),
});
export type AuthoredProject = z.infer<typeof authoredProjectSchema>;
export type AuthoredProjectInput = z.input<typeof authoredProjectSchema>;

/**
 * The canonical document — fully resolved geometry plus the symbolic
 * source it came from. This is what the runtime renders and what the
 * outline and narration jobs derive from.
 */
export const projectSchema = authoredProjectSchema.extend({
  anchors: z.array(resolvedAnchorSchema),
  beats: z.array(resolvedBeatSchema),
  routes: z.array(resolvedRouteEdgeSchema),
  skins: z.array(resolvedSkinBindingSchema),
});
export type PresentationProject = z.infer<typeof projectSchema>;
