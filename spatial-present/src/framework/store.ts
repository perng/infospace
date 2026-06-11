import { create } from "zustand";
import type { CameraPose, RouteEdge, TransitionKind } from "./schema";
import type { ProjectIndex } from "./routeGraph";
import { primaryNext } from "./routeGraph";

export interface ActiveTransition {
  toBeatId: string;
  kind: TransitionKind;
  toPose: CameraPose;
  /** Portal transitions swap the active world behind a fade at t≈0.5. */
  portal?: {
    toWorldId: string;
    divePose?: CameraPose;
    emergePose?: CameraPose;
  };
  /** Set by the camera rig when it captures the live camera as the origin. */
  startedAt: number | null;
  durationMs: number;
}

interface PresentationState {
  index: ProjectIndex;
  currentBeatId: string;
  activeWorldId: string;
  history: string[];
  transition: ActiveTransition | null;
  /** True once the user grabbed the camera; cleared by return-to-route. */
  manualCamera: boolean;
  outlineOpen: boolean;
  paletteOpen: boolean;
  notesOpen: boolean;
  startedAtMs: number;

  goToBeat: (beatId: string, via?: RouteEdge) => void;
  advance: () => void;
  goBack: () => void;
  returnToRoute: () => void;
  markTransitionStarted: (timeMs: number) => void;
  finishTransition: () => void;
  setActiveWorld: (worldId: string) => void;
  setManualCamera: (manual: boolean) => void;
  setOutlineOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setNotesOpen: (open: boolean) => void;
}

const DURATIONS: Record<TransitionKind, number> = {
  cut: 0,
  dolly: 1400,
  fly: 2400,
  portal: 4200,
};

export function createPresentationStore(index: ProjectIndex) {
  const startBeat = index.beatById.get(index.project.startBeatId)!;
  const startAnchor = index.anchorById.get(startBeat.anchorId)!;

  return create<PresentationState>((set, get) => ({
    index,
    currentBeatId: startBeat.id,
    activeWorldId: startAnchor.worldId,
    history: [],
    transition: null,
    manualCamera: false,
    outlineOpen: false,
    paletteOpen: false,
    notesOpen: true,
    startedAtMs: Date.now(),

    goToBeat: (beatId, via) => {
      const { index, currentBeatId } = get();
      const beat = index.beatById.get(beatId);
      if (!beat || (beatId === currentBeatId && !get().manualCamera)) return;
      const anchor = index.anchorById.get(beat.anchorId)!;
      const fromAnchor = index.anchorById.get(
        index.beatById.get(currentBeatId)!.anchorId
      )!;
      const crossesWorlds = anchor.worldId !== fromAnchor.worldId;
      const kind: TransitionKind = via
        ? via.transition
        : crossesWorlds
          ? "portal"
          : "fly";
      set({
        history: [...get().history, currentBeatId],
        currentBeatId: beatId,
        manualCamera: false,
        transition: {
          toBeatId: beatId,
          kind,
          toPose: beat.camera,
          portal:
            kind === "portal"
              ? {
                  toWorldId: anchor.worldId,
                  divePose: via?.divePose,
                  emergePose: via?.emergePose,
                }
              : undefined,
          startedAt: null,
          durationMs: DURATIONS[kind],
        },
      });
    },

    advance: () => {
      const { index, currentBeatId, goToBeat } = get();
      const edge = primaryNext(index, currentBeatId);
      if (edge) goToBeat(edge.to, edge);
    },

    goBack: () => {
      const { history, index } = get();
      if (!history.length) return;
      const prev = history[history.length - 1];
      const beat = index.beatById.get(prev);
      if (!beat) return;
      const anchor = index.anchorById.get(beat.anchorId)!;
      const currentAnchor = index.anchorById.get(
        index.beatById.get(get().currentBeatId)!.anchorId
      )!;
      const crossesWorlds = anchor.worldId !== currentAnchor.worldId;
      set({
        history: history.slice(0, -1),
        currentBeatId: prev,
        manualCamera: false,
        transition: {
          toBeatId: prev,
          kind: crossesWorlds ? "portal" : "fly",
          toPose: beat.camera,
          portal: crossesWorlds ? { toWorldId: anchor.worldId } : undefined,
          startedAt: null,
          durationMs: crossesWorlds ? DURATIONS.portal : DURATIONS.fly,
        },
      });
    },

    returnToRoute: () => {
      const { index, currentBeatId } = get();
      const beat = index.beatById.get(currentBeatId)!;
      set({
        manualCamera: false,
        transition: {
          toBeatId: currentBeatId,
          kind: "dolly",
          toPose: beat.camera,
          startedAt: null,
          durationMs: DURATIONS.dolly,
        },
      });
    },

    markTransitionStarted: (timeMs) => {
      const t = get().transition;
      if (t && t.startedAt === null)
        set({ transition: { ...t, startedAt: timeMs } });
    },

    finishTransition: () => set({ transition: null }),
    setActiveWorld: (worldId) => set({ activeWorldId: worldId }),
    setManualCamera: (manual) => set({ manualCamera: manual }),
    setOutlineOpen: (open) => set({ outlineOpen: open }),
    setPaletteOpen: (open) => set({ paletteOpen: open }),
    setNotesOpen: (open) => set({ notesOpen: open }),
  }));
}

export type PresentationStore = ReturnType<typeof createPresentationStore>;
