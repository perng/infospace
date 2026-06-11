import type {
  AuthoredProject,
  Envelope,
  ResolvedAnchor,
  ResolvedSkinBinding,
  WorldTemplate,
} from "@spatial-present/schema";
import { defaultSkinFor, skinCapabilities } from "./registries";

/**
 * The layout solver: resolves symbolic station references into anchor
 * transforms. Documents say *what goes where in the story*; templates own
 * the geometry. Raw positions remain the code-first escape hatch.
 */
export function resolveStations(
  doc: AuthoredProject,
  templates: Map<string, WorldTemplate>
): {
  anchors: ResolvedAnchor[];
  /** Station envelopes by anchor id, consumed by the camera planner. */
  envelopes: Map<string, Envelope>;
  errors: string[];
} {
  const errors: string[] = [];
  const anchors: ResolvedAnchor[] = [];
  const envelopes = new Map<string, Envelope>();
  const occupied = new Map<string, string>();

  for (const a of doc.anchors) {
    if (a.station && a.position) {
      errors.push(
        `anchor "${a.id}" gives both a station and a raw position — pick one`
      );
      continue;
    }
    if (a.station) {
      const template = templates.get(a.worldId);
      if (!template) {
        errors.push(
          `anchor "${a.id}" references station "${a.station}" but no template is registered for world "${a.worldId}"`
        );
        continue;
      }
      const station = template.stations[a.station];
      if (!station) {
        errors.push(
          `anchor "${a.id}" references unknown station "${a.station}" in world "${a.worldId}" (available: ${Object.keys(template.stations).join(", ")})`
        );
        continue;
      }
      const key = `${a.worldId}/${a.station}`;
      const holder = occupied.get(key);
      if (holder) {
        errors.push(
          `station "${a.station}" in world "${a.worldId}" is double-booked by anchors "${holder}" and "${a.id}"`
        );
        continue;
      }
      occupied.set(key, a.id);
      envelopes.set(a.id, station.envelope);
      anchors.push({
        ...a,
        position: station.position,
        rotationY: station.rotationY ?? 0,
      });
    } else if (a.position) {
      anchors.push({ ...a, position: a.position, rotationY: a.rotationY ?? 0 });
    } else {
      errors.push(`anchor "${a.id}" needs either a station or a position`);
    }
  }

  return { anchors, envelopes, errors };
}

/**
 * The skin resolver: fills omitted skin kinds with the content kind's
 * default and checks every binding against the skin's capability
 * descriptor (which content kinds — and chart types — it can render).
 */
export function resolveSkins(doc: AuthoredProject): {
  skins: ResolvedSkinBinding[];
  errors: string[];
} {
  const errors: string[] = [];
  const skins: ResolvedSkinBinding[] = [];
  const contentById = new Map(doc.content.map((c) => [c.id, c]));

  for (const binding of doc.skins) {
    const content = contentById.get(binding.contentId);
    if (!content) {
      // Referential integrity is validateGraph's job; skip here.
      continue;
    }
    const skinKind = binding.skinKind ?? defaultSkinFor[content.kind];
    const capability = skinCapabilities[skinKind];
    if (!capability.accepts.includes(content.kind)) {
      errors.push(
        `skin "${binding.id}": ${skinKind} cannot render ${content.kind} content (accepts: ${capability.accepts.join(", ")})`
      );
      continue;
    }
    if (
      content.kind === "chart" &&
      capability.chartTypes &&
      !capability.chartTypes.includes(content.data.type)
    ) {
      errors.push(
        `skin "${binding.id}": ${skinKind} cannot render a ${content.data.type} chart (takes: ${capability.chartTypes.join(", ")})`
      );
      continue;
    }
    skins.push({ ...binding, skinKind });
  }

  return { skins, errors };
}
