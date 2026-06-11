import { useMemo } from "react";
import type { PresentationStore } from "@spatial-present/core";

/**
 * Route-graph minimap. The outline order forms the vertical spine; every
 * edge is drawn as a curve, so branches and shortcuts read as arcs that
 * skip ahead or loop back. Click any node to jump.
 */
export function Minimap({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const currentBeatId = store((s) => s.currentBeatId);

  const layout = useMemo(() => {
    const ROW = 26;
    const X = 22;
    const nodes = index.outlineOrder.map((beat, i) => ({
      beat,
      x: X,
      y: 18 + i * ROW,
    }));
    const byId = new Map(nodes.map((n) => [n.beat.id, n]));
    const edges = index.project.routes.map((edge) => {
      const a = byId.get(edge.from)!;
      const b = byId.get(edge.to)!;
      const span = Math.abs(a.y - b.y);
      const adjacent = span <= ROW + 1;
      const bow = adjacent ? 0 : Math.min(14 + span * 0.12, 42);
      return { edge, a, b, bow };
    });
    return { nodes, edges, height: 18 + nodes.length * ROW };
  }, [index]);

  return (
    <div className="minimap">
      <div className="minimap-head">Route</div>
      <svg width={190} height={layout.height}>
        {layout.edges.map(({ edge, a, b, bow }) => (
          <path
            key={edge.id}
            d={
              bow === 0
                ? `M ${a.x} ${a.y} L ${b.x} ${b.y}`
                : `M ${a.x} ${a.y} Q ${a.x + bow} ${(a.y + b.y) / 2} ${b.x} ${b.y}`
            }
            className={`map-edge map-edge-${edge.kind}`}
            fill="none"
          />
        ))}
        {layout.nodes.map(({ beat, x, y }) => {
          const anchor = index.anchorById.get(beat.anchorId)!;
          const world = index.project.worlds.find((w) => w.id === anchor.worldId);
          const active = beat.id === currentBeatId;
          return (
            <g
              key={beat.id}
              className="map-node"
              onClick={() => store.getState().goToBeat(beat.id)}
            >
              <circle
                cx={x}
                cy={y}
                r={active ? 7 : 4.5}
                className={`map-dot ${active ? "map-dot-active" : ""}`}
                style={
                  !active && world?.ambience.accent
                    ? { fill: world.ambience.accent }
                    : undefined
                }
              />
              <text x={x + 14} y={y + 4} className={active ? "map-label-active" : "map-label"}>
                {beat.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
