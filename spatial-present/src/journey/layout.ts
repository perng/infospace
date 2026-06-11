/**
 * Shared spatial constants between the project document (anchors, camera
 * poses) and the procedural world scenery. The atrium (the macro gallery of
 * linear maps) lives around the origin; the spectral interior — the inside
 * of a matrix's decomposition — lives far below it. The portal transition
 * teleports the camera between the two coordinate neighbourhoods behind a
 * fade, giving a continuous "into the matrix" illusion.
 */
export const DEEP_Y = -400;

/** The prism portal object in the atrium, and its glowing lens surface. */
export const PRISM_POS: [number, number, number] = [0, 0, -17];
export const LENS_POS: [number, number, number] = [0, 2.05, -17];

/** Landmarks inside the spectral interior. */
export const CORE_POS: [number, number, number] = [0, DEEP_Y - 2, -18];
export const LAYER_STACK: [number, number, number] = [17, DEEP_Y + 1, 6];
export const RETURN_RING: [number, number, number] = [0, DEEP_Y + 6, 40];
