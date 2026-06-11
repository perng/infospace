import { projectSchema, type PresentationProject } from "@spatial-present/schema";
import { buildIndex, validateGraph, type ProjectIndex } from "./routeGraph";

/**
 * Code-first entry point. Validates the document against the schema and
 * the graph rules, then returns the indexed project the runtime consumes.
 * AI generation and the visual editor produce the same document shape.
 */
export function defineJourney(doc: PresentationProject): ProjectIndex {
  const parsed = projectSchema.parse(doc);
  const errors = validateGraph(parsed);
  if (errors.length) {
    throw new Error(
      `Journey "${parsed.title}" failed validation:\n` +
        errors.map((e) => `  - ${e}`).join("\n")
    );
  }
  return buildIndex(parsed);
}
