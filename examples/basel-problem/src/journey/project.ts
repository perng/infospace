import { defineJourney } from "@spatial-present/core";
import type { AuthoredProjectInput } from "@spatial-present/schema";
import { LectureHallTemplate, MathVoidTemplate } from "@spatial-present/worlds";
import doc from "./document.json";

/**
 * This journey was AI-generated: brief.md (Layer A) → talk.spec.yaml
 * (Layer B, the editable artifact) → document.json (the compiled authored
 * document — still positionless). Regenerate with `npm run generate:regen`
 * (locked scenes survive) or recompile an edited spec with
 * `npm run spec:compile`. Provenance lives in talk.provenance.json.
 */
export const journey = defineJourney(doc as AuthoredProjectInput, {
  templates: [LectureHallTemplate, MathVoidTemplate],
});
