import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { FONT_SANS, param, useReveal, type SkinProps } from "./common";
import { useFormulaGeometry, fitFormula } from "./formula";

const CHALK = "#e8e4d8";
const SLATE = "#26312c";

/**
 * Chalk strokes on a slate board. A formula writes itself on when the
 * beat activates — glyphs appear in reading order, the way a lecturer's
 * hand moves — and fades back toward a half-erased ghost when the tour
 * moves on. Text content renders as chalk handwriting. The slate, frame,
 * and tray are part of the skin so the board works on any wall or stand.
 */
export function ChalkboardSkin({
  title,
  body,
  latex,
  active,
  params,
}: SkinProps & { title?: string; body?: string; latex?: string }) {
  const width = param(params, "width", 4.6);
  const height = param(params, "height", 3);
  const reveal = useReveal(active, 0.55, 0.25);

  return (
    <group>
      {/* slate */}
      <mesh position={[0, 0, -0.06]} receiveShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={SLATE} roughness={0.96} metalness={0} />
      </mesh>
      {/* wood frame */}
      <Frame width={width} height={height} />
      {/* chalk tray with a stub of chalk */}
      <group position={[0, -height / 2 - 0.16, 0.12]}>
        <mesh>
          <boxGeometry args={[width * 0.7, 0.06, 0.22]} />
          <meshStandardMaterial color="#5d4a33" roughness={0.85} />
        </mesh>
        <mesh position={[width * 0.18, 0.05, 0.02]} rotation={[0, 0.4, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
          <meshStandardMaterial color={CHALK} roughness={0.95} />
        </mesh>
      </group>
      {latex && (
        <ChalkFormula
          latex={latex}
          maxWidth={width - 0.7}
          maxHeight={height - 0.6}
          reveal={reveal}
        />
      )}
      {(title || body) && (
        <ChalkText
          title={title}
          body={body}
          width={width}
          height={height}
          reveal={reveal}
        />
      )}
    </group>
  );
}

function Frame({ width, height }: { width: number; height: number }) {
  const t = 0.14;
  const bars: [number, number, number, number][] = [
    [0, height / 2 + t / 2, width + 2 * t, t],
    [0, -height / 2 - t / 2, width + 2 * t, t],
    [-width / 2 - t / 2, 0, t, height],
    [width / 2 + t / 2, 0, t, height],
  ];
  return (
    <>
      {bars.map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, -0.04]}>
          <boxGeometry args={[w, h, 0.12]} />
          <meshStandardMaterial color="#6b563c" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

/** Glyph-by-glyph write-on, driven per-frame without re-rendering React. */
function ChalkFormula({
  latex,
  maxWidth,
  maxHeight,
  reveal,
}: {
  latex: string;
  maxWidth: number;
  maxHeight: number;
  reveal: React.RefObject<number>;
}) {
  const formula = useFormulaGeometry(latex);
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame(() => {
    const mats = materials.current;
    const n = mats.length;
    if (!n) return;
    // reveal 0→1 sweeps a write-on front across the glyphs in order.
    const front = reveal.current * (n + 2);
    for (let i = 0; i < n; i++) {
      const m = mats[i];
      if (m) m.opacity = THREE.MathUtils.clamp(front - i, 0, 1) * 0.92;
    }
  });

  if (!formula) return null;
  const { scale, position } = fitFormula(formula, maxWidth, maxHeight);
  return (
    <group position={[position[0], position[1], 0.02]} scale={[scale, -scale, scale]}>
      {formula.glyphs.map((glyph) => (
        <mesh key={glyph.index} geometry={glyph.geometry}>
          <meshBasicMaterial
            ref={(m) => {
              materials.current[glyph.index] = m;
            }}
            color={CHALK}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ChalkText({
  title,
  body,
  width,
  height,
  reveal,
}: {
  title?: string;
  body?: string;
  width: number;
  height: number;
  reveal: React.RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (mat && "opacity" in mat) {
        mat.transparent = true;
        mat.opacity = 0.25 + 0.75 * reveal.current;
      }
    });
  });
  return (
    <group ref={group}>
      {title && (
        <Text
          font={FONT_SANS}
          fontSize={0.3}
          color={CHALK}
          anchorX="center"
          anchorY="middle"
          position={[0, height / 2 - 0.45, 0.02]}
          maxWidth={width - 0.6}
          textAlign="center"
        >
          {title}
        </Text>
      )}
      {body && (
        <Text
          font={FONT_SANS}
          fontSize={0.17}
          color={CHALK}
          anchorX="center"
          anchorY="top"
          position={[0, height / 2 - (title ? 0.95 : 0.4), 0.02]}
          maxWidth={width - 0.7}
          lineHeight={1.6}
          textAlign="left"
        >
          {body}
        </Text>
      )}
    </group>
  );
}
