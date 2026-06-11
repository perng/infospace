import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { ChartData } from "@spatial-present/schema";
import { FONT_SANS, FONT_SANS_BOLD, param, useReveal, type SkinProps } from "./common";

const STAR = "#ffe9b8";
const LINE = "#7f93d8";

/**
 * A scatter plot rendered as a constellation: each data point becomes a
 * star positioned by its (x, y) values, joined by faint asterism lines.
 * Axes become horizon glyphs. Semantics survive — the same points feed
 * the outline view as a table.
 */
export function ConstellationSkin({
  data,
  active,
  params,
}: SkinProps & { data: ChartData }) {
  const width = param(params, "width", 10);
  const height = param(params, "height", 6);
  // Idle ~0: the sky only materialises when it is the focus.
  const reveal = useReveal(active, 1.1, 0.0);
  const root = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    if (data.type !== "scatter") return [];
    const xs = data.points.map((p) => Math.log10(Math.max(p.x, 1e-12)));
    const ys = data.points.map((p) => Math.log10(Math.max(p.y, 1e-12)));
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    return data.points.map((p, i) => ({
      label: p.label,
      x: ((xs[i] - xMin) / (xMax - xMin || 1) - 0.5) * width,
      y: ((ys[i] - yMin) / (yMax - yMin || 1) - 0.5) * height,
      seed: Math.sin(i * 999.7) * 0.5 + 0.5,
    }));
  }, [data, width, height]);

  const linePositions = useMemo(() => {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const arr: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++)
      arr.push(sorted[i].x, sorted[i].y, 0, sorted[i + 1].x, sorted[i + 1].y, 0);
    return new Float32Array(arr);
  }, [points]);

  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  useFrame(() => {
    if (lineMat.current) lineMat.current.opacity = 0.35 * reveal.current;
    if (root.current) root.current.visible = reveal.current > 0.02;
  });

  if (data.type !== "scatter") return null;

  return (
    <group ref={root}>
      <Text
        font={FONT_SANS_BOLD}
        fontSize={0.85}
        color={STAR}
        anchorX="center"
        position={[0, height / 2 + 1.6, 0]}
      >
        {data.title}
      </Text>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMat}
          color={LINE}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {points.map((p, i) => (
        <Star key={i} point={p} index={i} reveal={reveal} />
      ))}
      {/* axis legends along the horizon */}
      <Text
        font={FONT_SANS}
        fontSize={0.5}
        color="#9fb0e0"
        anchorX="center"
        position={[0, -height / 2 - 1.3, 0]}
      >
        {`← ${data.xLabel} →`}
      </Text>
      <Text
        font={FONT_SANS}
        fontSize={0.5}
        color="#9fb0e0"
        anchorX="center"
        rotation={[0, 0, Math.PI / 2]}
        position={[-width / 2 - 1.4, 0, 0]}
      >
        {`← ${data.yLabel} →`}
      </Text>
    </group>
  );
}

function Star({
  point,
  index,
  reveal,
}: {
  point: { label: string; x: number; y: number; seed: number };
  index: number;
  reveal: React.RefObject<number>;
}) {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const local = Math.min(Math.max(reveal.current * 1.5 - index * 0.07, 0), 1);
    const twinkle = 0.75 + 0.25 * Math.sin(t * (1.5 + point.seed * 2) + index);
    if (core.current) core.current.scale.setScalar(Math.max(local, 0.001));
    if (halo.current)
      halo.current.scale.setScalar(Math.max(local * twinkle * 2.6, 0.001));
    if (haloMat.current) haloMat.current.opacity = 0.35 * local * twinkle;
  });

  return (
    <group position={[point.x, point.y, 0]}>
      <mesh ref={core}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshBasicMaterial color="#fffbe8" />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshBasicMaterial
          ref={haloMat}
          color={STAR}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <Text
        font={FONT_SANS_BOLD}
        fontSize={0.52}
        color="#eef2ff"
        outlineWidth={0.01}
        outlineColor="#060a18"
        outlineOpacity={0.9}
        anchorX="center"
        position={[0, 0.62, 0]}
      >
        {point.label}
      </Text>
    </group>
  );
}
