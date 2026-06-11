import { useEffect, useRef, useState } from "react";
import type { PresentationStore } from "../framework/store";
import { searchBeats } from "../framework/routeGraph";

/** Search-and-jump palette: find any beat by title, anchor, notes or content. */
export function CommandPalette({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const open = store((s) => s.paletteOpen);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = query
    ? searchBeats(index, query)
    : index.outlineOrder.map((beat) => ({
        beat,
        anchor: index.anchorById.get(beat.anchorId)!,
        matchedOn: "",
      }));

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const jump = (beatId: string) => {
    store.getState().setPaletteOpen(false);
    store.getState().goToBeat(beatId);
  };

  return (
    <div className="palette-backdrop" onClick={() => store.getState().setPaletteOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
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
