import type {
  Anchor,
  Beat,
  ContentPrimitive,
  PresentationProject,
  RouteEdge,
  SkinBinding,
} from "@spatial-present/schema";

/** Precomputed lookups over a validated project document. */
export interface ProjectIndex {
  project: PresentationProject;
  beatById: Map<string, Beat>;
  anchorById: Map<string, Anchor>;
  contentById: Map<string, ContentPrimitive>;
  bindingsByAnchor: Map<string, SkinBinding[]>;
  edgesFrom: Map<string, RouteEdge[]>;
  edgesTo: Map<string, RouteEdge[]>;
  /** Linearized beat order for the outline fallback (primary path first). */
  outlineOrder: Beat[];
}

export function buildIndex(project: PresentationProject): ProjectIndex {
  const beatById = new Map(project.beats.map((b) => [b.id, b]));
  const anchorById = new Map(project.anchors.map((a) => [a.id, a]));
  const contentById = new Map(project.content.map((c) => [c.id, c]));

  const bindingsByAnchor = new Map<string, SkinBinding[]>();
  for (const s of project.skins) {
    const list = bindingsByAnchor.get(s.anchorId) ?? [];
    list.push(s);
    bindingsByAnchor.set(s.anchorId, list);
  }

  const edgesFrom = new Map<string, RouteEdge[]>();
  const edgesTo = new Map<string, RouteEdge[]>();
  for (const e of project.routes) {
    edgesFrom.set(e.from, [...(edgesFrom.get(e.from) ?? []), e]);
    edgesTo.set(e.to, [...(edgesTo.get(e.to) ?? []), e]);
  }

  return {
    project,
    beatById,
    anchorById,
    contentById,
    bindingsByAnchor,
    edgesFrom,
    edgesTo,
    outlineOrder: linearize(project, edgesFrom),
  };
}

/**
 * Derive a linear reading order: walk primary edges from the start beat,
 * then visit branch targets depth-first, then anything unreachable.
 * This drives the accessibility outline — a derived view, never the source.
 */
function linearize(
  project: PresentationProject,
  edgesFrom: Map<string, RouteEdge[]>
): Beat[] {
  const beatById = new Map(project.beats.map((b) => [b.id, b]));
  const visited = new Set<string>();
  const order: Beat[] = [];

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    const beat = beatById.get(id);
    if (beat) order.push(beat);
    const out = edgesFrom.get(id) ?? [];
    const ranked = [...out].sort((a, b) => rank(a) - rank(b));
    for (const e of ranked) visit(e.to);
  };

  visit(project.startBeatId);
  for (const b of project.beats) visit(b.id);
  return order;
}

function rank(e: RouteEdge): number {
  switch (e.kind) {
    case "primary":
      return 0;
    case "portal":
      return 1;
    case "branch":
      return 2;
    case "return":
      return 3;
  }
}

/** The presenter's recommended next steps from a beat. */
export function nextEdges(index: ProjectIndex, beatId: string): RouteEdge[] {
  return [...(index.edgesFrom.get(beatId) ?? [])].sort(
    (a, b) => rank(a) - rank(b)
  );
}

export function primaryNext(
  index: ProjectIndex,
  beatId: string
): RouteEdge | undefined {
  return nextEdges(index, beatId).find(
    (e) => e.kind === "primary" || e.kind === "portal"
  );
}

export interface SearchHit {
  beat: Beat;
  anchor: Anchor;
  matchedOn: string;
}

export function searchBeats(index: ProjectIndex, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const beat of index.project.beats) {
    const anchor = index.anchorById.get(beat.anchorId);
    if (!anchor) continue;
    const haystacks = [
      beat.title,
      anchor.name,
      beat.notes ?? "",
      ...anchor.contentIds.map((cid) => {
        const c = index.contentById.get(cid);
        if (!c) return "";
        if (c.kind === "text") return `${c.title ?? ""} ${c.body}`;
        if (c.kind === "chart") return c.fallbackText;
        return c.alt;
      }),
    ];
    const matched = haystacks.find((h) => h.toLowerCase().includes(q));
    if (matched) hits.push({ beat, anchor, matchedOn: matched.slice(0, 80) });
  }
  return hits;
}

/** Structural validation beyond the zod schema: referential integrity. */
export function validateGraph(project: PresentationProject): string[] {
  const errors: string[] = [];
  const worldIds = new Set(project.worlds.map((w) => w.id));
  const anchorIds = new Set(project.anchors.map((a) => a.id));
  const beatIds = new Set(project.beats.map((b) => b.id));
  const contentIds = new Set(project.content.map((c) => c.id));

  for (const a of project.anchors) {
    if (!worldIds.has(a.worldId))
      errors.push(`anchor "${a.id}" references unknown world "${a.worldId}"`);
    for (const cid of a.contentIds)
      if (!contentIds.has(cid))
        errors.push(`anchor "${a.id}" references unknown content "${cid}"`);
  }
  for (const b of project.beats)
    if (!anchorIds.has(b.anchorId))
      errors.push(`beat "${b.id}" references unknown anchor "${b.anchorId}"`);
  for (const e of project.routes) {
    if (!beatIds.has(e.from))
      errors.push(`route "${e.id}" references unknown beat "${e.from}"`);
    if (!beatIds.has(e.to))
      errors.push(`route "${e.id}" references unknown beat "${e.to}"`);
  }
  for (const s of project.skins) {
    if (!contentIds.has(s.contentId))
      errors.push(`skin "${s.id}" references unknown content "${s.contentId}"`);
    if (!anchorIds.has(s.anchorId))
      errors.push(`skin "${s.id}" references unknown anchor "${s.anchorId}"`);
  }
  if (!beatIds.has(project.startBeatId))
    errors.push(`startBeatId "${project.startBeatId}" is not a beat`);

  // Reachability from the start beat.
  const edgesFrom = new Map<string, RouteEdge[]>();
  for (const e of project.routes)
    edgesFrom.set(e.from, [...(edgesFrom.get(e.from) ?? []), e]);
  const reachable = new Set<string>();
  const stack = [project.startBeatId];
  while (stack.length) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const e of edgesFrom.get(id) ?? []) stack.push(e.to);
  }
  for (const b of project.beats)
    if (!reachable.has(b.id))
      errors.push(`beat "${b.id}" is unreachable from the start beat`);

  return errors;
}
