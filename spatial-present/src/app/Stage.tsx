import type { PresentationStore } from "../framework/store";
import { AnchorContent } from "../framework/skins/SkinRenderer";
import { CameraRig } from "../framework/camera/CameraRig";
import { AtriumWorld } from "../journey/worlds/AtriumWorld";
import { SpectralWorld } from "../journey/worlds/SpectralWorld";

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
      <AtriumWorld visible={activeWorldId === "atrium"} />
      <SpectralWorld visible={activeWorldId === "spectral"} />
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
