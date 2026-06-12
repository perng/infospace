import { Suspense, useEffect, useRef, useState } from "react";
import { useVideoTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { param, useReveal, type SkinProps } from "./common";
import { fetchManimManifest } from "./manimManifest";

/**
 * A frameless floating panel playing a rendered manim clip. With an
 * alpha-channel clip the glowing graphics composite straight over the
 * world — no visible screen, just mathematics in the air.
 *
 * Reveal modes (from the manim primitive):
 * - "play": plays once when the beat activates.
 * - "loop": loops while the beat is active.
 * - "stepwise": plays one cuepoint segment per reveal step — the presenter
 *   (or a narration cue mark) walks the derivation one transformation at
 *   a time. Cuepoints come from the manim asset manifest.
 */
export function ProjectionSkin({
  src,
  contentId,
  reveal,
  revealStep,
  active,
  params,
}: SkinProps & {
  src: string;
  contentId: string;
  reveal: "play" | "loop" | "stepwise";
  revealStep: number;
}) {
  const width = param(params, "width", 6);
  const height = param(params, "height", 3.4);
  const fade = useReveal(active, 1.6, 0.25);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const cuepoints = useManimCuepoints(contentId);

  useFrame(() => {
    if (matRef.current) matRef.current.opacity = 0.15 + 0.85 * fade.current;
  });

  return (
    <group>
      <Suspense fallback={null}>
        <ProjectionSurface
          src={src}
          width={width}
          height={height}
          reveal={reveal}
          revealStep={revealStep}
          active={active}
          cuepoints={cuepoints}
          matRef={matRef}
        />
      </Suspense>
    </group>
  );
}

function ProjectionSurface({
  src,
  width,
  height,
  reveal,
  revealStep,
  active,
  cuepoints,
  matRef,
}: {
  src: string;
  width: number;
  height: number;
  reveal: "play" | "loop" | "stepwise";
  revealStep: number;
  active: boolean;
  cuepoints: number[] | null;
  matRef: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  const texture = useVideoTexture(src, {
    muted: true,
    loop: reveal === "loop",
    start: false,
  });

  // The <video> element lives outside React (drei owns it); hold it in a
  // ref — React's mutable channel — and drive playback imperatively.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    videoRef.current = texture.image as HTMLVideoElement;
  }, [texture]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active) {
      video.pause();
      return;
    }
    if (reveal === "loop" || reveal === "play") {
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }
    // stepwise: play from the previous cuepoint to the current one.
    if (!cuepoints?.length) return;
    const targetS = cuepoints[Math.min(revealStep, cuepoints.length - 1)] / 1000;
    if (revealStep === 0) video.currentTime = 0;
    const onTime = () => {
      if (video.currentTime >= targetS) {
        video.pause();
        video.currentTime = targetS;
      }
    };
    video.addEventListener("timeupdate", onTime);
    void video.play().catch(() => {});
    return () => video.removeEventListener("timeupdate", onTime);
  }, [active, reveal, revealStep, cuepoints]);

  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0.15}
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function useManimCuepoints(contentId: string): number[] | null {
  const [cuepoints, setCuepoints] = useState<number[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetchManimManifest().then((manifest) => {
      if (!cancelled) setCuepoints(manifest[contentId]?.cuepoints ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [contentId]);
  return cuepoints;
}
