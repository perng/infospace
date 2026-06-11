import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LENS_POS, MICROSCOPE_POS } from "../layout";
import { seededRandom } from "../../framework/random";

const MARBLE = "#b8b2a4";
const MARBLE_DARK = "#7d776b";
const BRASS = "#a8842f";

/**
 * A roofless marble gallery under a night sky. Procedural geometry only —
 * no external 3D assets — so the bundle stays light and loads fast.
 */
export function MuseumWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <Hall />
      <Colonnade />
      <StarSky />
      <Microscope />
      {/* lighting */}
      <ambientLight intensity={0.32} color="#aab4d8" />
      <directionalLight
        position={[18, 40, 25]}
        intensity={0.7}
        color="#cfd8ff"
        castShadow
      />
      <pointLight position={[0, 7, 18]} intensity={1.6} color="#ffd9a0" distance={26} decay={1.7} />
      <pointLight position={[0, 7, -2]} intensity={1.6} color="#ffd9a0" distance={26} decay={1.7} />
      <pointLight position={[0, 5, -20]} intensity={1.2} color="#ffe2b8" distance={24} decay={1.7} />
    </group>
  );
}

function Hall() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[27, 66]} />
        <meshStandardMaterial color="#262120" roughness={0.35} metalness={0.25} />
      </mesh>
      {/* carpet runner down the route */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 2]}>
        <planeGeometry args={[3.4, 58]} />
        <meshStandardMaterial color="#4a1d24" roughness={0.95} />
      </mesh>
      {/* side walls */}
      <mesh position={[-13, 3.5, 0]} receiveShadow>
        <boxGeometry args={[1, 7, 66]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[13, 3.5, 0]} receiveShadow>
        <boxGeometry args={[1, 7, 66]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      {/* back wall, low — the cellular sky rises above it */}
      <mesh position={[0, 2.75, -32]} receiveShadow>
        <boxGeometry args={[27, 5.5, 1]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      {/* front wall with entrance gap */}
      <mesh position={[-9.5, 3.5, 32]}>
        <boxGeometry args={[8, 7, 1]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[9.5, 3.5, 32]}>
        <boxGeometry args={[8, 7, 1]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[0, 6.25, 32]}>
        <boxGeometry args={[11, 1.5, 1]} />
        <meshStandardMaterial color={MARBLE_DARK} roughness={0.85} />
      </mesh>
      {/* wall cornices */}
      <mesh position={[-13, 7.1, 0]}>
        <boxGeometry args={[1.4, 0.35, 66]} />
        <meshStandardMaterial color={MARBLE} roughness={0.7} />
      </mesh>
      <mesh position={[13, 7.1, 0]}>
        <boxGeometry args={[1.4, 0.35, 66]} />
        <meshStandardMaterial color={MARBLE} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Colonnade() {
  const positions = useMemo(() => {
    const list: [number, number][] = [];
    for (let z = -26; z <= 28; z += 6.75) {
      list.push([-9.6, z], [9.6, z]);
    }
    return list;
  }, []);
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[1.5, 0.5, 1.5]} />
            <meshStandardMaterial color={MARBLE} roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.5, 6.2, 18]} />
            <meshStandardMaterial color={MARBLE} roughness={0.75} />
          </mesh>
          <mesh position={[0, 6.85, 0]} castShadow>
            <boxGeometry args={[1.4, 0.5, 1.4]} />
            <meshStandardMaterial color={MARBLE} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StarSky() {
  const stars = useMemo(() => {
    const rand = seededRandom(0x57a55);
    const n = 1400;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // upper hemisphere shell
      const r = 320;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 0.95);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) + 5;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[stars, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cdd6ff" size={0.7} sizeAttenuation transparent opacity={0.85} depthWrite={false} />
    </points>
  );
}

/** The scale portal: a giant brass microscope whose lens pulses with light. */
function Microscope() {
  const lensGlow = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const pulse = 0.55 + 0.45 * Math.sin(clock.elapsedTime * 2.1);
    if (glowMat.current) glowMat.current.opacity = 0.25 + 0.5 * pulse;
    if (lensGlow.current) lensGlow.current.scale.setScalar(1 + pulse * 0.18);
  });

  const brass = (
    <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.32} />
  );

  return (
    <group position={MICROSCOPE_POS}>
      {/* display pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[1.7, 2, 0.7, 32]} />
        <meshStandardMaterial color="#3a3530" roughness={0.6} />
      </mesh>
      {/* base */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.95, 1.25, 0.3, 24]} />
        {brass}
      </mesh>
      {/* arm */}
      <mesh position={[0, 1.7, -0.45]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.22, 1.9, 0.22]} />
        {brass}
      </mesh>
      {/* stage */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[1.1, 0.08, 1.1]} />
        {brass}
      </mesh>
      {/* optical tube */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 1.5, 20]} />
        {brass}
      </mesh>
      {/* eyepiece */}
      <mesh position={[0, 3.18, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.3, 16]} />
        {brass}
      </mesh>
      {/* the lens — the portal surface */}
      <mesh position={[0, LENS_POS[1] - MICROSCOPE_POS[1], 0]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial
          color="#9fe8ff"
          emissive="#36c4e8"
          emissiveIntensity={1.4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={lensGlow} position={[0, LENS_POS[1] - MICROSCOPE_POS[1], 0]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#7fdcff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        position={[0, 2.1, 0.6]}
        color="#5fd4f4"
        intensity={2.4}
        distance={9}
        decay={1.7}
      />
    </group>
  );
}
