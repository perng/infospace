import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * LaTeX → 3D glyph geometry.
 *
 * MathJax (TeX input, SVG output with fontCache "none") emits a fully
 * self-contained SVG — every glyph is an inline <path>, no font refs —
 * which SVGLoader converts into THREE.Shape outlines and then flat
 * ShapeGeometries. Skins render those as real geometry, so formulas stay
 * crisp at any zoom and each skin owns its material (chalk, etched glow).
 * The LaTeX in the document remains the semantic source; this module is
 * pure presentation.
 *
 * Everything heavy is loaded dynamically: journeys without formulas never
 * download MathJax or the SVG loader.
 */

export interface FormulaGlyph {
  geometry: THREE.BufferGeometry;
  /** Reading-order index, used for staggered write-on reveals. */
  index: number;
}

export interface FormulaGeometry {
  glyphs: FormulaGlyph[];
  /** Bounds in raw SVG coordinates (y-down). To place: wrap the glyph
   *  meshes in a group with scale [s, -s, s] and position
   *  [-center.x * s, center.y * s, 0], where s = targetHeight / height. */
  center: { x: number; y: number };
  width: number;
  height: number;
}

type TexToSvg = (latex: string) => string;
let texToSvgPromise: Promise<TexToSvg> | null = null;

/** One shared MathJax document, created on first use. */
function loadTexToSvg(): Promise<TexToSvg> {
  texToSvgPromise ??= (async () => {
    // mathjax-full's CJS build resolves its version via eval("require")
    // unless the PACKAGE_VERSION global (injected by MathJax's own webpack
    // build) is defined — that eval crashes in browsers, so define it
    // before any mathjax module evaluates.
    (globalThis as Record<string, unknown>).PACKAGE_VERSION ??= "3.2.1";
    // Deliberately not AllPackages: it drags in the \require loader,
    // whose node-compat shim (`eval("require")`) breaks in browsers.
    // base + ams cover presentation math; add packages here as needed.
    const [
      { mathjax },
      { TeX },
      { SVG },
      { liteAdaptor },
      { RegisterHTMLHandler },
    ] = await Promise.all([
      import("mathjax-full/js/mathjax.js"),
      import("mathjax-full/js/input/tex.js"),
      import("mathjax-full/js/output/svg.js"),
      import("mathjax-full/js/adaptors/liteAdaptor.js"),
      import("mathjax-full/js/handlers/html.js"),
      import("mathjax-full/js/input/tex/ams/AmsConfiguration.js"),
    ]);
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const doc = mathjax.document("", {
      InputJax: new TeX({ packages: ["base", "ams"] }),
      OutputJax: new SVG({ fontCache: "none" }),
    });
    return (latex: string) => {
      const node = doc.convert(latex, { display: true });
      // node is the <mjx-container>; its child is the <svg>.
      return adaptor.innerHTML(node);
    };
  })();
  return texToSvgPromise;
}

async function buildGeometry(latex: string): Promise<FormulaGeometry> {
  const [texToSvg, { SVGLoader }] = await Promise.all([
    loadTexToSvg(),
    import("three/addons/loaders/SVGLoader.js"),
  ]);
  const svg = texToSvg(latex);
  const data = new SVGLoader().parse(svg);

  const box = new THREE.Box2();
  const point = new THREE.Vector2();
  const glyphs: FormulaGlyph[] = data.paths.map((path, index) => {
    const shapes = SVGLoader.createShapes(path);
    for (const shape of shapes)
      for (const p of shape.extractPoints(6).shape)
        box.expandByPoint(point.set(p.x, p.y));
    return { geometry: new THREE.ShapeGeometry(shapes, 6), index };
  });

  const center = box.getCenter(new THREE.Vector2());
  const size = box.getSize(new THREE.Vector2());
  return {
    glyphs,
    center: { x: center.x, y: center.y },
    width: size.x,
    height: size.y,
  };
}

const geometryCache = new Map<string, Promise<FormulaGeometry>>();

/**
 * Resolve a LaTeX string to glyph geometries. Async (MathJax loads on
 * demand) and cached per source string; null until ready.
 */
export function useFormulaGeometry(latex: string): FormulaGeometry | null {
  const [result, setResult] = useState<FormulaGeometry | null>(null);
  useEffect(() => {
    let cancelled = false;
    let promise = geometryCache.get(latex);
    if (!promise) {
      promise = buildGeometry(latex);
      geometryCache.set(latex, promise);
    }
    promise
      .then((geometry) => {
        if (!cancelled) setResult(geometry);
      })
      .catch((error) => {
        // A broken formula renders as nothing in-world (the fallback text
        // still carries it in the outline); say why in the console.
        console.error(`formula could not be rendered: ${latex}`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [latex]);
  return result;
}

/**
 * Fit parameters for a formula inside a target box: the group transform
 * that maps raw SVG glyph space (y-down, arbitrary units) into a y-up,
 * origin-centered rectangle no larger than maxWidth × maxHeight.
 */
export function fitFormula(
  f: FormulaGeometry,
  maxWidth: number,
  maxHeight: number
): { scale: number; position: [number, number, number] } {
  const scale = Math.min(maxWidth / f.width, maxHeight / f.height);
  return {
    scale,
    position: [-f.center.x * scale, f.center.y * scale, 0],
  };
}
