import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { param, useReveal, type SkinProps } from "./common";
import { useFormulaGeometry, fitFormula } from "./formula";

const GLOW = "#bfe8ff";

/**
 * A formula etched into a lit glass slab. The glyphs are emissive
 * geometry floating just proud of the glass face, lit from a bar at the
 * slab's foot; reveal ramps the glow up with a slow breathing pulse.
 */
export function EtchedGlassSkin({
  latex,
  active,
  params,
}: SkinProps & { latex: string }) {
  const width = param(params, "width", 5);
  const height = param(params, "height", 3);
  const color = param(params, "color", GLOW);
  // Idle low: several glass slabs can share a void view (AI-generated
  // talks especially), and inactive formulas must not compete.
  const reveal = useReveal(active, 1.4, 0.08);
  const formula = useFormulaGeometry(latex);
  const glyphMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const barMat = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const r = reveal.current;
    const pulse = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 1.3);
    for (const m of glyphMats.current)
      if (m) m.opacity = (0.2 + 0.8 * r) * pulse;
    if (barMat.current) barMat.current.opacity = 0.25 + 0.6 * r;
    if (light.current) light.current.intensity = 3.2 * r * pulse;
  });

  const fit = formula ? fitFormula(formula, width - 0.6, height - 0.6) : null;

  return (
    <group>
      {/* the slab */}
      <mesh position={[0, 0, -0.12]}>
        <boxGeometry args={[width, height, 0.22]} />
        <meshPhysicalMaterial
          color="#dceefc"
          transmission={0.92}
          roughness={0.14}
          thickness={0.5}
          ior={1.5}
          transparent
          opacity={0.96}
          depthWrite={false}
        />
      </mesh>
      {/* foot light bar */}
      <mesh position={[0, -height / 2 - 0.05, -0.12]}>
        <boxGeometry args={[width * 0.92, 0.08, 0.3]} />
        <meshBasicMaterial ref={barMat} color={color} transparent opacity={0.25} />
      </mesh>
      <pointLight
        ref={light}
        position={[0, -height / 2 + 0.4, 1.2]}
        color={color}
        distance={8}
        decay={1.7}
      />
      {formula && fit && (
        <group
          position={[fit.position[0], fit.position[1], 0.03]}
          scale={[fit.scale, -fit.scale, fit.scale]}
        >
          {formula.glyphs.map((glyph) => (
            <mesh key={glyph.index} geometry={glyph.geometry}>
              <meshBasicMaterial
                ref={(m) => {
                  glyphMats.current[glyph.index] = m;
                }}
                color={color}
                transparent
                opacity={0.2}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
