import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { createPresentationStore } from "./framework/store";
import { journey } from "./journey/project";
import { Stage } from "./app/Stage";
import { PresenterConsole, TopBar } from "./app/PresenterConsole";
import { Minimap } from "./app/Minimap";
import { CommandPalette } from "./app/CommandPalette";
import { OutlineView } from "./app/OutlineView";
import { Narrator } from "./app/Narrator";

export default function App() {
  const store = useMemo(() => createPresentationStore(journey), []);
  const fadeRef = useRef<HTMLDivElement>(null);

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
      >
        <Stage store={store} fadeRef={fadeRef} />
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
