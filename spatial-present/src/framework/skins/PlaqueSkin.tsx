import { Component, Suspense, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture, useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import { FONT_SANS, FONT_SERIF, param, useReveal, type SkinProps } from "./common";

/**
 * A framed museum piece: an image painting or a film panel, with a brass
 * caption plate. The alt text travels with the primitive into the outline.
 */
export function PlaqueSkin({
  src,
  title,
  caption,
  alt,
  video,
  active,
  params,
}: SkinProps & {
  src: string;
  title?: string;
  caption?: string;
  alt: string;
  video?: boolean;
}) {
  const width = param(params, "width", 3.2);
  const height = param(params, "height", 2.2);
  const reveal = useReveal(active);
  const spot = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    if (spot.current) spot.current.intensity = 26 * reveal.current;
  });

  return (
    <group>
      {/* frame */}
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[width + 0.34, height + 0.34, 0.12]} />
        <meshStandardMaterial color="#6b5226" metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[width + 0.12, height + 0.12, 0.06]} />
        <meshStandardMaterial color="#241a0c" roughness={0.7} />
      </mesh>
      <Suspense fallback={<CanvasPlaceholder width={width} height={height} label={alt} />}>
        <MediaErrorBoundary
          fallback={<CanvasPlaceholder width={width} height={height} label={alt} />}
        >
          {video ? (
            <VideoSurface src={src} width={width} height={height} active={active} />
          ) : (
            <ImageSurface src={src} width={width} height={height} />
          )}
        </MediaErrorBoundary>
      </Suspense>
      {/* Wall label: a brass plate with the work's title, and below it a
          readable caption so the piece never appears without explanation.
          drei <Text> is unlit, so these stay legible from any angle. */}
      {title && (
        <group position={[0, -height / 2 - 0.36, 0.02]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[Math.min(width + 0.4, 3.8), 0.46, 0.05]} />
            <meshStandardMaterial
              color="#3a2c12"
              metalness={0.7}
              roughness={0.45}
            />
          </mesh>
          {/* engraved gold lettering — light on dark bronze for legibility */}
          <Text
            font={FONT_SERIF}
            fontSize={0.125}
            color="#e7c878"
            anchorX="center"
            anchorY="middle"
            maxWidth={Math.min(width + 0.2, 3.5)}
            lineHeight={1.25}
            textAlign="center"
          >
            {title}
          </Text>
        </group>
      )}
      {caption && (
        <Text
          font={FONT_SANS}
          fontSize={0.13}
          color="#eef1fb"
          outlineWidth={0.006}
          outlineColor="#05070e"
          outlineOpacity={0.95}
          anchorX="center"
          anchorY="top"
          position={[0, -height / 2 - (title ? 0.66 : 0.3), 0.02]}
          maxWidth={width + 0.8}
          lineHeight={1.4}
          textAlign="center"
        >
          {caption}
        </Text>
      )}
      <spotLight
        ref={spot}
        position={[0, height / 2 + 1.4, 2.2]}
        angle={0.7}
        penumbra={0.6}
        color="#ffe7c0"
        distance={9}
        decay={1.6}
      />
    </group>
  );
}

function ImageSurface({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const texture = useTexture(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Treat the artwork as self-lit so dark paintings stay legible regardless
  // of where the camera approaches from; the spotlight adds gallery warmth.
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={1.15}
        roughness={0.85}
      />
    </mesh>
  );
}

function VideoSurface({
  src,
  width,
  height,
  active,
}: {
  src: string;
  width: number;
  height: number;
  active: boolean;
}) {
  const texture = useVideoTexture(src, { muted: true, loop: true, start: true });
  const video = texture.image as HTMLVideoElement;
  if (active && video.paused) void video.play().catch(() => {});
  if (!active && !video.paused) video.pause();
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function CanvasPlaceholder({
  width,
  height,
  label,
}: {
  width: number;
  height: number;
  label: string;
}) {
  return (
    <group position={[0, 0, 0.02]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#2c2c34" roughness={0.9} />
      </mesh>
      <Text
        font={FONT_SANS}
        fontSize={0.12}
        color="#9aa2b8"
        anchorX="center"
        anchorY="middle"
        maxWidth={width - 0.4}
        textAlign="center"
        position={[0, 0, 0.01]}
      >
        {label}
      </Text>
    </group>
  );
}

class MediaErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
