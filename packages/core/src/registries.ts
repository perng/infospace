import type {
  CameraIntentSpec,
  ContentPrimitive,
  SkinKind,
} from "@spatial-present/schema";

/**
 * The registries: the menu of names a document (or an AI generator) may
 * reference. Capability data lives here, in the compiler's reach, so the
 * CLI stays free of React; the components that *render* each skin kind are
 * bound separately in @spatial-present/skins, and world components are
 * injected into the renderer by the host app.
 */

export type ContentKind = ContentPrimitive["kind"];

export interface SkinCapability {
  /** Content kinds this skin can render. */
  accepts: ContentKind[];
  /** For chart content: which chart types the skin can take. */
  chartTypes?: ("bar" | "scatter")[];
  description: string;
}

export const skinCapabilities: Record<SkinKind, SkinCapability> = {
  engraving: {
    accepts: ["text"],
    description: "text carved into a lit stone tablet",
  },
  cloudText: {
    accepts: ["text"],
    description: "a quote drifting as luminous text in a particle nebula",
  },
  hologram: {
    accepts: ["chart"],
    chartTypes: ["bar"],
    description: "a glowing volumetric bar chart on a floor emitter",
  },
  constellation: {
    accepts: ["chart"],
    chartTypes: ["scatter"],
    description: "scatter data as linked stars in a dark dome",
  },
  plaque: {
    accepts: ["image", "video"],
    description: "a framed image or film on a gallery wall",
  },
  chalkboard: {
    accepts: ["formula", "text"],
    description:
      "chalk strokes on a slate board; formulas write themselves on reveal",
  },
  etchedGlass: {
    accepts: ["formula"],
    description: "a formula etched into a lit glass slab, glowing",
  },
};

/** Default skin per content kind, used when a binding omits skinKind. */
export const defaultSkinFor: Record<ContentKind, SkinKind> = {
  text: "engraving",
  chart: "hologram",
  image: "plaque",
  video: "plaque",
  formula: "chalkboard",
};

/**
 * Built-in camera intents — the core framing vocabulary. World templates
 * may override or extend these. Parameters were fitted against the
 * hand-tuned cinematography of the reference journeys.
 */
export const builtinCameraIntents: Record<string, CameraIntentSpec> = {
  /** Square-on, close enough to read body text comfortably. */
  "read-close": { padding: 1.7, fov: 52, lift: -0.04, targetDrop: 0.3 },
  /** Steps back and looks past the content into the world behind it. */
  "wide-establishing": { padding: 2.1, fov: 58, lift: 0.05, targetPush: 1.5 },
  /** Off-axis three-quarter view for charts and objects. */
  "orbit-focus": { padding: 1.9, fov: 55, azimuth: 0.32, lift: 0.15 },
  /** From low ground, gazing up at content overhead. */
  "sky-gaze": { padding: 2.3, fov: 60, lift: -0.38 },
  /** Slightly below floating text, looking up at it. */
  "quote-gaze": { padding: 1.8, fov: 55, lift: -0.2 },
};
