import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import {
  createPresentationStore,
  type ProjectIndex,
} from "@spatial-present/core";
import { fetchManimManifest } from "@spatial-present/skins";
import { Stage, type WorldComponents } from "./Stage";
import { PresenterConsole, TopBar } from "./PresenterConsole";
import { Minimap } from "./Minimap";
import { CommandPalette } from "./CommandPalette";
import { OutlineView } from "./OutlineView";
import { Narrator } from "./Narrator";
import "./styles.css";

/**
 * The complete runtime shell. The host app provides the validated journey
 * (defineJourney output) and a component per world id; everything else —
 * presenter console, minimap, palette, outline, narration — derives from
 * the document.
 */
export function PresentationApp({
  journey,
  worlds,
}: {
  journey: ProjectIndex;
  worlds: WorldComponents;
}) {
  const store = useMemo(() => createPresentationStore(journey), [journey]);
  const fadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    for (const world of journey.project.worlds) {
      if (!worlds[world.id])
        console.warn(
          `PresentationApp: no world component provided for world id "${world.id}"`
        );
    }
  }, [journey, worlds]);

  // Clip timings (cuepoints) for stepwise reveal — derived assets, loaded
  // beside the document, never part of it.
  useEffect(() => {
    if (!journey.project.content.some((c) => c.kind === "manim")) return;
    let cancelled = false;
    void fetchManimManifest().then((manifest) => {
      if (!cancelled) store.getState().setManimTimings(manifest);
    });
    return () => {
      cancelled = true;
    };
  }, [journey, store]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = store.getState();
      if (state.paletteOpen) return; // palette handles its own keys
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        state.setPaletteOpen(true);
        return;
      }
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          state.advance();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          state.goBack();
          break;
        case "Escape":
          if (state.outlineOpen) state.setOutlineOpen(false);
          else if (state.manualCamera) state.returnToRoute();
          break;
        case "o":
        case "O":
          state.setOutlineOpen(!state.outlineOpen);
          break;
        case "n":
        case "N":
          state.setNotesOpen(!state.notesOpen);
          break;
        case "v":
        case "V":
          state.setNarrationOn(!state.narrationOn);
          break;
        case "k":
        case "K":
        case "/":
          e.preventDefault();
          state.setPaletteOpen(true);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);

  return (
    <div className="shell">
      <Canvas
        shadows
        camera={{ position: [0, 2.1, 29.5], fov: 55, near: 0.1, far: 800 }}
        gl={{ antialias: true }}
        onCreated={(state) => {
          // Dev-only escape hatch: lets headless test drivers pump frames
          // (state.advance) when the tab is hidden and rAF never fires.
          if (import.meta.env?.DEV)
            (window as unknown as Record<string, unknown>).__spatialPresent = state;
        }}
      >
        <Stage store={store} worlds={worlds} fadeRef={fadeRef} />
      </Canvas>

      {/* portal fade layer, driven imperatively by the camera rig */}
      <div ref={fadeRef} className="portal-fade" />

      <TopBar store={store} />
      <Minimap store={store} />
      <PresenterConsole store={store} />
      <CommandPalette store={store} />
      <OutlineView store={store} />
      <Narrator store={store} />
    </div>
  );
}
