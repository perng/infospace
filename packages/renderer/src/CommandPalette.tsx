import { useState } from "react";
import type { PresentationStore } from "@spatial-present/core";
import { searchBeats } from "@spatial-present/core";

/** Search-and-jump palette: find any beat by title, anchor, notes or content. */
export function CommandPalette({ store }: { store: PresentationStore }) {
  const open = store((s) => s.paletteOpen);
  if (!open) return null;
  return <PaletteDialog store={store} />;
}

/** Mounted fresh each time the palette opens, so query state starts clean. */
function PaletteDialog({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const hits = query
    ? searchBeats(index, query)
    : index.outlineOrder.map((beat) => ({
        beat,
        anchor: index.anchorById.get(beat.anchorId)!,
        matchedOn: "",
      }));

  const jump = (beatId: string) => {
    store.getState().setPaletteOpen(false);
    store.getState().goToBeat(beatId);
  };

  return (
    <div className="palette-backdrop" onClick={() => store.getState().setPaletteOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          placeholder="Jump to a beat, anchor, or topic…"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => Math.min(s + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter" && hits[selected]) {
              jump(hits[selected].beat.id);
            } else if (e.key === "Escape") {
              store.getState().setPaletteOpen(false);
            }
            e.stopPropagation();
          }}
        />
        <div className="palette-results">
          {hits.map((hit, i) => (
            <div
              key={hit.beat.id}
              className={`palette-hit ${i === selected ? "palette-hit-selected" : ""}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => jump(hit.beat.id)}
            >
              <span className="palette-hit-title">{hit.beat.title}</span>
              <span className="palette-hit-anchor">{hit.anchor.name}</span>
            </div>
          ))}
          {!hits.length && <div className="palette-empty">No matches</div>}
        </div>
      </div>
    </div>
  );
}
