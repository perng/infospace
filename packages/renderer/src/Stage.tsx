import type { ComponentType } from "react";
import type { PresentationStore } from "@spatial-present/core";
import { AnchorContent } from "@spatial-present/skins";
import { CameraRig } from "./CameraRig";

/**
 * The host app supplies a component per world id in the document. The
 * renderer never imports journey-specific scenery — this map is the seam
 * (a registry proper arrives with M2).
 */
export type WorldComponents = Record<
  string,
  ComponentType<{ visible: boolean }>
>;

/** Everything inside the R3F canvas: worlds, anchored content, camera. */
export function Stage({
  store,
  worlds,
  fadeRef,
}: {
  store: PresentationStore;
  worlds: WorldComponents;
  fadeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const index = store((s) => s.index);
  const activeWorldId = store((s) => s.activeWorldId);
  const currentBeatId = store((s) => s.currentBeatId);
  const currentAnchorId = index.beatById.get(currentBeatId)?.anchorId;

  return (
    <>
      <WorldAmbience store={store} />
      {Object.entries(worlds).map(([worldId, World]) => (
        <World key={worldId} visible={worldId === activeWorldId} />
      ))}
      {index.project.anchors.map((anchor) => (
        <group key={anchor.id} visible={anchor.worldId === activeWorldId}>
          <AnchorContent
            index={index}
            anchor={anchor}
            active={
              anchor.id === currentAnchorId && anchor.worldId === activeWorldId
            }
          />
        </group>
      ))}
      <CameraRig store={store} fadeRef={fadeRef} />
    </>
  );
}

/** Applies the active world's background and fog from the project document. */
function WorldAmbience({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const activeWorldId = store((s) => s.activeWorldId);
  const world = index.project.worlds.find((w) => w.id === activeWorldId);
  if (!world) return null;
  const { ambience } = world;
  return (
    <>
      <color attach="background" args={[ambience.background]} />
      {ambience.fogColor && (
        <fog
          attach="fog"
          args={[ambience.fogColor, ambience.fogNear ?? 30, ambience.fogFar ?? 120]}
        />
      )}
    </>
  );
}
