import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Float } from "@react-three/drei";
import * as THREE from "three";
import { FONT_SERIF, FONT_SANS, param, useReveal, type SkinProps } from "./common";
import { seededRandom } from "../random";

/**
 * A quote drifting as luminous text inside a slow particle nebula.
 */
export function CloudTextSkin({
  title,
  body,
  active,
  params,
}: SkinProps & { title?: string; body: string }) {
  const width = param(params, "width", 7);
  const color = param(params, "color", "#cfe3ff");
  const reveal = useReveal(active, 1.2);
  const textMat = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const rand = seededRandom(0xc10d);
    const n = 320;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (rand() - 0.5) * (width + 4);
      arr[i * 3 + 1] = (rand() - 0.5) * 4.5;
      arr[i * 3 + 2] = (rand() - 0.5) * 3;
    }
    return arr;
  }, [width]);

  const pointsRef = useRef<THREE.Points>(null);
  const pointsMat = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    const r = reveal.current;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.elapsedTime * 0.03;
    }
    if (pointsMat.current) pointsMat.current.opacity = 0.5 * r;
    if (textMat.current) {
      textMat.current.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (mat && "opacity" in mat) {
          mat.transparent = true;
          mat.opacity = 0.15 + 0.85 * r;
        }
      });
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMat}
          color={color}
          size={0.045}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <Float speed={1.1} rotationIntensity={0.04} floatIntensity={0.5}>
        <group ref={textMat}>
          <Text
            font={FONT_SERIF}
            fontSize={0.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            maxWidth={width}
            textAlign="center"
            lineHeight={1.45}
            outlineWidth={0.012}
            outlineColor={color}
            outlineOpacity={0.25}
            outlineBlur={0.25}
          >
            {body}
          </Text>
          {title && (
            <Text
              font={FONT_SANS}
              fontSize={0.22}
              color="#8fa0c8"
              anchorX="center"
              position={[0, -1.9, 0]}
            >
              {`— ${title}`}
            </Text>
          )}
        </group>
      </Float>
    </group>
  );
}
