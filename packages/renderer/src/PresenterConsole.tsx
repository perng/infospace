import { useEffect, useState } from "react";
import type { PresentationStore } from "@spatial-present/core";
import { nextEdges } from "@spatial-present/core";
import type { RouteEdge } from "@spatial-present/schema";

const KIND_LABEL: Record<RouteEdge["kind"], string> = {
  primary: "Next",
  portal: "Portal",
  branch: "Branch",
  return: "Return",
};

/** Bottom presenter panel: where am I, what's next, notes, overrides. */
export function PresenterConsole({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const currentBeatId = store((s) => s.currentBeatId);
  const manualCamera = store((s) => s.manualCamera);
  const notesOpen = store((s) => s.notesOpen);
  const transition = store((s) => s.transition);
  const history = store((s) => s.history);

  const beat = index.beatById.get(currentBeatId)!;
  const anchor = index.anchorById.get(beat.anchorId)!;
  const world = index.project.worlds.find((w) => w.id === anchor.worldId)!;
  const edges = nextEdges(index, currentBeatId);
  const beatNumber = index.outlineOrder.findIndex((b) => b.id === beat.id) + 1;

  return (
    <div className="console">
      <div className="console-current">
        <div className="console-kicker">
          <span
            className="world-chip"
            style={
              world.ambience.accent
                ? {
                    color: world.ambience.accent,
                    background: `color-mix(in srgb, ${world.ambience.accent} 14%, transparent)`,
                  }
                : undefined
            }
          >
            {world.name}
          </span>
          <span className="beat-count">
            beat {beatNumber} / {index.outlineOrder.length}
          </span>
          {transition && <span className="moving">moving…</span>}
          {manualCamera && (
            <button
              className="btn btn-warn"
              onClick={() => store.getState().returnToRoute()}
            >
              ⟲ Return to route (Esc)
            </button>
          )}
        </div>
        <h2 className="beat-title">{beat.title}</h2>
        <div className="beat-anchor">{anchor.name}</div>
        {notesOpen && beat.notes && <p className="notes">{beat.notes}</p>}
      </div>

      <div className="console-next">
        <button
          className="btn"
          disabled={!history.length}
          onClick={() => store.getState().goBack()}
          title="Back (←)"
        >
          ← Back
        </button>
        {edges.map((edge) => {
          const target = index.beatById.get(edge.to)!;
          return (
            <button
              key={edge.id}
              className={`btn edge-${edge.kind}`}
              onClick={() => store.getState().goToBeat(edge.to, edge)}
            >
              <span className="edge-kind">{KIND_LABEL[edge.kind]}</span>
              {edge.label ?? target.title}
              {(edge.kind === "primary" || edge.kind === "portal") && " →"}
            </button>
          );
        })}
        {!edges.length && <span className="route-end">end of route</span>}
      </div>
    </div>
  );
}

export function TopBar({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const outlineOpen = store((s) => s.outlineOpen);
  const notesOpen = store((s) => s.notesOpen);
  const narrationOn = store((s) => s.narrationOn);

  return (
    <div className="topbar">
      <div className="topbar-title">{index.project.title}</div>
      <div className="topbar-tools">
        <Timer store={store} />
        <button
          className="btn"
          onClick={() => store.getState().setPaletteOpen(true)}
          title="Search beats (K)"
        >
          ⌕ Jump
        </button>
        <button
          className={`btn ${narrationOn ? "btn-on" : ""}`}
          onClick={() => store.getState().setNarrationOn(!narrationOn)}
          title="Narrated tour: clips, captions, auto-advance (V)"
        >
          ♪ Voice
        </button>
        <button
          className={`btn ${notesOpen ? "btn-on" : ""}`}
          onClick={() => store.getState().setNotesOpen(!notesOpen)}
          title="Speaker notes (N)"
        >
          Notes
        </button>
        <button
          className={`btn ${outlineOpen ? "btn-on" : ""}`}
          onClick={() => store.getState().setOutlineOpen(!outlineOpen)}
          title="Linear outline (O)"
        >
          Outline
        </button>
      </div>
    </div>
  );
}

function Timer({ store }: { store: PresentationStore }) {
  const startedAtMs = store((s) => s.startedAtMs);
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return <span className="timer">{mm}:{ss}</span>;
}
