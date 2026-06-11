import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PresentationStore } from "../framework/store";
import { AnchorContent } from "../framework/skins/SkinRenderer";
import { CameraRig } from "../framework/camera/CameraRig";
import { MuseumWorld } from "../journey/worlds/MuseumWorld";
import { CellWorld } from "../journey/worlds/CellWorld";

/** Everything inside the R3F canvas: worlds, anchored content, camera. */
export function Stage({
  store,
  fadeRef,
}: {
  store: PresentationStore;
  fadeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const index = store((s) => s.index);
  const activeWorldId = store((s) => s.activeWorldId);
  const currentBeatId = store((s) => s.currentBeatId);
  const currentAnchorId = index.beatById.get(currentBeatId)?.anchorId;

  return (
    <>
      <WorldAmbience store={store} />
      <MuseumWorld visible={activeWorldId === "museum"} />
      <CellWorld visible={activeWorldId === "cell"} />
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
  const scene = useThree((s) => s.scene);
  const index = store((s) => s.index);
  const activeWorldId = store((s) => s.activeWorldId);

  useEffect(() => {
    const world = index.project.worlds.find((w) => w.id === activeWorldId);
    if (!world) return;
    const { ambience } = world;
    scene.background = new THREE.Color(ambience.background);
    scene.fog = ambience.fogColor
      ? new THREE.Fog(
          ambience.fogColor,
          ambience.fogNear ?? 30,
          ambience.fogFar ?? 120
        )
      : null;
  }, [scene, index, activeWorldId]);

  return null;
}
