import {
  authoredProjectSchema,
  projectSchema,
  type AuthoredProjectInput,
  type WorldTemplate,
} from "@spatial-present/schema";
import { buildIndex, validateGraph, type ProjectIndex } from "./routeGraph";
import { resolveStations, resolveSkins } from "./layoutSolver";
import { planCameras, autoRoute } from "./cameraPlanner";

export interface JourneyOptions {
  /** World templates supplying the stations, camera intents, and named
   *  poses the document references. Positionless documents need them;
   *  fully resolved documents compile without. */
  templates?: WorldTemplate[];
}

/**
 * Code-first entry point and the presentation compiler. Takes an authored
 * document — which may be positionless: stations instead of coordinates,
 * camera intents instead of poses, primary routes implied by beat order —
 * and produces the canonical, fully resolved document the runtime renders.
 * The symbolic sources stay on the document as provenance, so re-running
 * the compiler against a changed template re-flows the geometry.
 *
 * AI generation and the visual editor produce the same authored shape.
 */
export function defineJourney(
  input: AuthoredProjectInput,
  options: JourneyOptions = {}
): ProjectIndex {
  const authored = authoredProjectSchema.parse(input);
  const templates = new Map((options.templates ?? []).map((t) => [t.id, t]));

  const errors: string[] = [];
  const stations = resolveStations(authored, templates);
  errors.push(...stations.errors);
  const skins = resolveSkins(authored);
  errors.push(...skins.errors);
  const routes = autoRoute(authored);
  const cameras = planCameras(
    authored,
    stations.anchors,
    stations.envelopes,
    templates,
    routes
  );
  errors.push(...cameras.errors);
  if (errors.length) {
    throw new Error(
      `Journey "${authored.title}" failed to compile:\n` +
        errors.map((e) => `  - ${e}`).join("\n")
    );
  }

  const project = projectSchema.parse({
    ...authored,
    anchors: stations.anchors,
    beats: cameras.beats,
    routes: cameras.routes,
    skins: skins.skins,
  });
  const graphErrors = validateGraph(project);
  if (graphErrors.length) {
    throw new Error(
      `Journey "${project.title}" failed validation:\n` +
        graphErrors.map((e) => `  - ${e}`).join("\n")
    );
  }
  return buildIndex(project);
}
