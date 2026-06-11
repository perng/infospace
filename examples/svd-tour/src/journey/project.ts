import { defineJourney } from "@spatial-present/core";
import type { AuthoredProjectInput } from "@spatial-present/schema";
import { AtriumTemplate, SpectralTemplate } from "@spatial-present/worlds";

/**
 * "Singular Value Decomposition - A Guided Tour" — a walk through a marble
 * atrium that explains how every matrix is a rotation, a set of stretches,
 * and a rotation, then dives through a light-splitting prism into the
 * decomposition itself. This document is the source of truth; the 3D scene
 * and the linear outline are both derived from it.
 *
 * In-world text is rendered with the bundled Latin fonts (Inter / Cinzel),
 * which carry no Greek or subscript glyphs, so rendered strings stay ASCII
 * ("sigma", "V^T"). The precise typeset notation (A = U S V-transpose with
 * real Greek) lives in the generated diagram image instead.
 *
 * The document is positionless: anchors name stations published by the
 * world templates, beats name camera intents (or template poses), and the
 * primary route chain is implied by beat order. The compiler resolves all
 * geometry; raw positions/poses remain available as escape hatches.
 */
const doc: AuthoredProjectInput = {
  schemaVersion: "0.1",
  id: "svd-tour",
  title: "Singular Value Decomposition - A Guided Tour",
  startBeatId: "b-welcome",

  worlds: [
    {
      id: "atrium",
      name: "The Atrium of Linear Maps",
      unitScale: "human",
      ambience: {
        background: "#070a14",
        fogColor: "#0a0c16",
        fogNear: 30,
        fogFar: 110,
        accent: "#6f86c8",
      },
    },
    {
      id: "spectral",
      name: "Inside the Decomposition",
      unitScale: "micro",
      ambience: {
        background: "#040a1c",
        fogColor: "#08142e",
        fogNear: 25,
        fogFar: 120,
        accent: "#5db4ff",
      },
    },
  ],

  content: [
    {
      id: "c-welcome",
      kind: "text",
      title: "Singular Value Decomposition",
      body:
        "Welcome to the Atrium of Linear Maps. Tonight we take one idea - that every matrix is a geometric transformation - and follow it through a glowing prism into the matrix itself.\n\nFollow the carved route, or wander. Every exhibit keeps its place in the story.",
    },
    {
      id: "c-transform",
      kind: "text",
      title: "A Matrix Is a Transformation",
      body:
        "Multiplying by a matrix A bends space: it rotates, stretches, and shears every vector at once. The Singular Value Decomposition is the claim that ANY such map, however tangled, is only three plain steps:\n\nrotate  ->  stretch along axes  ->  rotate again.",
    },
    {
      id: "c-geometry",
      kind: "image",
      src: "/assets/unit-circle-ellipse.png",
      title: "The unit circle becomes an ellipse",
      caption:
        "A sends the unit circle to an ellipse. The lengths of its semi-axes are the singular values; their directions are the singular vectors.",
      alt: "Diagram: on the left, a unit circle with two orthonormal vectors v1 and v2; a large arrow labelled A maps it to the right, where it has become a tilted ellipse whose semi-axes are sigma1 times u1 and sigma2 times u2. The caption reads A = U Sigma V-transpose, with sigma1 = 2.46 and sigma2 = 0.94.",
    },
    {
      id: "c-compression",
      kind: "image",
      src: "/assets/svd-compression.png",
      title: "Image compression by truncated SVD",
      caption:
        "An image is just a matrix. Keep only the largest singular values and most of the picture survives, at a fraction of the data.",
      alt: "A montage of the same grayscale image reconstructed at rank 2, 8, 24, and full rank. At rank 2 only broad blobs are visible; by rank 24 the letters S V D and concentric rings are sharp. Each low-rank panel stores only a small percentage of the original data.",
    },
    {
      id: "c-reconstruct",
      kind: "video",
      src: "/assets/svd-reconstruct.webm",
      title: "Rebuilding an image one rank at a time",
      caption:
        "Each rank adds one rank-one layer, sigma times u times v-transpose. The first few layers do almost all of the work.",
      alt: "An animation reconstructing a grayscale image as its rank climbs from 1 to 64. A side panel shows the singular value spectrum filling in as each layer is added; the picture sharpens fastest over the first few ranks.",
    },
    {
      id: "c-variance",
      kind: "chart",
      data: {
        type: "bar",
        title: "Variance captured by the top k components",
        unit: "%",
        series: [
          { label: "top 1", value: 62 },
          { label: "top 2", value: 81 },
          { label: "top 3", value: 91 },
          { label: "top 4", value: 96 },
          { label: "top 5", value: 99 },
        ],
      },
      fallbackText:
        "Cumulative variance captured by the leading singular components: top 1 gives 62%, top 2 gives 81%, top 3 gives 91%, top 4 gives 96%, top 5 gives 99%. A handful of components explain almost all of the structure - the basis of dimensionality reduction and PCA.",
    },
    {
      id: "c-equation",
      kind: "text",
      title: "A = U S V^T",
      body:
        "The three steps, written down. V^T rotates the input axes onto the coordinate axes; S, the diagonal matrix of singular values, stretches each axis; U rotates the result into place.\n\nThe columns of U and V are orthonormal, S is diagonal and non-negative, and every real matrix has such a decomposition.",
    },
    {
      id: "c-quote",
      kind: "text",
      title: "After Gilbert Strang",
      body:
        "\"The singular value decomposition is a high point of linear algebra: every matrix, no matter how it tilts or stretches space, hides an orthonormal frame in which it acts as a simple diagonal scaling.\"",
    },
    {
      id: "c-spectrum",
      kind: "chart",
      data: {
        type: "scatter",
        title: "The singular value spectrum",
        xLabel: "index k",
        yLabel: "singular value",
        points: [
          { x: 1, y: 18.4, label: "k=1" },
          { x: 2, y: 9.7, label: "k=2" },
          { x: 3, y: 5.1, label: "k=3" },
          { x: 4, y: 2.8, label: "k=4" },
          { x: 5, y: 1.3, label: "k=5" },
          { x: 6, y: 0.62, label: "k=6" },
          { x: 7, y: 0.28, label: "k=7" },
          { x: 8, y: 0.11, label: "k=8" },
        ],
      },
      fallbackText:
        "The singular values of a sample matrix, plotted by index on a logarithmic vertical axis: 18.4, 9.7, 5.1, 2.8, 1.3, 0.62, 0.28, 0.11. They fall off quickly - the steep decay is exactly what makes low-rank approximation work.",
    },
    {
      id: "c-threshold",
      kind: "text",
      title: "The Prism",
      body:
        "Every gallery keeps one door it rarely opens. Ours is made of light.\n\nStep up to the prism. Beyond it the matrix comes apart into the pieces it was always made of.",
    },
    {
      id: "c-arrival",
      kind: "text",
      title: "Inside the Matrix",
      body:
        "You have passed through the lens. Around you is the vector space itself. The pale ellipsoid ahead is the image of the unit sphere; the bright arrows are its singular axes.",
    },
    {
      id: "c-core",
      kind: "text",
      title: "The Ellipsoid and Its Axes",
      body:
        "Send every unit vector through A and their tips trace this ellipsoid. Its longest axis is the first singular value and direction; the shortest is the last.\n\nA sphere goes in, an ellipsoid comes out. That is the whole geometry of SVD.",
    },
    {
      id: "c-error",
      kind: "chart",
      data: {
        type: "bar",
        title: "Approximation error vs rank k",
        unit: "%",
        series: [
          { label: "k=1", value: 41 },
          { label: "k=2", value: 22 },
          { label: "k=4", value: 9 },
          { label: "k=8", value: 3 },
          { label: "k=16", value: 1 },
        ],
      },
      fallbackText:
        "Relative reconstruction error of the best rank-k approximation: 41% at rank 1, 22% at rank 2, 9% at rank 4, 3% at rank 8, 1% at rank 16. By the Eckart-Young theorem, truncating the SVD gives the best rank-k approximation that exists.",
    },
    {
      id: "c-layers",
      kind: "text",
      title: "The Rank-One Layers",
      body:
        "Each glowing sheet is one rank-one layer, sigma times u times v-transpose. Stacked and summed, they rebuild A exactly.\n\nBrightest first: the layers fade as the singular values fall, which is why a few of them are almost the entire matrix.",
    },
    {
      id: "c-return",
      kind: "text",
      title: "Back Up the Prism",
      body:
        "The tour returns the way it came - back through the lens, carrying a single picture: every matrix is a rotation, a set of stretches, and a rotation.",
    },
  ],

  anchors: [
    {
      id: "a-entrance",
      worldId: "atrium",
      name: "Entrance Tablet",
      station: "entry.tablet",
      semanticRole: "chapter",
      contentIds: ["c-welcome"],
    },
    {
      id: "a-transform",
      worldId: "atrium",
      name: "West Wall - The Transformation",
      station: "west-wall.bay-1",
      semanticRole: "detail",
      contentIds: ["c-transform"],
    },
    {
      id: "a-geometry",
      worldId: "atrium",
      name: "East Wall - The Geometric Picture",
      station: "east-wall.bay-1",
      semanticRole: "media",
      contentIds: ["c-geometry"],
    },
    {
      id: "a-compression",
      worldId: "atrium",
      name: "West Wall - Image Compression",
      station: "west-wall.bay-2",
      semanticRole: "media",
      contentIds: ["c-compression"],
    },
    {
      id: "a-reconstruct",
      worldId: "atrium",
      name: "East Wall - Reconstruction Film",
      station: "east-wall.bay-3",
      semanticRole: "media",
      contentIds: ["c-reconstruct"],
    },
    {
      id: "a-variance",
      worldId: "atrium",
      name: "Hologram - Variance Captured",
      station: "floor.hologram",
      semanticRole: "chart",
      contentIds: ["c-variance"],
    },
    {
      // The free east bay between the geometry and reconstruction pieces;
      // a freestanding tablet would block the reconstruction beat's camera.
      id: "a-equation",
      worldId: "atrium",
      name: "East Wall - The Decomposition",
      station: "east-wall.bay-2",
      semanticRole: "detail",
      contentIds: ["c-equation"],
    },
    {
      id: "a-quote",
      worldId: "atrium",
      name: "The Strang Quote",
      station: "air.quote",
      semanticRole: "quote",
      contentIds: ["c-quote"],
    },
    {
      id: "a-sky",
      worldId: "atrium",
      name: "The Spectrum Sky",
      station: "sky.dome",
      semanticRole: "chart",
      contentIds: ["c-spectrum"],
    },
    {
      id: "a-prism",
      worldId: "atrium",
      name: "The Prism",
      station: "prism.plinth",
      semanticRole: "portal",
      contentIds: ["c-threshold"],
    },
    {
      id: "a-arrival",
      worldId: "spectral",
      name: "Arrival in the Vector Space",
      station: "arrival.overlook",
      semanticRole: "chapter",
      contentIds: ["c-arrival"],
    },
    {
      id: "a-core",
      worldId: "spectral",
      name: "Plate - The Ellipsoid",
      station: "core.plate",
      semanticRole: "detail",
      contentIds: ["c-core"],
    },
    {
      id: "a-error",
      worldId: "spectral",
      name: "Hologram - Approximation Error",
      station: "field.hologram",
      semanticRole: "chart",
      contentIds: ["c-error"],
    },
    {
      id: "a-layers",
      worldId: "spectral",
      name: "The Rank-One Layers",
      station: "layers.gallery",
      semanticRole: "detail",
      contentIds: ["c-layers"],
    },
    {
      id: "a-return",
      worldId: "spectral",
      name: "Return Ring",
      station: "ring.return",
      semanticRole: "portal",
      contentIds: ["c-return"],
    },
  ],

  beats: [
    {
      id: "b-welcome",
      anchorId: "a-entrance",
      title: "Welcome",
      cameraIntent: "read-close",
      notes:
        "Set the premise: this is not a slide deck, it is a building. Tonight's one idea is that every matrix is a geometric transformation, and SVD is its anatomy. The route runs the hall, then through the prism into the matrix itself.",
      narration: {
        script:
          "Welcome to the Atrium of Linear Maps. Tonight we follow a single idea: every matrix is a geometric transformation. We will walk the length of this gallery, and then step through a prism into the matrix itself.",
      },
    },
    {
      id: "b-transform",
      anchorId: "a-transform",
      title: "A matrix is a transformation",
      cameraIntent: "read-close",
      notes:
        "Anchor the whole talk here: any matrix rotates, stretches, and shears space. SVD's promise is that this is always just rotate, stretch along axes, rotate. Three steps, no exceptions.",
      narration: {
        script:
          "Multiplying by a matrix bends space. It rotates, stretches, and shears every vector at once. The singular value decomposition is the promise that any such map, however tangled, is only three plain steps: rotate, stretch along axes, and rotate again.",
      },
    },
    {
      id: "b-geometry",
      anchorId: "a-geometry",
      title: "The geometric picture",
      cameraIntent: "read-close",
      notes:
        "The one picture to remember: the unit circle maps to an ellipse. The semi-axis lengths are the singular values; their directions are the left singular vectors. Everything else is bookkeeping around this.",
      narration: {
        script:
          "Here is the one picture to remember. A matrix sends the unit circle to an ellipse. The lengths of the ellipse's axes are the singular values, and their directions are the singular vectors. Everything else tonight is bookkeeping around this picture.",
      },
    },
    {
      id: "b-compression",
      anchorId: "a-compression",
      title: "Image compression",
      cameraIntent: "read-close",
      notes:
        "Make it concrete: an image is a matrix of pixel values. Keep the top few singular values and you keep the picture while throwing away most of the numbers. Point out the ringing at rank 2 versus the crisp rank 24.",
      narration: {
        script:
          "Let us make that concrete. An image is just a matrix of pixel values. Keep only the largest singular values, and most of the picture survives at a fraction of the data. At rank two you see only broad strokes. By rank twenty four, the letters are sharp.",
      },
    },
    {
      id: "b-reconstruct",
      anchorId: "a-reconstruct",
      title: "Adding the layers",
      cameraIntent: "read-close",
      notes:
        "Let the film run. Each frame adds one rank-one layer; watch the image snap into focus over the first handful of ranks and barely change after. The side spectrum shows why: the singular values have already collapsed.",
      narration: {
        script:
          "Watch the image rebuild itself, one rank at a time. Each frame adds a single rank one layer. The first few layers do almost all of the work. After that, the picture barely changes, because the singular values have already collapsed.",
      },
    },
    {
      id: "b-variance",
      anchorId: "a-variance",
      title: "How few components you need",
      cameraIntent: "orbit-focus",
      notes:
        "The same idea as a number: the top five components already capture 99% of the variance. This is the engine of PCA and dimensionality reduction - keep the directions that matter, drop the rest.",
      narration: {
        script:
          "Here is the same idea as a number. The top five components already capture ninety nine percent of the variance. This is the engine behind principal component analysis: keep the directions that matter, and drop the rest.",
      },
    },
    {
      id: "b-equation",
      anchorId: "a-equation",
      title: "The decomposition",
      cameraIntent: "read-close",
      arrive: "dolly",
      notes:
        "Now name the parts: A = U S V-transpose. V-transpose is the first rotation, S the stretches, U the second rotation. Orthonormal columns in U and V, non-negative diagonal in S. Tie each symbol back to the ellipse picture.",
      narration: {
        script:
          "Now we can name the parts. A equals U, S, V transpose. V transpose rotates the input onto the right axes. S stretches each axis by a singular value. And U rotates the result into place. Three steps, written as three matrices.",
      },
    },
    {
      id: "b-quote",
      anchorId: "a-quote",
      title: "Why it matters",
      cameraIntent: "quote-gaze",
      notes:
        "Read the quote slowly. The punchline of linear algebra: in the right orthonormal frame, every matrix is just a diagonal scaling. That frame is exactly what SVD finds.",
      narration: {
        script:
          "Why does this matter? Because in the right orthonormal frame, every matrix, no matter how it tilts or stretches space, is just a diagonal scaling. That frame is exactly what the singular value decomposition finds.",
      },
    },
    {
      id: "b-pca",
      anchorId: "a-sky",
      title: "The spectrum sky",
      cameraIntent: "sky-gaze",
      arrive: "dolly",
      notes:
        "Each star is a singular value, plotted by index on a logarithmic axis. The steep descent is the whole reason compression and PCA work - most of the matrix lives in the first few directions. Then advance to the prism.",
      narration: {
        script:
          "Look up. Each star above the back wall is a singular value, placed by its index. They fall away steeply, and that steep descent is the whole reason compression works: most of the matrix lives in the first few directions.",
      },
    },
    {
      id: "b-prism",
      anchorId: "a-prism",
      title: "The prism threshold",
      // A template pose, not a computed intent: the framing is about the
      // prism object, not the plinth tablet the beat is anchored to.
      cameraIntent: "prism-approach",
      notes:
        "Build anticipation. White light goes in, a spectrum comes out - the prism is decomposition made visible. Ask the room what is inside a matrix, then advance through the lens.",
      narration: {
        script:
          "Every gallery keeps one door it rarely opens. Ours is made of light. White light enters the prism, and a spectrum comes out: decomposition, made visible. Step up to the lens, and we will go through it.",
      },
    },
    {
      id: "b-arrival",
      anchorId: "a-arrival",
      title: "Inside the matrix",
      cameraIntent: "wide-establishing",
      notes:
        "Pause and let the scale shift land. We are inside the vector space now. The ellipsoid ahead is the image of the unit sphere; the arrows are the singular axes from the wall diagram, made solid.",
      narration: {
        script:
          "You have passed through the lens. Around you is the vector space itself. The pale shape ahead is the image of the unit sphere, and the bright arrows are its singular axes: the wall diagram, made solid.",
      },
    },
    {
      id: "b-core",
      anchorId: "a-core",
      title: "The ellipsoid",
      cameraIntent: "wide-establishing",
      arrive: "dolly",
      notes:
        "This is the unit circle picture in 3D: a sphere mapped to an ellipsoid. The longest axis is the first singular value and direction; the shortest is the last. Geometry first, formula second.",
      narration: {
        script:
          "Send every unit vector through the matrix, and their tips trace this ellipsoid. Its longest axis is the first singular value. Its shortest is the last. A sphere goes in, an ellipsoid comes out. That is the whole geometry of the decomposition.",
      },
    },
    {
      id: "b-error",
      anchorId: "a-error",
      title: "Best rank-k approximation",
      cameraIntent: "orbit-focus",
      notes:
        "Quantify it: error falls fast as rank rises. The key theorem is Eckart-Young - the truncated SVD is provably the best rank-k approximation, not merely a good one. That is what makes it the tool of choice.",
      narration: {
        script:
          "How good is a low rank approximation? The error falls fast: forty one percent at rank one, down to three percent at rank eight. And by the Eckart Young theorem, truncating the decomposition is not merely good. It is the best rank k approximation that exists.",
      },
    },
    {
      id: "b-layers",
      anchorId: "a-layers",
      title: "The rank-one layers",
      cameraIntent: "read-close",
      notes:
        "Pull the matrix apart: A is a sum of rank-one layers, each a singular value times an outer product. The sheets are sorted by brightness because the singular values fall - the first few are almost the whole matrix.",
      narration: {
        script:
          "Each glowing sheet here is one rank one layer: a singular value times an outer product. Stacked and summed, they rebuild the matrix exactly. The sheets dim as the singular values fall, which is why a few of them are almost the entire matrix.",
      },
    },
    {
      id: "b-return",
      anchorId: "a-return",
      title: "Back up the prism",
      cameraIntent: "read-close",
      notes:
        "Close the loop: back through the ring to the atrium. Leave them with the one sentence - rotation, stretches, rotation. Take questions standing at the prism.",
      // End of the self-running tour: without this the portal would loop the
      // narration back through the prism forever.
      narration: {
        autoAdvance: false,
        script:
          "Our tour ends where every decomposition does: back in one piece. Carry a single sentence home with you. Every matrix is a rotation, a set of stretches, and a rotation. Thank you for walking the atrium tonight.",
      },
    },
  ],

  // Only the non-obvious edges are authored: the portals (with named dive
  // poses from the templates) and the improvisation branches. The primary
  // chain is defaulted from beat order by the compiler.
  routes: [
    {
      id: "r-portal-down",
      from: "b-prism",
      to: "b-arrival",
      kind: "portal",
      label: "Through the prism",
      transition: "portal",
      divePose: "prism-dive",
      emergePose: "deep-emerge",
    },
    {
      id: "r-portal-up",
      from: "b-return",
      to: "b-prism",
      kind: "portal",
      label: "Surface to the atrium",
      transition: "portal",
      divePose: "ring-dive",
      emergePose: "lens-emerge",
    },
    // Branches and shortcuts for live improvisation.
    {
      id: "r-skip-history",
      from: "b-transform",
      to: "b-variance",
      kind: "branch",
      label: "Skip ahead to the components",
      transition: "fly",
    },
    {
      id: "r-skip-quote",
      from: "b-equation",
      to: "b-pca",
      kind: "branch",
      label: "Straight to the spectrum",
      transition: "fly",
    },
    {
      id: "r-quote-return",
      from: "b-pca",
      to: "b-quote",
      kind: "return",
      label: "Revisit the quote",
      transition: "dolly",
    },
    {
      id: "r-layers-shortcut",
      from: "b-arrival",
      to: "b-layers",
      kind: "branch",
      label: "Straight to the layers",
      transition: "fly",
    },
    {
      id: "r-core-back",
      from: "b-layers",
      to: "b-core",
      kind: "return",
      label: "Back to the ellipsoid",
      transition: "fly",
    },
  ],

  // skinKind is omitted where the content kind's default applies (text →
  // engraving, chart → hologram, image/video → plaque); the skin resolver
  // fills it. Non-default choices stay explicit.
  skins: [
    { id: "s-welcome", contentId: "c-welcome", anchorId: "a-entrance", params: { width: 5, height: 3.4 } },
    { id: "s-transform", contentId: "c-transform", anchorId: "a-transform", params: { width: 5.4, height: 3.6 } },
    { id: "s-geometry", contentId: "c-geometry", anchorId: "a-geometry", params: { width: 3.8, height: 2.14 } },
    { id: "s-compression", contentId: "c-compression", anchorId: "a-compression", params: { width: 4.8, height: 1.9 } },
    { id: "s-reconstruct", contentId: "c-reconstruct", anchorId: "a-reconstruct", params: { width: 3.4, height: 2.1 } },
    { id: "s-variance", contentId: "c-variance", anchorId: "a-variance", params: { width: 4.4, height: 2.2 } },
    { id: "s-equation", contentId: "c-equation", anchorId: "a-equation", params: { width: 5, height: 3, stoneColor: "#7c7f8c" } },
    { id: "s-quote", contentId: "c-quote", anchorId: "a-quote", skinKind: "cloudText", params: { width: 9 } },
    { id: "s-spectrum", contentId: "c-spectrum", anchorId: "a-sky", skinKind: "constellation", params: { width: 20, height: 10 } },
    { id: "s-threshold", contentId: "c-threshold", anchorId: "a-prism", params: { width: 3.6, height: 2.6, stoneColor: "#8c7e5e" } },
    { id: "s-arrival", contentId: "c-arrival", anchorId: "a-arrival", skinKind: "cloudText", params: { width: 11, color: "#a9d4ff" } },
    { id: "s-core", contentId: "c-core", anchorId: "a-core", params: { width: 4.8, height: 3.2, stoneColor: "#6f7c8c" } },
    { id: "s-error", contentId: "c-error", anchorId: "a-error", params: { width: 3.6, height: 2.4 } },
    { id: "s-layers", contentId: "c-layers", anchorId: "a-layers", skinKind: "cloudText", params: { width: 9, color: "#9fd0ff" } },
    { id: "s-return", contentId: "c-return", anchorId: "a-return", skinKind: "cloudText", params: { width: 8, color: "#bfe0ff" } },
  ],
};

export const journey = defineJourney(doc, {
  templates: [AtriumTemplate, SpectralTemplate],
});
