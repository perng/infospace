import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededRandom } from "@spatial-present/core";
import { VOID_CIRCLE, VOID_GATE } from "./mathLayout";

const GRID = "#16204a";
const CYAN = "#67d8ff";
const INDIGO = "#7d6cff";

/**
 * The math void: a dark, weightless space where mathematics glows —
 * a faint coordinate grid below, drifting motes, a living unit circle
 * tracing e^{i\theta}, distant manifold curves, and a luminous gate
 * back to wherever the talk came from.
 */
export function MathVoidWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <GridFloor />
      <Motes />
      <UnitCircle />
      <ManifoldCurves />
      <ReturnGate />
      <ambientLight intensity={0.45} color="#8d9bd8" />
      <pointLight position={[0, 8, 2]} intensity={1.6} color="#a8c4ff" distance={40} decay={1.6} />
      <pointLight position={VOID_CIRCLE} intensity={1.2} color={CYAN} distance={18} decay={1.7} />
    </group>
  );
}

function GridFloor() {
  const geometry = useMemo(() => {
    const size = 160;
    const step = 4;
    const points: number[] = [];
    for (let i = -size / 2; i <= size / 2; i += step) {
      points.push(i, 0, -size / 2, i, 0, size / 2);
      points.push(-size / 2, 0, i, size / 2, 0, i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geometry} position={[0, -1.5, 0]}>
      <lineBasicMaterial color={GRID} transparent opacity={0.55} />
    </lineSegments>
  );
}

function Motes() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rand = seededRandom(0xe01e5);
    const n = 1600;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.cbrt(rand()) * 70;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = 4 + r * Math.cos(phi) * 0.5;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.006;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9db8e8"
        size={0.06}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** A living unit circle: a glowing ring with the point e^{i\theta}
 *  orbiting it, radius bar tracking — the diagram from the boards, alive. */
function UnitCircle() {
  const marker = useRef<THREE.Mesh>(null);
  const radius = useRef<THREE.Group>(null);
  const R = 3;
  useFrame(({ clock }) => {
    const theta = clock.elapsedTime * 0.45;
    if (marker.current)
      marker.current.position.set(R * Math.cos(theta), R * Math.sin(theta), 0);
    if (radius.current) radius.current.rotation.z = theta;
  });
  return (
    <group position={VOID_CIRCLE} rotation={[0, -0.35, 0]}>
      <mesh>
        <torusGeometry args={[R, 0.035, 12, 96]} />
        <meshBasicMaterial color={CYAN} />
      </mesh>
      {/* axes */}
      <mesh>
        <boxGeometry args={[R * 2.6, 0.015, 0.015]} />
        <meshBasicMaterial color="#3c5288" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.015, R * 2.6, 0.015]} />
        <meshBasicMaterial color="#3c5288" />
      </mesh>
      {/* rotating radius: pivot at the origin, bar spanning 0..R */}
      <group ref={radius}>
        <mesh position={[R / 2, 0, 0]}>
          <boxGeometry args={[R, 0.03, 0.03]} />
          <meshBasicMaterial color="#cfe8ff" transparent opacity={0.9} />
        </mesh>
      </group>
      <mesh ref={marker}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function ManifoldCurves() {
  const curves = useMemo(() => {
    const rand = seededRandom(0x3a7b2);
    return [0, 1, 2].map((k) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = (i / 24) * Math.PI * 4;
        pts.push(
          new THREE.Vector3(
            -40 + 80 * (i / 24),
            8 + 6 * Math.sin(t * (0.5 + k * 0.2)) + rand() * 1.5,
            -45 - k * 8 + 5 * Math.cos(t * 0.7)
          )
        );
      }
      return new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        96,
        0.04,
        6,
        false
      );
    });
  }, []);
  const colors = [INDIGO, CYAN, "#4f7cd8"];
  return (
    <group>
      {curves.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial color={colors[i]} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/** The way back: a glowing ring, slowly breathing. */
function ReturnGate() {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current)
      mat.current.opacity = 0.65 + 0.3 * Math.sin(clock.elapsedTime * 1.6);
  });
  return (
    <group position={VOID_GATE}>
      <mesh>
        <torusGeometry args={[3.4, 0.09, 14, 80]} />
        <meshBasicMaterial ref={mat} color={INDIGO} transparent opacity={0.8} />
      </mesh>
      <pointLight color={INDIGO} intensity={1.8} distance={16} decay={1.8} />
    </group>
  );
}
