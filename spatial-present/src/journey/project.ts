import { defineJourney } from "../framework/defineJourney";
import type { PresentationProject } from "../framework/schema";
import { CELL_Y, LENS_POS, MITO_CLUSTER, RETURN_RING } from "./layout";

/**
 * "The Living Cell" — a guided night tour through a natural-history museum
 * that ends by diving through a brass microscope into the cell itself.
 * This document is the source of truth; the 3D scene and the linear
 * outline are both derived from it.
 */
const doc: PresentationProject = {
  schemaVersion: "0.1",
  id: "living-cell-tour",
  title: "The Living Cell — A Night Tour",
  startBeatId: "b-entrance",

  worlds: [
    {
      id: "museum",
      name: "Gallery of Natural History",
      unitScale: "human",
      ambience: {
        background: "#070a14",
        fogColor: "#0a0c16",
        fogNear: 30,
        fogFar: 110,
      },
    },
    {
      id: "cell",
      name: "Inside the Cell",
      unitScale: "micro",
      ambience: {
        background: "#03191c",
        fogColor: "#06272b",
        fogNear: 25,
        fogFar: 120,
      },
    },
  ],

  content: [
    {
      id: "c-welcome",
      kind: "text",
      title: "The Living Cell",
      body:
        "Welcome to the Gallery of the Living Cell. Tonight we walk from these marble halls down through the lens of a microscope, into the smallest unit of life.\n\nFollow the carved route — or wander. Every exhibit knows its place in the story.",
    },
    {
      id: "c-what-is-cell",
      kind: "text",
      title: "What Is a Cell?",
      body:
        "Every living thing is built from cells: self-contained workshops that read instructions, build molecular machines, and copy themselves. Your body runs about 36 trillion of them. A bacterium makes do with one.\n\nThe word came before the science. When Robert Hooke examined cork in 1665, the tiny chambers reminded him of monks' rooms in a monastery — cellulae.",
    },
    {
      id: "c-hooke-portrait",
      kind: "image",
      src: "/assets/hooke-portrait.png",
      title: "The Microscopist, c. 1665 (imagined)",
      caption:
        "No verified portrait of Robert Hooke survives — possibly lost in his feud with Newton. This painting imagines the man who named the cell.",
      alt: "An oil portrait in seventeenth-century style of a natural philosopher beside a brass microscope. No verified portrait of Robert Hooke survives; this painting imagines the man behind Micrographia.",
    },
    {
      id: "c-cork-mural",
      kind: "image",
      src: "/assets/micrographia-cork.png",
      title: "Cork, as Hooke drew it — the first cells ever named",
      caption:
        "Hooke's 1665 engraving of cork: a honeycomb of empty walls. He called the little chambers 'cells', after a monastery's rooms.",
      alt: "An engraving-style illustration of a thin slice of cork seen through an early microscope, showing the honeycomb of empty cell walls that Hooke described in Micrographia, 1665.",
    },
    {
      id: "c-exhibit-film",
      kind: "video",
      src: "/assets/exhibit-film.webm",
      title: "Exhibit film — Paramecium under the microscope (2014)",
      caption:
        "A living Paramecium swims by beating thousands of cilia — single-celled life in motion. Footage: Wikimedia Commons.",
      alt: "Real microscope footage of Paramecium, single-celled organisms, swimming by beating their cilia. Recorded with a Microbescope; courtesy of Wikimedia Commons.",
    },
    {
      id: "c-size-chart",
      kind: "chart",
      data: {
        type: "bar",
        title: "How Big Is a Cell? (diameter, log scale)",
        unit: "µm",
        logScale: true,
        series: [
          { label: "Bacterium", value: 2 },
          { label: "Red blood cell", value: 8 },
          { label: "White blood cell", value: 12 },
          { label: "Skin cell", value: 30 },
          { label: "Human egg", value: 120 },
        ],
      },
      fallbackText:
        "Typical cell diameters in micrometres: bacterium 2, red blood cell 8, white blood cell 12, skin cell 30, human egg 120. The human egg is the only human cell visible to the naked eye.",
    },
    {
      id: "c-mito-chart",
      kind: "chart",
      data: {
        type: "bar",
        title: "Mitochondria per Cell (typical)",
        unit: "",
        series: [
          { label: "Skin cell", value: 300 },
          { label: "Liver cell", value: 1500 },
          { label: "Neuron", value: 2000 },
          { label: "Heart muscle", value: 5000 },
        ],
      },
      fallbackText:
        "Approximate mitochondria per cell: skin cell 300, liver cell 1,500, neuron 2,000, heart muscle cell 5,000. The hungrier the tissue, the more power stations it keeps.",
    },
    {
      id: "c-cell-sky",
      kind: "chart",
      data: {
        type: "scatter",
        title: "The Cellular Sky — every kind of cell in one body",
        xLabel: "cell size (µm, log)",
        yLabel: "population in one human body (log)",
        points: [
          { x: 2, y: 3.8e13, label: "Gut bacteria" },
          { x: 8, y: 2.5e13, label: "Red blood cells" },
          { x: 3, y: 1.5e12, label: "Platelets" },
          { x: 25, y: 2.4e11, label: "Liver cells" },
          { x: 10, y: 8.6e10, label: "Neurons" },
          { x: 30, y: 3.5e10, label: "Skin cells" },
          { x: 100, y: 5e10, label: "Fat cells" },
          { x: 120, y: 3e4, label: "Egg cells" },
        ],
      },
      fallbackText:
        "Scatter of cell size versus population in one human body (both log scale): gut bacteria (2 µm, 38 trillion), red blood cells (8 µm, 25 trillion), platelets (3 µm, 1.5 trillion), liver cells (25 µm, 240 billion), neurons (10 µm body, 86 billion), skin cells (30 µm, 35 billion), fat cells (100 µm, 50 billion), egg cells (120 µm, about thirty thousand).",
    },
    {
      id: "c-hooke-quote",
      kind: "text",
      title: "Robert Hooke, Micrographia, 1665",
      body:
        "“…I could exceedingly plainly perceive it to be all perforated and porous, much like a Honey-comb… these pores, or cells, were indeed the first microscopical pores I ever saw.”",
    },
    {
      id: "c-threshold",
      kind: "text",
      title: "The Brass Threshold",
      body:
        "Every great museum keeps one door it rarely opens. Ours is made of glass and light.\n\nStep up to the eyepiece. The next wing of this gallery is ten thousand times smaller than the last.",
    },
    {
      id: "c-cell-gate",
      kind: "text",
      title: "Inside the Cell",
      body:
        "You are now twenty-five micrometres tall. The sea around you is cytoplasm. The lights in the distance are organelles — the cell's working organs.",
    },
    {
      id: "c-nucleus",
      kind: "text",
      title: "The Nucleus",
      body:
        "The cell's library. Two metres of DNA, wound and folded into a sphere a few millionths of a metre wide.\n\nPlans are read here and sent out as messenger RNA. The library lends copies — never originals.",
    },
    {
      id: "c-atp-chart",
      kind: "chart",
      data: {
        type: "bar",
        title: "ATP per Molecule of Glucose",
        unit: "ATP",
        series: [
          { label: "Glycolysis alone", value: 2 },
          { label: "With mitochondria", value: 32 },
        ],
      },
      fallbackText:
        "Energy yield per molecule of glucose: glycolysis alone produces 2 ATP; with mitochondrial respiration the cell harvests about 32 ATP — a sixteen-fold gain.",
    },
    {
      id: "c-membrane",
      kind: "text",
      title: "The Membrane",
      body:
        "Two molecules thin, the membrane decides what enters and what leaves. Gates, pumps and receptors stud its surface — a customs office for a city of one.",
    },
    {
      id: "c-return",
      kind: "text",
      title: "Back Up the Lens",
      body:
        "The tour returns the way all science does — back up the lens, carrying what it learned.",
    },
  ],

  anchors: [
    {
      id: "a-entrance",
      worldId: "museum",
      name: "Entrance Tablet",
      position: [0, 2.7, 23],
      rotationY: 0,
      semanticRole: "chapter",
      contentIds: ["c-welcome"],
    },
    {
      id: "a-what-is-cell",
      worldId: "museum",
      name: "West Wall — Definition",
      // Seated in the bay between columns (cols sit at z=7.75 and 14.5).
      position: [-11.8, 2.8, 11.125],
      rotationY: Math.PI / 2,
      semanticRole: "detail",
      contentIds: ["c-what-is-cell"],
    },
    {
      id: "a-hooke-portrait",
      worldId: "museum",
      name: "East Wall — The Microscopist",
      position: [11.8, 2.9, 4.375],
      rotationY: -Math.PI / 2,
      semanticRole: "media",
      contentIds: ["c-hooke-portrait"],
    },
    {
      id: "a-cork-mural",
      worldId: "museum",
      name: "West Wall — Cork Mural",
      position: [-11.8, 2.9, -2.375],
      rotationY: Math.PI / 2,
      semanticRole: "media",
      contentIds: ["c-cork-mural"],
    },
    {
      id: "a-film",
      worldId: "museum",
      name: "East Wall — Kinema Plaque",
      position: [11.8, 2.9, -9.125],
      rotationY: -Math.PI / 2,
      semanticRole: "media",
      contentIds: ["c-exhibit-film"],
    },
    {
      id: "a-size-holo",
      worldId: "museum",
      name: "Hologram — Cell Sizes",
      position: [-6.5, 0, -4],
      rotationY: 0.5,
      semanticRole: "chart",
      contentIds: ["c-size-chart"],
    },
    {
      id: "a-mito-holo",
      worldId: "museum",
      name: "Hologram — Mitochondria Census",
      position: [5.5, 0, -10],
      rotationY: -0.45,
      semanticRole: "chart",
      contentIds: ["c-mito-chart"],
    },
    {
      id: "a-quote",
      worldId: "museum",
      name: "The Hooke Quote",
      position: [0, 7.5, -3],
      rotationY: 0,
      semanticRole: "quote",
      contentIds: ["c-hooke-quote"],
    },
    {
      id: "a-sky",
      worldId: "museum",
      name: "The Cellular Sky",
      position: [0, 13, -29],
      rotationY: 0,
      semanticRole: "chart",
      contentIds: ["c-cell-sky"],
    },
    {
      id: "a-microscope",
      worldId: "museum",
      name: "The Brass Microscope",
      position: [-3.4, 2.6, -12],
      rotationY: 0.3,
      semanticRole: "portal",
      contentIds: ["c-threshold"],
    },
    {
      id: "a-cell-gate",
      worldId: "cell",
      name: "Cytoplasm Arrival",
      position: [0, CELL_Y + 6, 24],
      rotationY: 0,
      semanticRole: "chapter",
      contentIds: ["c-cell-gate"],
    },
    {
      id: "a-nucleus",
      worldId: "cell",
      name: "Specimen Plate — Nucleus",
      position: [0, CELL_Y + 4, -3],
      rotationY: 0,
      semanticRole: "detail",
      contentIds: ["c-nucleus"],
    },
    {
      id: "a-mito",
      worldId: "cell",
      name: "Hologram — Energy Yield",
      position: [MITO_CLUSTER[0] - 2, CELL_Y - 1.5, MITO_CLUSTER[2] + 5],
      rotationY: -0.5,
      semanticRole: "chart",
      contentIds: ["c-atp-chart"],
    },
    {
      id: "a-membrane",
      worldId: "cell",
      name: "The Membrane Frontier",
      position: [-24, CELL_Y + 5, 16],
      rotationY: 0.85,
      semanticRole: "detail",
      contentIds: ["c-membrane"],
    },
    {
      id: "a-return",
      worldId: "cell",
      name: "Return Ring",
      position: [RETURN_RING[0], RETURN_RING[1] + 1.5, RETURN_RING[2] - 1],
      rotationY: Math.PI,
      semanticRole: "portal",
      contentIds: ["c-return"],
    },
  ],

  beats: [
    {
      id: "b-entrance",
      anchorId: "a-entrance",
      title: "Welcome",
      camera: { position: [0, 2.1, 29.5], target: [0, 2.6, 23], fov: 55 },
      notes:
        "Welcome everyone. Set the premise: this is not a slide deck, it is a building. Tonight's route runs the length of the hall and then somewhere no museum can normally go.",
    },
    {
      id: "b-what-is-cell",
      anchorId: "a-what-is-cell",
      title: "What is a cell?",
      camera: { position: [-5.5, 2.6, 11.125], target: [-11.8, 2.6, 11.125], fov: 52 },
      notes:
        "36 trillion cells in a human body. Land on the etymology: Hooke named them after monastery rooms before anyone knew what they did.",
    },
    {
      id: "b-hooke",
      anchorId: "a-hooke-portrait",
      title: "The microscopist",
      camera: { position: [5.4, 2.5, 4.375], target: [11.8, 2.3, 4.375], fov: 50 },
      notes:
        "Fun fact: no verified portrait of Hooke survives — possibly thanks to his feud with Newton. This painting is an imagination, and the plaque says so.",
    },
    {
      id: "b-cork",
      anchorId: "a-cork-mural",
      title: "Cork, 1665",
      camera: { position: [-5.0, 2.5, -2.375], target: [-11.8, 2.4, -2.375], fov: 52 },
      notes:
        "What Hooke actually saw: dead cell walls in cork, a honeycomb of emptiness. The name stuck to the living thing later.",
    },
    {
      id: "b-film",
      anchorId: "a-film",
      title: "Life in motion",
      camera: { position: [5.0, 2.5, -9.125], target: [11.8, 2.4, -9.125], fov: 52 },
      notes:
        "Let the film run for ten seconds. Point out that motion is the hardest thing for a drawing to teach and the easiest for a film.",
    },
    {
      id: "b-sizes",
      anchorId: "a-size-holo",
      title: "How big is a cell?",
      camera: { position: [-3.2, 2.4, -0.8], target: [-6.5, 1.7, -4], fov: 55 },
      notes:
        "Log scale! Each bar step hides a 10x jump. The human egg is the only human cell you can see unaided — about the size of this full stop.",
    },
    {
      id: "b-mito-census",
      anchorId: "a-mito-holo",
      title: "The mitochondria census",
      camera: { position: [3.8, 2.4, -5.2], target: [5.5, 1.8, -10], fov: 52 },
      notes:
        "The hungrier the tissue, the more power stations it keeps. Heart muscle is the gluttony champion at ~5,000 per cell.",
    },
    {
      id: "b-quote",
      anchorId: "a-quote",
      title: "Hooke's own words",
      camera: { position: [0, 5.8, 5.5], target: [0, 7.5, -3], fov: 55 },
      notes:
        "Read the quote aloud, slowly. 'The first microscopical pores I ever saw' — the moment a word became a science.",
    },
    {
      id: "b-sky",
      anchorId: "a-sky",
      title: "The cellular sky",
      camera: { position: [0, 4.5, -8], target: [0, 13, -29], fov: 60 },
      notes:
        "Every star is a kind of cell in one human body, placed by size and population. Both axes are logarithmic — this sky spans nine orders of magnitude.",
    },
    {
      id: "b-microscope",
      anchorId: "a-microscope",
      title: "The brass threshold",
      camera: { position: [0, 2.2, -8.6], target: [0, 1.8, -15], fov: 50 },
      notes:
        "Build anticipation. Ask the room: what is the one exhibit a natural history museum can never put behind glass? The inside of the glass itself. Then advance — through the lens.",
    },
    {
      id: "b-cell-gate",
      anchorId: "a-cell-gate",
      title: "Through the lens",
      camera: {
        position: [0, CELL_Y + 7, 36],
        target: [0, CELL_Y + 4, 0],
        fov: 60,
      },
      notes:
        "Pause here. Let the scale shift sink in: we are now 10,000x smaller. The fog is cytoplasm; everything that glows is machinery.",
    },
    {
      id: "b-nucleus",
      anchorId: "a-nucleus",
      title: "The nucleus",
      camera: {
        position: [0, CELL_Y + 4.5, 7],
        target: [0, CELL_Y + 2, -10],
        fov: 55,
      },
      notes:
        "Two metres of DNA in every nucleus. If the nucleus were this room, the DNA would be a thread 800 km long, and it still would not tangle.",
    },
    {
      id: "b-mito",
      anchorId: "a-mito",
      title: "The power stations",
      camera: {
        position: [10, CELL_Y + 2.5, 17],
        target: [16, CELL_Y + 1, 7],
        fov: 55,
      },
      notes:
        "The 16x energy gain is why complex life waited two billion years for the mitochondrion. Glycolysis pays in coins; respiration pays in notes.",
    },
    {
      id: "b-membrane",
      anchorId: "a-membrane",
      title: "The frontier",
      camera: {
        position: [-16.5, CELL_Y + 5, 22.5],
        target: [-26, CELL_Y + 5, 12],
        fov: 55,
      },
      notes:
        "End of the inner tour. The membrane is the cell's border, customs office and sensory skin all at once.",
    },
    {
      id: "b-return",
      anchorId: "a-return",
      title: "Back up the lens",
      camera: {
        position: [0, CELL_Y + 7, 28],
        target: [0, CELL_Y + 7.5, 39],
        fov: 55,
      },
      notes:
        "Close the loop: through the ring and back to the gallery. Take questions standing at the microscope.",
    },
  ],

  routes: [
    { id: "r1", from: "b-entrance", to: "b-what-is-cell", kind: "primary", transition: "fly" },
    { id: "r2", from: "b-what-is-cell", to: "b-hooke", kind: "primary", transition: "fly" },
    { id: "r3", from: "b-hooke", to: "b-cork", kind: "primary", transition: "fly" },
    { id: "r4", from: "b-cork", to: "b-film", kind: "primary", transition: "fly" },
    { id: "r5", from: "b-film", to: "b-sizes", kind: "primary", transition: "fly" },
    { id: "r6", from: "b-sizes", to: "b-mito-census", kind: "primary", transition: "dolly" },
    { id: "r7", from: "b-mito-census", to: "b-quote", kind: "primary", transition: "fly" },
    { id: "r8", from: "b-quote", to: "b-sky", kind: "primary", transition: "dolly" },
    { id: "r9", from: "b-sky", to: "b-microscope", kind: "primary", transition: "fly" },
    {
      id: "r-portal-down",
      from: "b-microscope",
      to: "b-cell-gate",
      kind: "portal",
      label: "Through the lens",
      transition: "portal",
      divePose: {
        position: [LENS_POS[0], LENS_POS[1] + 0.35, LENS_POS[2] + 1.1],
        target: LENS_POS,
        fov: 28,
      },
      emergePose: {
        position: [0, CELL_Y + 30, 70],
        target: [0, CELL_Y + 4, 0],
        fov: 75,
      },
    },
    { id: "r10", from: "b-cell-gate", to: "b-nucleus", kind: "primary", transition: "dolly" },
    { id: "r11", from: "b-nucleus", to: "b-mito", kind: "primary", transition: "fly" },
    { id: "r12", from: "b-mito", to: "b-membrane", kind: "primary", transition: "fly" },
    { id: "r13", from: "b-membrane", to: "b-return", kind: "primary", transition: "fly" },
    {
      id: "r-portal-up",
      from: "b-return",
      to: "b-microscope",
      kind: "portal",
      label: "Surface to the gallery",
      transition: "portal",
      divePose: {
        position: RETURN_RING,
        target: [RETURN_RING[0], RETURN_RING[1], RETURN_RING[2] + 6],
        fov: 30,
      },
      emergePose: {
        position: [LENS_POS[0], LENS_POS[1] + 0.6, LENS_POS[2] + 2],
        target: LENS_POS,
        fov: 60,
      },
    },
    // Branches and shortcuts for live improvisation.
    {
      id: "r-skip-history",
      from: "b-what-is-cell",
      to: "b-sizes",
      kind: "branch",
      label: "Skip the history wing",
      transition: "fly",
    },
    {
      id: "r-skip-quote",
      from: "b-mito-census",
      to: "b-sky",
      kind: "branch",
      label: "Straight to the sky",
      transition: "fly",
    },
    {
      id: "r-quote-return",
      from: "b-sky",
      to: "b-quote",
      kind: "return",
      label: "Revisit the quote",
      transition: "dolly",
    },
    {
      id: "r-energy-shortcut",
      from: "b-cell-gate",
      to: "b-mito",
      kind: "branch",
      label: "Straight to the power stations",
      transition: "fly",
    },
    {
      id: "r-membrane-back",
      from: "b-membrane",
      to: "b-nucleus",
      kind: "return",
      label: "Back to the nucleus",
      transition: "fly",
    },
  ],

  skins: [
    { id: "s-welcome", contentId: "c-welcome", anchorId: "a-entrance", skinKind: "engraving", params: { width: 5, height: 3.4 } },
    { id: "s-what", contentId: "c-what-is-cell", anchorId: "a-what-is-cell", skinKind: "engraving", params: { width: 5.4, height: 3.6 } },
    { id: "s-hooke", contentId: "c-hooke-portrait", anchorId: "a-hooke-portrait", skinKind: "plaque", params: { width: 2.2, height: 2.7 } },
    { id: "s-cork", contentId: "c-cork-mural", anchorId: "a-cork-mural", skinKind: "plaque", params: { width: 3.6, height: 2.7 } },
    { id: "s-film", contentId: "c-exhibit-film", anchorId: "a-film", skinKind: "plaque", params: { width: 3.8, height: 2.14 } },
    { id: "s-sizes", contentId: "c-size-chart", anchorId: "a-size-holo", skinKind: "hologram", params: { width: 4.4, height: 2.2 } },
    { id: "s-mito-census", contentId: "c-mito-chart", anchorId: "a-mito-holo", skinKind: "hologram", params: { width: 4, height: 2.2 } },
    { id: "s-quote", contentId: "c-hooke-quote", anchorId: "a-quote", skinKind: "cloudText", params: { width: 9 } },
    { id: "s-sky", contentId: "c-cell-sky", anchorId: "a-sky", skinKind: "constellation", params: { width: 20, height: 10 } },
    { id: "s-threshold", contentId: "c-threshold", anchorId: "a-microscope", skinKind: "engraving", params: { width: 3.6, height: 2.6, stoneColor: "#8c7e5e" } },
    { id: "s-cell-gate", contentId: "c-cell-gate", anchorId: "a-cell-gate", skinKind: "cloudText", params: { width: 11, color: "#a9f0e2" } },
    { id: "s-nucleus", contentId: "c-nucleus", anchorId: "a-nucleus", skinKind: "engraving", params: { width: 4.6, height: 3.2, stoneColor: "#6f7f8c" } },
    { id: "s-atp", contentId: "c-atp-chart", anchorId: "a-mito", skinKind: "hologram", params: { width: 3.4, height: 2.4 } },
    { id: "s-membrane", contentId: "c-membrane", anchorId: "a-membrane", skinKind: "cloudText", params: { width: 9, color: "#9fd8f0" } },
    { id: "s-return", contentId: "c-return", anchorId: "a-return", skinKind: "cloudText", params: { width: 8, color: "#ffd9a8" } },
  ],
};

export const journey = defineJourney(doc);
