import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CELL_Y, MITO_CLUSTER, NUCLEUS_POS, RETURN_RING } from "../layout";
import { seededRandom } from "../../framework/random";

/**
 * The micro world: the inside of a single cell, reached through the
 * microscope portal. Everything floats in a fogged cytoplasm sphere.
 */
export function CellWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <Membrane />
      <Cytoplasm />
      <Nucleus />
      <Mitochondria />
      <Golgi />
      <ReturnRing />
      <ambientLight intensity={0.5} color="#7fd8cf" />
      <pointLight position={[0, CELL_Y + 18, 10]} intensity={2} color="#bdfff2" distance={120} decay={1.4} />
      <pointLight position={NUCLEUS_POS} intensity={2.2} color="#b78aff" distance={50} decay={1.5} />
    </group>
  );
}

function Membrane() {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.emissiveIntensity = 0.25 + 0.1 * Math.sin(clock.elapsedTime * 0.7);
  });
  return (
    <group position={[0, CELL_Y, 0]}>
      <mesh>
        <sphereGeometry args={[64, 48, 48]} />
        <meshStandardMaterial
          ref={mat}
          color="#0a3d42"
          emissive="#0e5a55"
          emissiveIntensity={0.3}
          side={THREE.BackSide}
          roughness={0.9}
        />
      </mesh>
      {/* membrane studs — receptor proteins on the inner surface */}
      <MembraneStuds />
    </group>
  );
}

function MembraneStuds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const transforms = useMemo(() => {
    const rand = seededRandom(0x57ad5);
    const dummy = new THREE.Object3D();
    const list: THREE.Matrix4[] = [];
    for (let i = 0; i < 160; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 62.5;
      dummy.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
      dummy.lookAt(0, 0, 0);
      dummy.scale.setScalar(0.6 + rand() * 1.1);
      dummy.updateMatrix();
      list.push(dummy.matrix.clone());
    }
    return list;
  }, []);

  useFrame(() => {
    if (!ref.current || ref.current.userData.done) return;
    transforms.forEach((m, i) => ref.current!.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.userData.done = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 160]}>
      <coneGeometry args={[0.5, 1.6, 8]} />
      <meshStandardMaterial color="#1d7a6e" emissive="#1d7a6e" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

function Cytoplasm() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = seededRandom(0xce11);
    const n = 1800;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.cbrt(rand()) * 58;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = CELL_Y + r * Math.cos(phi);
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
        color="#9ff2dd"
        size={0.22}
        sizeAttenuation
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function Nucleus() {
  const wobble = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (wobble.current) {
      const s = 1 + 0.015 * Math.sin(clock.elapsedTime * 0.9);
      wobble.current.scale.setScalar(s);
    }
  });
  return (
    <group position={NUCLEUS_POS}>
      <mesh ref={wobble}>
        <sphereGeometry args={[11, 48, 48]} />
        <meshStandardMaterial
          color="#3d2a66"
          emissive="#6a3fb0"
          emissiveIntensity={0.35}
          roughness={0.55}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* nucleolus */}
      <mesh position={[2.5, 1.5, 2]}>
        <sphereGeometry args={[3.4, 24, 24]} />
        <meshStandardMaterial color="#8a5cd0" emissive="#9d6ce6" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>
      {/* chromatin threads */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[i * 1.1, i * 0.7, i * 0.4]}>
          <torusKnotGeometry args={[5.5 - i, 0.16, 110, 8, 2 + i, 3]} />
          <meshStandardMaterial color="#b48ae8" emissive="#b48ae8" emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Mitochondria() {
  const group = useRef<THREE.Group>(null);
  const pods = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        pos: [
          MITO_CLUSTER[0] + Math.sin(i * 2.4) * 7,
          MITO_CLUSTER[1] + Math.cos(i * 1.7) * 5,
          MITO_CLUSTER[2] + Math.sin(i * 3.1) * 7,
        ] as [number, number, number],
        rot: [Math.sin(i) * 1.2, i * 0.9, Math.cos(i) * 0.8] as [number, number, number],
        scale: 0.8 + (i % 3) * 0.3,
      })),
    []
  );
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.06;
  });
  return (
    <group ref={group}>
      {pods.map((p, i) => (
        <group key={i} position={p.pos} rotation={p.rot} scale={p.scale}>
          <mesh>
            <capsuleGeometry args={[1.1, 2.6, 8, 18]} />
            <meshStandardMaterial
              color="#a34a20"
              emissive="#e06a28"
              emissiveIntensity={0.5}
              roughness={0.5}
              transparent
              opacity={0.95}
            />
          </mesh>
          {/* cristae folds */}
          {[-0.8, 0, 0.8].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.85, 0.1, 8, 20]} />
              <meshStandardMaterial color="#ffb36b" emissive="#ff9c4a" emissiveIntensity={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Golgi() {
  return (
    <group position={[-18, CELL_Y - 4, -8]} rotation={[0.3, 0.6, 0.1]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * 1.1, 0]} scale={[1 - i * 0.12, 0.25, 1 - i * 0.12]}>
          <sphereGeometry args={[5, 24, 16]} />
          <meshStandardMaterial
            color="#2c8c6a"
            emissive="#37b585"
            emissiveIntensity={0.35}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** The way home: a glowing ring of light back up the optical path. */
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
        <meshStandardMaterial color="#ffca7a" emissive="#ffae45" emissiveIntensity={1.3} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh>
        <circleGeometry args={[3, 48]} />
        <meshBasicMaterial
          ref={glow}
          color="#ffe9c4"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#ffc26b" intensity={2.5} distance={30} decay={1.6} />
    </group>
  );
}
