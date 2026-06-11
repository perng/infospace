import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraPose } from "@spatial-present/schema";
import type { PresentationStore } from "@spatial-present/core";

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function toV3(v: [number, number, number]) {
  return new THREE.Vector3(v[0], v[1], v[2]);
}

/**
 * Plans camera movement as transitions between poses rather than baked
 * keyframes, so the presenter can interrupt at any time. Between beats the
 * camera belongs to OrbitControls (manual orbit / zoom around the focus
 * target); during a transition the rig drives it.
 *
 * Portal transitions are two segments hidden behind a fade: live camera →
 * divePose in the source world, then emergePose → beat pose in the target
 * world. The world swap and teleport happen at the fade peak.
 */
export function CameraRig({
  store,
  fadeRef,
}: {
  store: PresentationStore;
  fadeRef: React.RefObject<HTMLDivElement | null>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useRef<OrbitControlsImpl>(null);
  const transition = store((s) => s.transition);
  const manualCamera = store((s) => s.manualCamera);

  // Captured at transition start.
  const fromPose = useRef<{ position: THREE.Vector3; target: THREE.Vector3; fov: number } | null>(null);
  const swapped = useRef(false);

  // Initialize the camera on the start beat without animating.
  useEffect(() => {
    const { index, currentBeatId } = store.getState();
    const beat = index.beatById.get(currentBeatId)!;
    applyPose(camera, controls.current, beat.camera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock, camera: frameCamera }) => {
    // Use the frame-state camera, not the render-scoped useThree value:
    // hook results are frozen under the React Compiler rules.
    const camera = frameCamera as THREE.PerspectiveCamera;
    const state = store.getState();
    const t = state.transition;
    if (!t) return;

    const now = clock.elapsedTime * 1000;
    if (t.startedAt === null) {
      fromPose.current = {
        position: camera.position.clone(),
        target: controls.current
          ? controls.current.target.clone()
          : new THREE.Vector3(),
        fov: camera.fov,
      };
      swapped.current = false;
      state.markTransitionStarted(now);
      if (t.durationMs === 0) {
        applyPose(camera, controls.current, t.toPose);
        if (t.portal) state.setActiveWorld(t.portal.toWorldId);
        state.finishTransition();
      }
      return;
    }

    const raw = Math.min((now - t.startedAt) / t.durationMs, 1);
    const from = fromPose.current!;
    const toPos = toV3(t.toPose.position);
    const toTarget = toV3(t.toPose.target);
    const toFov = t.toPose.fov ?? 50;

    if (t.portal) {
      // Segment A: live pose → dive pose. Segment B: emerge pose → beat pose.
      const dive = t.portal.divePose;
      const emerge = t.portal.emergePose;
      const divePos = dive ? toV3(dive.position) : from.position;
      const diveTarget = dive ? toV3(dive.target) : from.target;
      const diveFov = dive?.fov ?? from.fov;
      const emergePos = emerge ? toV3(emerge.position) : toPos;
      const emergeTarget = emerge ? toV3(emerge.target) : toTarget;
      const emergeFov = emerge?.fov ?? toFov;

      // Fade peaks at the midpoint, where the world swap happens.
      if (fadeRef.current) {
        const fade = Math.max(0, 1 - Math.abs(raw - 0.5) * 5);
        fadeRef.current.style.opacity = String(Math.min(fade * 1.6, 1));
      }
      if (raw < 0.5) {
        const k = easeInOutCubic(raw * 2) * 0.95; // accelerate into the lens
        camera.position.lerpVectors(from.position, divePos, k);
        lookAtLerp(camera, controls.current, from.target, diveTarget, k);
        camera.fov = THREE.MathUtils.lerp(from.fov, diveFov, k);
      } else {
        if (!swapped.current) {
          swapped.current = true;
          state.setActiveWorld(t.portal.toWorldId);
        }
        const k = easeInOutCubic((raw - 0.5) * 2);
        camera.position.lerpVectors(emergePos, toPos, k);
        lookAtLerp(camera, controls.current, emergeTarget, toTarget, k);
        camera.fov = THREE.MathUtils.lerp(emergeFov, toFov, k);
      }
      camera.updateProjectionMatrix();
    } else {
      const k = easeInOutCubic(raw);
      if (t.kind === "fly") {
        // Quadratic bezier through a lifted midpoint for a flight feel.
        const mid = from.position
          .clone()
          .lerp(toPos, 0.5)
          .add(
            new THREE.Vector3(
              0,
              Math.min(from.position.distanceTo(toPos) * 0.18, 6),
              0
            )
          );
        const a = from.position.clone().lerp(mid, k);
        const b = mid.clone().lerp(toPos, k);
        camera.position.copy(a.lerp(b, k));
      } else {
        camera.position.lerpVectors(from.position, toPos, k);
      }
      lookAtLerp(camera, controls.current, from.target, toTarget, k);
      camera.fov = THREE.MathUtils.lerp(from.fov, toFov, k);
      camera.updateProjectionMatrix();
    }

    if (raw >= 1) {
      applyPose(camera, controls.current, t.toPose);
      if (fadeRef.current) fadeRef.current.style.opacity = "0";
      state.finishTransition();
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!transition}
      enableDamping
      dampingFactor={0.08}
      maxDistance={80}
      onStart={() => {
        if (!manualCamera) store.getState().setManualCamera(true);
      }}
    />
  );
}

function applyPose(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl | null,
  pose: CameraPose
) {
  camera.position.set(...pose.position);
  camera.fov = pose.fov ?? 50;
  camera.updateProjectionMatrix();
  if (controls) {
    controls.target.set(...pose.target);
    controls.update();
  } else {
    camera.lookAt(...pose.target);
  }
}

function lookAtLerp(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl | null,
  from: THREE.Vector3,
  to: THREE.Vector3,
  k: number
) {
  const target = from.clone().lerp(to, k);
  if (controls) controls.target.copy(target);
  camera.lookAt(target);
}
