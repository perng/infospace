import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { FONT_SERIF, FONT_SANS, param, useReveal, type SkinProps } from "./common";

/**
 * Text carved into a stone tablet. The glyphs sit just behind the slab face
 * with a brighter offset duplicate above them, reading as chiselled relief.
 * The semantic text primitive is untouched — this is presentation only.
 */
export function EngravingSkin({
  title,
  body,
  active,
  params,
}: SkinProps & { title?: string; body: string }) {
  const width = param(params, "width", 4.2);
  const height = param(params, "height", 3);
  const stone = param(params, "stoneColor", "#9d9484");
  const litRef = useRef<THREE.PointLight>(null);
  const reveal = useReveal(active);

  useFrame(() => {
    if (litRef.current)
      litRef.current.intensity = 2.5 * reveal.current * reveal.current;
  });

  return (
    <group>
      {/* slab */}
      <mesh position={[0, 0, -0.09]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.5, height + 0.5, 0.18]} />
        <meshStandardMaterial color={stone} roughness={0.92} metalness={0.02} />
      </mesh>
      {/* bevel frame */}
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[width + 0.9, height + 0.9, 0.1]} />
        <meshStandardMaterial
          color={new THREE.Color(stone).multiplyScalar(0.75)}
          roughness={0.95}
        />
      </mesh>
      {/* Inscriptions read as gilded lettering inlaid in the stone: a light
          warm glyph face with a dark outline that doubles as the carved edge.
          drei <Text> is unlit (basic material), so these colors render as-is
          and stay legible regardless of where the camera approaches from. */}
      {title && (
        <Text
          font={FONT_SERIF}
          fontSize={0.3}
          color="#f6ecd2"
          outlineWidth={0.012}
          outlineColor="#2a2114"
          outlineOpacity={0.95}
          anchorX="center"
          anchorY="middle"
          position={[0, height / 2 - 0.38, 0.02]}
          maxWidth={width}
          textAlign="center"
        >
          {title.toUpperCase()}
        </Text>
      )}
      <Text
        font={FONT_SANS}
        fontSize={0.155}
        color="#f3ebd8"
        outlineWidth={0.006}
        outlineColor="#2a2114"
        outlineOpacity={0.9}
        anchorX="center"
        anchorY="top"
        position={[0, height / 2 - (title ? 0.85 : 0.3), 0.02]}
        maxWidth={width - 0.3}
        lineHeight={1.5}
        textAlign="left"
      >
        {body}
      </Text>
      <pointLight
        ref={litRef}
        position={[0, height / 2 + 0.8, 1.6]}
        color="#ffe1b0"
        distance={7}
        decay={1.8}
      />
    </group>
  );
}
