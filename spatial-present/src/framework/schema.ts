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

export const worldSchema = z.object({
  id: z.string(),
  name: z.string(),
  unitScale: z.enum(["macro", "human", "object", "micro"]),
  ambience: z.object({
    background: z.string(),
    fogColor: z.string().optional(),
    fogNear: z.number().optional(),
    fogFar: z.number().optional(),
  }),
});
export type World = z.infer<typeof worldSchema>;

export const anchorSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  name: z.string(),
  position: vec3Schema,
  rotationY: z.number().default(0),
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
]);
export type ContentPrimitive = z.infer<typeof contentPrimitiveSchema>;

export const skinKindSchema = z.enum([
  "engraving", // text carved into stone
  "hologram", // glowing volumetric chart / glass panel
  "constellation", // scatter data as stars in a dark dome
  "cloudText", // quote as drifting luminous text
  "plaque", // framed image / film on a museum wall
]);
export type SkinKind = z.infer<typeof skinKindSchema>;

export const skinBindingSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  anchorId: z.string(),
  skinKind: skinKindSchema,
  params: z.record(z.string(), z.unknown()).default({}),
});
export type SkinBinding = z.infer<typeof skinBindingSchema>;

export const beatSchema = z.object({
  id: z.string(),
  anchorId: z.string(),
  title: z.string(),
  camera: cameraPoseSchema,
  notes: z.string().optional(),
  durationHintMs: z.number().optional(),
});
export type Beat = z.infer<typeof beatSchema>;

export const transitionKindSchema = z.enum(["cut", "dolly", "fly", "portal"]);
export type TransitionKind = z.infer<typeof transitionKindSchema>;

export const routeEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  kind: z.enum(["primary", "branch", "return", "portal"]),
  label: z.string().optional(),
  transition: transitionKindSchema,
  /** Optional cinematic poses for portal dives (hide the world swap). */
  divePose: cameraPoseSchema.optional(),
  emergePose: cameraPoseSchema.optional(),
});
export type RouteEdge = z.infer<typeof routeEdgeSchema>;

export const projectSchema = z.object({
  schemaVersion: z.literal("0.1"),
  id: z.string(),
  title: z.string(),
  startBeatId: z.string(),
  worlds: z.array(worldSchema).min(1),
  anchors: z.array(anchorSchema),
  beats: z.array(beatSchema),
  routes: z.array(routeEdgeSchema),
  content: z.array(contentPrimitiveSchema),
  skins: z.array(skinBindingSchema),
});
export type PresentationProject = z.infer<typeof projectSchema>;
