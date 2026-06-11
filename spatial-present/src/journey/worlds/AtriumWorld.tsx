import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LENS_POS, PRISM_POS } from "../layout";
import { seededRandom } from "../../framework/random";

const MARBLE = "#b8b2a4";
const MARBLE_DARK = "#7d776b";
const BRASS = "#a8842f";

/**
 * The Atrium of Linear Maps — a roofless marble gallery under a field of
 * stars (the ambient vector space). Procedural geometry only, so the bundle
 * stays light. Its centrepiece is a glowing prism that splits one beam into
 * many: the portal that dives into a matrix's decomposition.
 */
export function AtriumWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <Hall />
      <Colonnade />
      <StarField />
      <SphereToEllipsoid />
      <Prism />
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
      <pointLight position={[0, 5, -20]} intensity={1.2} color="#cfe6ff" distance={24} decay={1.7} />
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
        <meshStandardMaterial color="#1d2a4a" roughness={0.95} />
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
      {/* back wall, low — the data sky rises above it */}
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

/** The ambient vector space: a dome of faint stars over the gallery. */
function StarField() {
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

/**
 * A slow hero motif floating high over the back of the hall: a wireframe
 * unit sphere being stretched into an ellipsoid — the geometric signature
 * of SVD, the same picture the wall diagram makes precise.
 */
function SphereToEllipsoid() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = t * 0.12;
    // breathe between sphere (1,1,1) and a stretched ellipsoid
    const k = 0.5 + 0.5 * Math.sin(t * 0.45);
    ref.current.scale.set(1 + 1.1 * k, 1 - 0.35 * k, 0.85 + 0.25 * k);
  });
  return (
    <group position={[0, 12.5, -26]}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[4.2, 24, 16]} />
          <meshBasicMaterial color="#39d7ff" wireframe transparent opacity={0.28} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * The scale portal: a luminous crystal prism on a pedestal that fans one
 * white beam into a coloured spectrum — light, decomposed. Its core lens
 * (at LENS_POS) pulses as the doorway into the matrix.
 */
function Prism() {
  const lensGlow = useRef<THREE.Mesh>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const crystal = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.1);
    if (glowMat.current) glowMat.current.opacity = 0.25 + 0.5 * pulse;
    if (lensGlow.current) lensGlow.current.scale.setScalar(1 + pulse * 0.18);
    if (crystal.current) crystal.current.rotation.y = t * 0.5;
  });

  const brass = (
    <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.32} />
  );

  // a spectral fan emanating from the prism core
  const spectrum = useMemo(
    () => ["#ff5d5d", "#ffae45", "#ffe45d", "#5dff8f", "#5dd0ff", "#7c8bff", "#c87cff"],
    []
  );

  return (
    <group position={PRISM_POS}>
      {/* display pedestal */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[1.7, 2, 0.7, 32]} />
        <meshStandardMaterial color="#2a2c3a" roughness={0.6} />
      </mesh>
      {/* brass plinth */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.7, 1.1, 0.6, 6]} />
        {brass}
      </mesh>
      {/* the crystal prism (octahedron) */}
      <mesh ref={crystal} position={[0, 2.05, 0]} castShadow>
        <octahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial
          color="#bfeaff"
          metalness={0.2}
          roughness={0.05}
          transparent
          opacity={0.55}
          emissive="#56c8ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* incoming white beam */}
      <mesh position={[-2.2, 2.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 3.2, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      {/* dispersed spectral fan on the far side */}
      {spectrum.map((c, i) => {
        const ang = (i - (spectrum.length - 1) / 2) * 0.12;
        return (
          <mesh
            key={c}
            position={[1.9, 2.05 + Math.sin(ang) * 1.6, 0]}
            rotation={[0, 0, -Math.PI / 2 + ang]}
          >
            <cylinderGeometry args={[0.02, 0.02, 3.4, 6]} />
            <meshBasicMaterial color={c} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        );
      })}
      {/* the lens — the portal surface */}
      <mesh position={[0, LENS_POS[1] - PRISM_POS[1], 0]}>
        <sphereGeometry args={[0.26, 24, 24]} />
        <meshStandardMaterial
          color="#9fe8ff"
          emissive="#36c4e8"
          emissiveIntensity={1.4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={lensGlow} position={[0, LENS_POS[1] - PRISM_POS[1], 0]}>
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
