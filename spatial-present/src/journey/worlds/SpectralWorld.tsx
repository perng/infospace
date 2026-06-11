import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DEEP_Y, LAYER_STACK, CORE_POS, RETURN_RING } from "../layout";
import { seededRandom } from "../../framework/random";

/**
 * The Spectral Interior: the inside of a matrix's decomposition, reached
 * through the prism portal. The image of the unit sphere — an ellipsoid —
 * floats at the centre with its principal axes drawn out; nearby, the
 * rank-one layers σᵢ·uᵢvᵢᵀ are stacked as glowing sheets, brightest first.
 */
export function SpectralWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <Bounds />
      <Lattice />
      <EllipsoidCore />
      <LayerStack />
      <TransformedGrid />
      <ReturnRing />
      <ambientLight intensity={0.5} color="#8fb8ff" />
      <pointLight position={[0, DEEP_Y + 18, 10]} intensity={2} color="#cfe0ff" distance={120} decay={1.4} />
      <pointLight position={CORE_POS} intensity={2.2} color="#7cc8ff" distance={50} decay={1.5} />
    </group>
  );
}

/** A faint enclosing shell so the interior reads as a bounded space. */
function Bounds() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.emissiveIntensity = 0.22 + 0.08 * Math.sin(clock.elapsedTime * 0.7);
  });
  return (
    <mesh position={[0, DEEP_Y, 0]}>
      <sphereGeometry args={[64, 48, 48]} />
      <meshStandardMaterial
        ref={mat}
        color="#0a1838"
        emissive="#13315e"
        emissiveIntensity={0.28}
        side={THREE.BackSide}
        roughness={0.9}
      />
    </mesh>
  );
}

/** The ambient vector space as a sparse lattice of points. */
function Lattice() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = seededRandom(0x5ec7);
    const n = 1800;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.cbrt(rand()) * 58;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = DEEP_Y + r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.008;
  });
  return (
    <points ref={ref} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9fc4ff"
        size={0.22}
        sizeAttenuation
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/** A thick directional arrow from the origin, used for principal axes. */
function Axis({
  dir,
  length,
  color,
}: {
  dir: [number, number, number];
  length: number;
  color: string;
}) {
  const quat = useMemo(() => {
    const v = new THREE.Vector3(...dir).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
  }, [dir]);
  return (
    <group quaternion={quat}>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, length, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[0.34, 0.9, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/**
 * The image of the unit sphere: a translucent ellipsoid whose three
 * principal semi-axes (the left singular vectors, scaled by singular values)
 * are drawn as arrows of descending length.
 */
function EllipsoidCore() {
  const wobble = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (wobble.current) {
      const s = 1 + 0.015 * Math.sin(clock.elapsedTime * 0.9);
      wobble.current.scale.set(1.7 * s, 0.7 * s, 1.05 * s);
    }
  });
  return (
    <group position={CORE_POS}>
      <mesh ref={wobble}>
        <sphereGeometry args={[7, 48, 48]} />
        <meshStandardMaterial
          color="#1c2f63"
          emissive="#3f72d6"
          emissiveIntensity={0.4}
          roughness={0.4}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* principal axes σ₁u₁ ≥ σ₂u₂ ≥ σ₃u₃ */}
      <Axis dir={[1, 0, 0]} length={12} color="#39d7ff" />
      <Axis dir={[0, 1, 0]} length={5} color="#8fe0ff" />
      <Axis dir={[0, 0, 1]} length={7.5} color="#5db4ff" />
    </group>
  );
}

/**
 * The rank-one layers σᵢ·uᵢvᵢᵀ as a stack of glowing sheets. The dominant
 * layer is largest and brightest; each successive layer contributes less,
 * exactly as the singular values decay.
 */
function LayerStack() {
  const group = useRef<THREE.Group>(null);
  const sheets = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const w = 1 - i / 9; // descending "energy"
        return {
          y: LAYER_STACK[1] + 7 - i * 2.1,
          scale: 6 * w + 1.4,
          intensity: 0.25 + 0.85 * w,
          opacity: 0.3 + 0.45 * w,
        };
      }),
    []
  );
  useFrame(({ clock }) => {
    if (group.current)
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.08;
  });
  return (
    <group ref={group} position={[LAYER_STACK[0], 0, LAYER_STACK[2]]}>
      {sheets.map((s, i) => (
        <mesh key={i} position={[0, s.y - LAYER_STACK[1], 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[s.scale, s.scale]} />
          <meshStandardMaterial
            color="#39d7ff"
            emissive="#39d7ff"
            emissiveIntensity={s.intensity}
            transparent
            opacity={s.opacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* the column the sheets sum along */}
      <mesh position={[0, 7 - 6 * 2.1 / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 14, 8]} />
        <meshBasicMaterial color="#bfeaff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** A transformed coordinate grid: the parallelogram lattice A maps space to. */
function TransformedGrid() {
  const positions = useMemo(() => {
    const arr: number[] = [];
    const N = 8;
    const span = 11;
    // skew basis to read as a sheared (transformed) grid
    const ax = [1.0, 0.0];
    const ay = [0.45, 0.9];
    const map = (u: number, v: number) => [
      (ax[0] * u + ay[0] * v) * span,
      (ax[1] * u + ay[1] * v) * span,
    ];
    for (let i = -N; i <= N; i++) {
      const a = map(i / N, -1), b = map(i / N, 1);
      arr.push(a[0], 0, a[1], b[0], 0, b[1]);
      const c = map(-1, i / N), e = map(1, i / N);
      arr.push(c[0], 0, c[1], e[0], 0, e[1]);
    }
    return new Float32Array(arr);
  }, []);
  return (
    <group position={[-20, DEEP_Y - 6, -6]} rotation={[0.5, 0.3, 0.1]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#5db4ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/** The way home: a glowing ring of light back up through the prism. */
function ReturnRing() {
  const ring = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.25;
    if (glow.current) glow.current.opacity = 0.5 + 0.3 * Math.sin(t * 1.8);
  });
  return (
    <group position={RETURN_RING}>
      <mesh ref={ring}>
        <torusGeometry args={[3.2, 0.18, 16, 64]} />
        <meshStandardMaterial color="#9fe0ff" emissive="#5db4ff" emissiveIntensity={1.3} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh>
        <circleGeometry args={[3, 48]} />
        <meshBasicMaterial
          ref={glow}
          color="#cfe6ff"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#7cc8ff" intensity={2.5} distance={30} decay={1.6} />
    </group>
  );
}
