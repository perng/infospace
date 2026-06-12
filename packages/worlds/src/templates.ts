import type { WorldTemplate } from "@spatial-present/schema";
import {
  DEEP_Y,
  LENS_POS,
  RETURN_RING,
} from "./layout";
import {
  BOARD_X,
  BOARD_Y,
  HALL_FRONT_Z,
  VOID_CIRCLE,
  VOID_GATE,
  VOID_PLINTH,
} from "./mathLayout";

/**
 * The symbolic vocabulary the worlds publish: named stations (content
 * slots with envelopes), and named poses for the framings that are about
 * the world's own geometry (the prism approach, portal dives). Documents
 * reference these names; the compiler owns the coordinates. When the
 * scenery moves, the stations move with it and every journey re-flows.
 */

const HALF = Math.PI / 2;

/** The marble gallery around the origin. Wall bays sit between columns;
 *  bays are numbered front (high z) to back on each wall. */
export const AtriumTemplate: WorldTemplate = {
  id: "atrium",
  stations: {
    "entry.tablet": {
      position: [0, 2.7, 23],
      envelope: { width: 5, height: 3.4 },
    },
    "west-wall.bay-1": {
      position: [-11.8, 2.8, 11.125],
      rotationY: HALF,
      envelope: { width: 5.4, height: 3.6 },
    },
    "west-wall.bay-2": {
      position: [-11.8, 2.9, -2.375],
      rotationY: HALF,
      envelope: { width: 5, height: 2.2 },
    },
    "east-wall.bay-1": {
      position: [11.8, 2.9, 4.375],
      rotationY: -HALF,
      envelope: { width: 4.5, height: 2.6 },
    },
    "east-wall.bay-2": {
      position: [11.8, 2.9, -2.375],
      rotationY: -HALF,
      envelope: { width: 5, height: 3 },
    },
    "east-wall.bay-3": {
      position: [11.8, 2.9, -9.125],
      rotationY: -HALF,
      envelope: { width: 4, height: 2.4 },
    },
    "floor.hologram": {
      position: [-6.5, 0, -4],
      rotationY: 0.5,
      // Taller than the chart itself: the hologram skin floats its title
      // above the bars, and the envelope is what the planner frames.
      envelope: { width: 4.4, height: 3.2, centerY: 1.7 },
    },
    "air.quote": {
      position: [0, 7.5, -3],
      envelope: { width: 9, height: 3.5 },
    },
    "sky.dome": {
      position: [0, 13, -29],
      envelope: { width: 20, height: 10 },
    },
    "prism.plinth": {
      position: [-3.4, 2.6, -12],
      rotationY: 0.3,
      envelope: { width: 3.6, height: 2.6 },
    },
  },
  poses: {
    /** Frames the plinth tablet and the prism together, mid-hall. */
    "prism-approach": {
      position: [0, 2.2, -8.6],
      target: [0, 1.8, -15],
      fov: 50,
    },
    /** Accelerating into the prism's lens — the portal dive. */
    "prism-dive": {
      position: [LENS_POS[0], LENS_POS[1] + 0.35, LENS_POS[2] + 1.1],
      target: LENS_POS,
      fov: 28,
    },
    /** Backing out of the lens when a portal surfaces here. */
    "lens-emerge": {
      position: [LENS_POS[0], LENS_POS[1] + 0.6, LENS_POS[2] + 2],
      target: LENS_POS,
      fov: 60,
    },
  },
};

/** The spectral interior far below the atrium — inside the decomposition. */
export const SpectralTemplate: WorldTemplate = {
  id: "spectral",
  stations: {
    "arrival.overlook": {
      position: [0, DEEP_Y + 6, 24],
      envelope: { width: 11, height: 4 },
    },
    "core.plate": {
      position: [0, DEEP_Y + 4, -3],
      envelope: { width: 4.8, height: 3.2 },
    },
    "field.hologram": {
      position: [15, DEEP_Y - 1.5, 11],
      rotationY: -0.5,
      // Same as floor.hologram: include the floating title in the envelope.
      envelope: { width: 3.6, height: 3.2, centerY: 1.7 },
    },
    "layers.gallery": {
      position: [-24, DEEP_Y + 5, 16],
      rotationY: 0.85,
      envelope: { width: 9, height: 3.5 },
    },
    "ring.return": {
      position: [RETURN_RING[0], RETURN_RING[1] + 1.5, RETURN_RING[2] - 1],
      rotationY: Math.PI,
      envelope: { width: 8, height: 3 },
    },
  },
  poses: {
    /** Flying into the return ring — the portal dive back up. */
    "ring-dive": {
      position: RETURN_RING,
      target: [RETURN_RING[0], RETURN_RING[1], RETURN_RING[2] + 6],
      fov: 30,
    },
    /** The plunge arrival: high above the ellipsoid, falling toward it. */
    "deep-emerge": {
      position: [0, DEEP_Y + 30, 70],
      target: [0, DEEP_Y + 4, 0],
      fov: 75,
    },
  },
};

/** A small evening lecture hall. Three board panels share the front wall;
 *  the chalkboard skin brings its own slate, so the panels are stations,
 *  not scenery. The portal dives straight into the center board. */
export const LectureHallTemplate: WorldTemplate = {
  id: "lecture-hall",
  stations: {
    "board.left": {
      position: [BOARD_X[0], BOARD_Y, HALL_FRONT_Z + 0.3],
      envelope: { width: 3.8, height: 2.8 },
    },
    "board.center": {
      position: [BOARD_X[1], BOARD_Y, HALL_FRONT_Z + 0.3],
      envelope: { width: 3.8, height: 2.8 },
    },
    "board.right": {
      position: [BOARD_X[2], BOARD_Y, HALL_FRONT_Z + 0.3],
      envelope: { width: 3.8, height: 2.8 },
    },
    "wall.west": {
      position: [-11.7, 2.9, -6],
      rotationY: Math.PI / 2,
      envelope: { width: 4, height: 3 },
    },
  },
  poses: {
    /** Tight on the center board — the dive into the mathematics. */
    "board-dive": {
      position: [BOARD_X[1], BOARD_Y - 0.1, HALL_FRONT_Z + 2.4],
      target: [BOARD_X[1], BOARD_Y - 0.1, HALL_FRONT_Z],
      fov: 26,
    },
    /** Backing out of the center board when a portal surfaces here. */
    "board-emerge": {
      position: [BOARD_X[1], BOARD_Y - 0.2, HALL_FRONT_Z + 3.6],
      target: [BOARD_X[1], BOARD_Y, HALL_FRONT_Z],
      fov: 58,
    },
  },
};

/** The math void: dark weightless space where mathematics glows. */
export const MathVoidTemplate: WorldTemplate = {
  id: "math-void",
  stations: {
    "plinth.identity": {
      position: VOID_PLINTH,
      envelope: { width: 5.5, height: 3 },
    },
    "gallery.west": {
      position: [-10, 3, -2],
      rotationY: 0.6,
      envelope: { width: 6, height: 3.2 },
    },
    "circle.overlook": {
      position: [VOID_CIRCLE[0], VOID_CIRCLE[1] + 0.5, VOID_CIRCLE[2] + 5],
      rotationY: -0.2,
      envelope: { width: 8, height: 3.5 },
    },
    "screen.theatre": {
      // A frameless projection spot, floating high in the dark.
      position: [-3, 4.2, -17],
      rotationY: 0.25,
      envelope: { width: 7, height: 4.4 },
    },
    "gate.return": {
      position: [VOID_GATE[0], VOID_GATE[1], VOID_GATE[2] - 1],
      rotationY: Math.PI,
      envelope: { width: 6.5, height: 3 },
    },
  },
  poses: {
    /** The plunge arrival: high above the grid, falling toward the plinth. */
    "void-emerge": {
      position: [0, 16, 26],
      target: VOID_PLINTH,
      fov: 72,
    },
    /** Flying into the return gate. */
    "gate-dive": {
      position: [VOID_GATE[0], VOID_GATE[1], VOID_GATE[2] + 0.5],
      target: [VOID_GATE[0], VOID_GATE[1], VOID_GATE[2] + 6],
      fov: 28,
    },
  },
};
