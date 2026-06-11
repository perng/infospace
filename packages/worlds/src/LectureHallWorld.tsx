import * as THREE from "three";
import { BOARD_Y, HALL_FRONT_Z } from "./mathLayout";

const PLASTER = "#3a3128";
const WOOD = "#4a3826";
const WOOD_DARK = "#352818";

/**
 * A small evening lecture hall: wooden floor, plaster walls, bench rows,
 * pendant lamps, and a long chalk rail under the board line on the front
 * wall. The blackboards themselves are content — the chalkboard skin
 * brings its own slate and frame to the board stations — so an empty hall
 * has an empty wall, and a full talk reads as three filled boards.
 */
export function LectureHallWorld({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <Room />
      <Benches />
      <Lectern />
      <Pendants />
      <ambientLight intensity={0.3} color="#cdbb9e" />
      <directionalLight position={[6, 10, 8]} intensity={0.35} color="#e8d9b8" />
      {/* a warm wash on the board wall so chalk reads from the back rows */}
      <pointLight
        position={[0, 5.5, HALL_FRONT_Z + 5]}
        intensity={1.4}
        color="#ffe2b8"
        distance={18}
        decay={1.8}
      />
    </group>
  );
}

function Room() {
  const W = 24;
  const D = 32; // z from HALL_FRONT_Z to HALL_FRONT_Z + D
  const H = 7.5;
  const cz = HALL_FRONT_Z + D / 2;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, cz]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, cz]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#241e16" roughness={0.95} />
      </mesh>
      {/* front (board) wall */}
      <Wall position={[0, H / 2, HALL_FRONT_Z]} rotationY={0} width={W} height={H} />
      {/* back wall */}
      <Wall position={[0, H / 2, HALL_FRONT_Z + D]} rotationY={Math.PI} width={W} height={H} />
      {/* side walls */}
      <Wall position={[-W / 2, H / 2, cz]} rotationY={Math.PI / 2} width={D} height={H} />
      <Wall position={[W / 2, H / 2, cz]} rotationY={-Math.PI / 2} width={D} height={H} />
      {/* chalk rail running under the board line */}
      <mesh position={[0, BOARD_Y - 1.85, HALL_FRONT_Z + 0.18]}>
        <boxGeometry args={[14.6, 0.1, 0.26]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Wall({
  position,
  rotationY,
  width,
  height,
}: {
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={PLASTER} roughness={0.95} />
      </mesh>
      {/* wainscot */}
      <mesh position={[0, -height / 2 + 0.65, 0.02]}>
        <planeGeometry args={[width, 1.3]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Benches() {
  const rows = [-7.5, -4.5, -1.5, 1.5, 4.5].map((z) => z + 4); // hall z space
  const blocks = [-4.6, 4.6];
  return (
    <group>
      {rows.map((z) =>
        blocks.map((x) => (
          <group key={`${x}:${z}`} position={[x, 0, z]}>
            {/* seat */}
            <mesh position={[0, 0.46, 0]} castShadow>
              <boxGeometry args={[7.6, 0.1, 0.55]} />
              <meshStandardMaterial color={WOOD} roughness={0.75} />
            </mesh>
            {/* backrest, on the side away from the board */}
            <mesh position={[0, 0.85, 0.32]}>
              <boxGeometry args={[7.6, 0.5, 0.08]} />
              <meshStandardMaterial color={WOOD} roughness={0.75} />
            </mesh>
            {/* legs */}
            {[-3.5, 3.5].map((lx) => (
              <mesh key={lx} position={[lx, 0.22, 0]}>
                <boxGeometry args={[0.12, 0.44, 0.5]} />
                <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
              </mesh>
            ))}
          </group>
        ))
      )}
    </group>
  );
}

function Lectern() {
  return (
    <group position={[3.4, 0, HALL_FRONT_Z + 3.6]} rotation={[0, 0.25, 0]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.5, 1.24, 0.5]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.5]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Pendants() {
  const spots: [number, number][] = [
    [0, HALL_FRONT_Z + 6],
    [0, HALL_FRONT_Z + 14],
    [0, HALL_FRONT_Z + 22],
  ];
  return (
    <group>
      {spots.map(([x, z]) => (
        <group key={z} position={[x, 0, z]}>
          <mesh position={[0, 6.6, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
            <meshStandardMaterial color="#1d1812" />
          </mesh>
          <mesh position={[0, 5.6, 0]}>
            <coneGeometry args={[0.42, 0.34, 16, 1, true]} />
            <meshStandardMaterial
              color="#2e2418"
              side={THREE.DoubleSide}
              roughness={0.6}
            />
          </mesh>
          <mesh position={[0, 5.52, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color="#ffdfa6" />
          </mesh>
          <pointLight
            position={[0, 5.3, 0]}
            intensity={1.1}
            color="#ffd9a0"
            distance={12}
            decay={1.9}
          />
        </group>
      ))}
    </group>
  );
}
