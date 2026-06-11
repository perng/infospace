import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { ChartData } from "@spatial-present/schema";
import { FONT_SANS, FONT_SANS_BOLD, param, useReveal, type SkinProps } from "./common";

const HOLO = "#39d7ff";
const HOLO_DIM = "#1b6e86";

/**
 * A chart projected as a volumetric hologram above an emitter base.
 * Bars are additive translucent volumes that grow in on reveal; the data
 * itself stays a structured chart primitive (also exported to the outline).
 */
export function HologramChartSkin({
  data,
  active,
  params,
}: SkinProps & { data: ChartData }) {
  const width = param(params, "width", 4);
  const height = param(params, "height", 2.4);
  // Idle ~0 so a hologram is nearly invisible until it becomes the focus,
  // then blooms in — keeps bright chart titles from bleeding into other beats.
  const reveal = useReveal(active, 1.6, 0.0);
  const group = useRef<THREE.Group>(null);
  const baseGroup = useRef<THREE.Group>(null);
  const flicker = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (baseGroup.current) baseGroup.current.visible = reveal.current > 0.02;
    if (group.current) {
      const r = reveal.current;
      group.current.scale.setScalar(0.02 + 0.98 * r);
      group.current.visible = r > 0.02;
      group.current.position.y = 0.7 + 0.15 * Math.sin(clock.elapsedTime * 0.8);
    }
    if (flicker.current)
      flicker.current.intensity =
        reveal.current * (2.2 + Math.sin(clock.elapsedTime * 17) * 0.3);
  });

  const bars = useMemo(() => {
    if (data.type !== "bar") return [];
    const values = data.series.map((s) =>
      data.logScale ? Math.log10(Math.max(s.value, 1)) : s.value
    );
    const max = Math.max(...values, 1e-9);
    const slot = width / data.series.length;
    return data.series.map((s, i) => ({
      label: s.label,
      value: s.value,
      x: -width / 2 + slot * (i + 0.5),
      h: Math.max((values[i] / max) * height, 0.06),
      w: slot * 0.45,
    }));
  }, [data, width, height]);

  return (
    <group ref={baseGroup}>
      {/* emitter base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[width * 0.42, width * 0.5, 0.16, 48]} />
        <meshStandardMaterial
          color="#1a2228"
          metalness={0.8}
          roughness={0.35}
          emissive={HOLO_DIM}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[width * 0.3, width * 0.4, 48]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.8} />
      </mesh>

      <group ref={group} position={[0, 0.7, 0]}>
        <Text
          font={FONT_SANS_BOLD}
          fontSize={0.22}
          color={HOLO}
          anchorX="center"
          position={[0, height + 0.75, 0]}
        >
          {data.title}
        </Text>

        {data.type === "bar" && (
          <>
            {/* baseline + back grid */}
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <mesh key={g} position={[0, g * height + 0.3, -0.35]}>
                <boxGeometry args={[width + 0.4, 0.008, 0.008]} />
                <meshBasicMaterial
                  color={HOLO}
                  transparent
                  opacity={0.22}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
            {bars.map((b, i) => (
              <Bar key={i} bar={b} index={i} reveal={reveal} unit={data.unit} />
            ))}
          </>
        )}
      </group>
      <pointLight
        ref={flicker}
        position={[0, 1.6, 0.8]}
        color={HOLO}
        distance={8}
        decay={1.6}
      />
    </group>
  );
}

function Bar({
  bar,
  index,
  reveal,
  unit,
}: {
  bar: { label: string; value: number; x: number; h: number; w: number };
  index: number;
  reveal: React.RefObject<number>;
  unit?: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    // staggered grow-in per bar
    const local = Math.min(Math.max(reveal.current * 1.6 - index * 0.12, 0), 1);
    if (mesh.current) {
      mesh.current.scale.y = Math.max(local, 0.001);
      mesh.current.position.y = 0.3 + (bar.h * local) / 2;
    }
    if (mat.current) mat.current.opacity = 0.28 + 0.2 * local;
  });

  return (
    <group position={[bar.x, 0, 0]}>
      <mesh ref={mesh} position={[0, 0.3, 0]}>
        <boxGeometry args={[bar.w, bar.h, bar.w]} />
        <meshBasicMaterial
          ref={mat}
          color={HOLO}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* wire crown marking the value plane */}
      <ValueCrown bar={bar} index={index} reveal={reveal} />
      <Text
        font={FONT_SANS}
        fontSize={0.13}
        color="#bfeefd"
        anchorX="center"
        position={[0, 0.08, 0.1]}
        maxWidth={bar.w * 2.4}
        textAlign="center"
      >
        {bar.label}
      </Text>
      <Text
        font={FONT_SANS_BOLD}
        fontSize={0.14}
        color={HOLO}
        anchorX="center"
        position={[0, 0.3 + bar.h + 0.16, 0]}
      >
        {formatValue(bar.value)}
        {unit ? ` ${unit}` : ""}
      </Text>
    </group>
  );
}

function ValueCrown({
  bar,
  index,
  reveal,
}: {
  bar: { h: number; w: number };
  index: number;
  reveal: React.RefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const local = Math.min(Math.max(reveal.current * 1.6 - index * 0.12, 0), 1);
    if (ref.current) ref.current.position.y = 0.3 + bar.h * local;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[bar.w * 0.55, bar.w * 0.72, 4]} />
      <meshBasicMaterial
        color="#aaf1ff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 ? 1 : 0)}k`;
  if (v < 1) return v.toString();
  return v.toLocaleString();
}
