import { defineJourney } from "@spatial-present/core";
import type { AuthoredProjectInput } from "@spatial-present/schema";
import { LectureHallTemplate, MathVoidTemplate } from "@spatial-present/worlds";

/**
 * "Euler's Identity - a short walk" — three chalkboards of series in an
 * evening lecture hall, then a dive through the center board into the
 * math void, where the identity itself stands in etched glass beside a
 * living unit circle.
 *
 * The formula primitives keep their LaTeX as the semantic source; the
 * chalk and glass glyphs, the outline, and the spoken-math fallbacks are
 * all derived from it. Like the SVD tour, this document is positionless:
 * stations, camera intents, and an auto-routed primary chain.
 */
const doc: AuthoredProjectInput = {
  schemaVersion: "0.1",
  id: "math-primer",
  title: "Euler's Identity - a short walk",
  startBeatId: "b-welcome",

  worlds: [
    {
      id: "lecture-hall",
      name: "The Evening Lecture Hall",
      unitScale: "human",
      ambience: {
        background: "#171310",
        fogColor: "#13100c",
        fogNear: 18,
        fogFar: 64,
        accent: "#d9a85c",
      },
    },
    {
      id: "math-void",
      name: "The Math Void",
      unitScale: "macro",
      ambience: {
        background: "#05060f",
        fogColor: "#0a0f26",
        fogNear: 30,
        fogFar: 140,
        accent: "#7d8cff",
      },
    },
  ],

  content: [
    {
      id: "c-welcome",
      kind: "text",
      title: "Euler's Identity",
      body:
        "Five constants - e, i, pi, 1, and 0 - written on one line.\n\nTonight we earn that line, one chalk stroke at a time: two power series, one substitution, and a short walk through the board.",
    },
    {
      id: "c-exp",
      kind: "formula",
      latex: "e^{x} \\;=\\; \\sum_{n=0}^{\\infty} \\frac{x^{n}}{n!} \\;=\\; 1 + x + \\frac{x^{2}}{2!} + \\frac{x^{3}}{3!} + \\cdots",
      fallbackText:
        "e to the x equals the sum from n equals zero to infinity of x to the n over n factorial; that is, one plus x plus x squared over two factorial plus x cubed over three factorial, and so on.",
    },
    {
      id: "c-trig",
      kind: "formula",
      latex:
        "\\begin{aligned} \\cos x &= 1 - \\frac{x^{2}}{2!} + \\frac{x^{4}}{4!} - \\cdots \\\\[4pt] \\sin x &= x - \\frac{x^{3}}{3!} + \\frac{x^{5}}{5!} - \\cdots \\end{aligned}",
      fallbackText:
        "cosine x equals one minus x squared over two factorial plus x to the fourth over four factorial, minus and so on; sine x equals x minus x cubed over three factorial plus x to the fifth over five factorial, minus and so on.",
    },
    {
      id: "c-threshold",
      kind: "text",
      title: "Through the Board",
      body:
        "Substitute ix into the exponential series and the terms split: the even powers are cosine, the odd powers are i times sine.\n\nThe board is only a surface. Step through it, into the plane where these series live.",
    },
    {
      id: "c-euler",
      kind: "formula",
      latex: "e^{ix} \\;=\\; \\cos x \\,+\\, i\\,\\sin x",
      fallbackText: "e to the i x equals cosine x plus i times sine x.",
    },
    {
      id: "c-circle",
      kind: "text",
      title: "The Unit Circle",
      body:
        "Every value of e to the i theta lies at distance one from zero. The exponential does not explode along this axis - it orbits.",
    },
    {
      id: "c-sweep",
      kind: "manim",
      scene: "scenes/half_turn.py#HalfTurn",
      quality: "h",
      reveal: "stepwise",
      fallbackText:
        "An animation of the unit circle: the point e to the i theta starts at one, sweeps half a turn along the top of the circle while never leaving distance one from zero, and lands exactly on minus one; the line e to the i pi equals minus one appears.",
    },
    {
      id: "c-identity",
      kind: "formula",
      latex: "e^{i\\pi} + 1 \\;=\\; 0",
      numbered: true,
      fallbackText: "e to the i pi, plus one, equals zero.",
    },
    {
      id: "c-return",
      kind: "text",
      title: "Back Through the Board",
      body:
        "Half a turn around the circle is pi. Land at minus one, add one, and arrive at zero.\n\nCarry the line home: five constants, one circle, no coincidence.",
    },
  ],

  anchors: [
    {
      id: "a-welcome",
      worldId: "lecture-hall",
      name: "Left Board",
      station: "board.left",
      semanticRole: "chapter",
      contentIds: ["c-welcome"],
    },
    {
      id: "a-exp",
      worldId: "lecture-hall",
      name: "Center Board - the Exponential",
      station: "board.center",
      semanticRole: "detail",
      contentIds: ["c-exp"],
    },
    {
      id: "a-trig",
      worldId: "lecture-hall",
      name: "Right Board - Sine and Cosine",
      station: "board.right",
      semanticRole: "detail",
      contentIds: ["c-trig"],
    },
    {
      id: "a-threshold",
      worldId: "lecture-hall",
      name: "West Wall - the Threshold",
      station: "wall.west",
      semanticRole: "portal",
      contentIds: ["c-threshold"],
    },
    {
      id: "a-euler",
      worldId: "math-void",
      name: "Glass - the Substitution",
      station: "gallery.west",
      semanticRole: "detail",
      contentIds: ["c-euler"],
    },
    {
      id: "a-circle",
      worldId: "math-void",
      name: "The Living Unit Circle",
      station: "circle.overlook",
      semanticRole: "quote",
      contentIds: ["c-circle"],
    },
    {
      id: "a-sweep",
      worldId: "math-void",
      name: "Theatre - the Half Turn",
      station: "screen.theatre",
      semanticRole: "media",
      contentIds: ["c-sweep"],
    },
    {
      id: "a-identity",
      worldId: "math-void",
      name: "Glass - the Identity",
      station: "plinth.identity",
      semanticRole: "chapter",
      contentIds: ["c-identity"],
    },
    {
      id: "a-return",
      worldId: "math-void",
      name: "The Return Gate",
      station: "gate.return",
      semanticRole: "portal",
      contentIds: ["c-return"],
    },
  ],

  beats: [
    {
      id: "b-welcome",
      anchorId: "a-welcome",
      title: "Five constants, one line",
      cameraIntent: "read-close",
      notes:
        "Set the destination: e to the i pi plus one equals zero. Promise the route - two series, one substitution - and point at the empty boards.",
    },
    {
      id: "b-exp",
      anchorId: "a-exp",
      title: "The exponential series",
      cameraIntent: "read-close",
      notes:
        "The exponential as a power series: every term, every x. Let the chalk write itself out; the factorials are doing the convergence work.",
    },
    {
      id: "b-trig",
      anchorId: "a-trig",
      title: "Sine and cosine, the same way",
      cameraIntent: "read-close",
      notes:
        "Same machine, two more functions. Point at the alternating signs and the split between even and odd powers - that split is the whole proof.",
    },
    {
      id: "b-threshold",
      anchorId: "a-threshold",
      title: "Substitute ix",
      cameraIntent: "read-close",
      notes:
        "Do the substitution out loud: i squared is minus one, so even powers alternate sign (cosine) and odd powers keep an i (sine). Then walk to the center board and step through.",
    },
    {
      id: "b-euler",
      anchorId: "a-euler",
      title: "Euler's formula",
      cameraIntent: "wide-establishing",
      notes:
        "We are inside the plane now. The substitution's result stands in glass: e to the i x is a point with coordinates cosine x and sine x.",
    },
    {
      id: "b-circle",
      anchorId: "a-circle",
      title: "The unit circle",
      cameraIntent: "quote-gaze",
      arrive: "dolly",
      notes:
        "Watch the point orbit: modulus one, forever. Imaginary exponents rotate instead of growing - that is the geometric heart of it.",
    },
    {
      id: "b-sweep",
      anchorId: "a-sweep",
      title: "Half a turn",
      cameraIntent: "read-close",
      notes:
        "Stepwise: each advance plays one move of the animation - the stage, the radius, the sweep, the landing. With voice on, the narration drives the steps; the next press only moves on after the last step.",
      narration: {
        script:
          "Watch the half turn unfold. [mark:step] This is the radius: e to the i theta, length one, angle theta. [mark:step] Sweep theta from zero to pi, and the point walks the top of the circle, never leaving distance one. [mark:step] At theta equal to pi it lands. e to the i pi is exactly minus one.",
      },
    },
    {
      id: "b-identity",
      anchorId: "a-identity",
      title: "The identity",
      cameraIntent: "read-close",
      notes:
        "Set x to pi: half a turn. Land on minus one, add one, get zero. Let the equation breathe - this is the destination promised at the first board.",
    },
    {
      id: "b-return",
      anchorId: "a-return",
      title: "Back through the board",
      cameraIntent: "read-close",
      notes:
        "Close the loop through the gate. Leave them with the one line and the one picture: five constants, one circle.",
    },
  ],

  // Portals and improvisation edges only; the primary chain is auto-routed.
  routes: [
    {
      id: "r-portal-in",
      from: "b-threshold",
      to: "b-euler",
      kind: "portal",
      label: "Step through the board",
      transition: "portal",
      divePose: "board-dive",
      emergePose: "void-emerge",
    },
    {
      id: "r-portal-out",
      from: "b-return",
      to: "b-threshold",
      kind: "portal",
      label: "Surface to the hall",
      transition: "portal",
      divePose: "gate-dive",
      emergePose: "board-emerge",
    },
    {
      id: "r-skip-series",
      from: "b-exp",
      to: "b-threshold",
      kind: "branch",
      label: "Skip the trigonometric series",
      transition: "fly",
    },
    {
      id: "r-revisit-euler",
      from: "b-identity",
      to: "b-euler",
      kind: "return",
      label: "Back to the substitution",
      transition: "fly",
    },
  ],

  // chalkboard is the default skin for formulas, engraving for text —
  // only the non-default choices are explicit.
  skins: [
    { id: "s-welcome", contentId: "c-welcome", anchorId: "a-welcome", skinKind: "chalkboard", params: { width: 3.8, height: 2.8 } },
    { id: "s-exp", contentId: "c-exp", anchorId: "a-exp", params: { width: 3.8, height: 2.8 } },
    { id: "s-trig", contentId: "c-trig", anchorId: "a-trig", params: { width: 3.8, height: 2.8 } },
    { id: "s-threshold", contentId: "c-threshold", anchorId: "a-threshold", params: { width: 3.6, height: 2.8, stoneColor: "#6e5f4a" } },
    { id: "s-euler", contentId: "c-euler", anchorId: "a-euler", skinKind: "etchedGlass", params: { width: 5.6, height: 3 } },
    { id: "s-circle", contentId: "c-circle", anchorId: "a-circle", skinKind: "cloudText", params: { width: 7.5, color: "#aac8ff" } },
    { id: "s-sweep", contentId: "c-sweep", anchorId: "a-sweep", params: { width: 7, height: 3.94 } },
    { id: "s-identity", contentId: "c-identity", anchorId: "a-identity", skinKind: "etchedGlass", params: { width: 5, height: 2.8 } },
    { id: "s-return", contentId: "c-return", anchorId: "a-return", skinKind: "cloudText", params: { width: 6.5, color: "#bcc4ff" } },
  ],
};

export const journey = defineJourney(doc, {
  templates: [LectureHallTemplate, MathVoidTemplate],
});
