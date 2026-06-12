let manifestPromise: Promise<
  Record<string, { durationMs: number; cuepoints: number[] }>
> | null = null;

/** The manim asset manifest (cuepoints, durations), fetched once. */
export function fetchManimManifest(): Promise<
  Record<string, { durationMs: number; cuepoints: number[] }>
> {
  manifestPromise ??= fetch("/assets/manim/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}
