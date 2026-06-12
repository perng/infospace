import { useEffect, useRef, useState } from "react";
import type { PresentationStore } from "@spatial-present/core";
import { narrationAudioSrc, type Narration } from "@spatial-present/schema";

/**
 * Narrated-tour mode. When enabled (V), each beat's rendered narration clip
 * plays once the camera settles, and the script doubles as the caption —
 * derived from the same semantic source as the audio. When a clip ends the
 * tour advances along the primary route after a short pause, turning the
 * presentation into a self-running tour. The presenter always wins: any
 * navigation swaps the beat (which stops the clip), and a grabbed camera or
 * open palette suppresses auto-advance.
 *
 * Timing metadata from the narration manifest makes the audio steerable:
 * captions highlight word by word as they are spoken, and `[mark:step]`
 * cues in the script advance the current beat's stepwise reveal at the
 * exact moment of speech — narration drives the animation.
 */

interface NarrationTiming {
  durationMs: number;
  segments?: { text: string; startMs: number; endMs: number }[];
  words?: { text: string; startMs: number; endMs: number }[];
  marks?: { name: string; atMs: number }[];
}

let manifestPromise: Promise<Record<string, NarrationTiming>> | null = null;
function fetchNarrationManifest(): Promise<Record<string, NarrationTiming>> {
  manifestPromise ??= fetch("/assets/narration/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

const MARK_RE = /\s*\[mark:[a-zA-Z0-9_-]+\]\s*/g;

export function Narrator({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const narrationOn = store((s) => s.narrationOn);
  const currentBeatId = store((s) => s.currentBeatId);
  const settled = store((s) => s.transition === null);
  const [manifest, setManifest] = useState<Record<string, NarrationTiming>>({});
  const [nowMs, setNowMs] = useState(0);
  const firedUpToMs = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void fetchNarrationManifest().then((m) => {
      if (!cancelled) setManifest(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const narration = index.beatById.get(currentBeatId)?.narration;
  if (!narrationOn || !narration) return null;
  const timing = manifest[currentBeatId];

  const handleEnded = () => {
    if (narration.autoAdvance === false) return;
    const beatId = currentBeatId;
    // Breathing room between the clip ending and the camera moving on.
    setTimeout(() => {
      const s = store.getState();
      if (!s.narrationOn || s.manualCamera || s.paletteOpen) return;
      if (s.transition || s.currentBeatId !== beatId) return;
      s.advance();
    }, 1100);
  };

  const handleTime = (ms: number) => {
    setNowMs(ms);
    // Fire cue marks crossed since the last tick. "step" marks drive the
    // stepwise reveal; other names are reserved for future targets.
    for (const mark of timing?.marks ?? []) {
      if (mark.atMs > firedUpToMs.current && mark.atMs <= ms) {
        if (mark.name === "step") store.getState().advanceStep();
      }
    }
    firedUpToMs.current = ms;
  };

  const handleStart = () => {
    firedUpToMs.current = 0;
    setNowMs(0);
  };

  return (
    <>
      {settled && (
        <NarrationClip
          key={currentBeatId}
          src={narrationAudioSrc(currentBeatId)}
          onEnded={handleEnded}
          onTime={handleTime}
          onStart={handleStart}
        />
      )}
      <Caption narration={narration} timing={timing} nowMs={nowMs} />
    </>
  );
}

/**
 * The caption: the active segment of the script, word-highlighted as it
 * is spoken when the manifest carries timing; the whole script (cue marks
 * stripped) otherwise. Same semantic source as the audio either way.
 */
function Caption({
  narration,
  timing,
  nowMs,
}: {
  narration: Narration;
  timing?: NarrationTiming;
  nowMs: number;
}) {
  if (!timing?.segments?.length || !timing.words?.length) {
    return (
      <div className="caption" role="status">
        {narration.script.replace(MARK_RE, " ")}
      </div>
    );
  }
  const segment =
    timing.segments.find((s) => nowMs < s.endMs) ??
    timing.segments[timing.segments.length - 1];
  const words = timing.words.filter(
    (w) => w.startMs >= segment.startMs && w.endMs <= segment.endMs
  );
  return (
    <div className="caption" role="status">
      {words.map((w, i) => (
        <span
          key={i}
          className={`caption-word ${nowMs >= w.startMs ? "caption-word-spoken" : ""}`}
        >
          {w.text}{" "}
        </span>
      ))}
    </div>
  );
}

/** Pauses on unmount — a removed <audio> element may otherwise keep playing. */
function NarrationClip({
  src,
  onEnded,
  onTime,
  onStart,
}: {
  src: string;
  onEnded: () => void;
  onTime: (ms: number) => void;
  onStart: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    // Explicit play (not the autoplay attribute): inserted-while-activated
    // elements are allowed to start, and a rejection (autoplay policy) still
    // leaves captions working.
    el?.play().catch((err) => console.warn("narration playback blocked:", err?.name));
    return () => el?.pause();
  }, []);
  return (
    <audio
      ref={ref}
      src={src}
      onPlay={onStart}
      onTimeUpdate={(e) => onTime(e.currentTarget.currentTime * 1000)}
      onEnded={onEnded}
    />
  );
}
