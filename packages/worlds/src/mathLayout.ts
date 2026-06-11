/**
 * Shared spatial constants between the math worlds' scenery and their
 * templates. The lecture hall sits around the origin with its board wall
 * at the front (negative z); the math void is its own world, so it can
 * also use the origin neighbourhood — only one world is visible at a time
 * and portals teleport the camera behind a fade.
 */

/** Lecture hall: the front wall carrying the blackboards. */
export const HALL_FRONT_Z = -16;
export const BOARD_Y = 3.2;
/** x positions of the three board panels on the front wall. */
export const BOARD_X = [-4.4, 0, 4.4] as const;

/** Math void: the hero plinth and the glowing return gate. */
export const VOID_PLINTH: [number, number, number] = [0, 3, -6];
export const VOID_CIRCLE: [number, number, number] = [10, 2.5, -12];
export const VOID_GATE: [number, number, number] = [0, 3, 30];
