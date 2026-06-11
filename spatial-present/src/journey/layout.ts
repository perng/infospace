/**
 * Shared spatial constants between the project document (anchors, camera
 * poses) and the procedural world scenery. The museum lives around the
 * origin; the cell world lives far below it — the portal transition
 * teleports the camera between the two coordinate neighbourhoods behind
 * a fade, giving a continuous "through the lens" illusion.
 */
export const CELL_Y = -400;

export const MICROSCOPE_POS: [number, number, number] = [0, 0, -17];
export const LENS_POS: [number, number, number] = [0, 2.05, -17];

export const NUCLEUS_POS: [number, number, number] = [0, CELL_Y - 2, -18];
export const MITO_CLUSTER: [number, number, number] = [17, CELL_Y + 1, 6];
export const RETURN_RING: [number, number, number] = [0, CELL_Y + 6, 40];
