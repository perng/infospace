import { useEffect, useRef } from "react";
import type { PresentationStore } from "../framework/store";
import { narrationAudioSrc } from "../framework/schema";

/**
 * Narrated-tour mode. When enabled (V), each beat's rendered narration clip
 * plays once the camera settles, and the script doubles as the caption —
 * derived from the same semantic source as the audio. When a clip ends the
 * tour advances along the primary route after a short pause, turning the
 * presentation into a self-running tour. The presenter always wins: any
 * navigation swaps the beat (which stops the clip), and a grabbed camera or
 * open palette suppresses auto-advance.
 */
export function Narrator({ store }: { store: PresentationStore }) {
  const index = store((s) => s.index);
  const narrationOn = store((s) => s.narrationOn);
  const currentBeatId = store((s) => s.currentBeatId);
  const settled = store((s) => s.transition === null);

  const narration = index.beatById.get(currentBeatId)?.narration;
  if (!narrationOn || !narration) return null;

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

  return (
    <>
      {settled && (
        <NarrationClip
          key={currentBeatId}
          src={narrationAudioSrc(currentBeatId)}
          onEnded={handleEnded}
        />
      )}
      <div className="caption" role="status">
        {narration.script}
      </div>
    </>
  );
}

/** Pauses on unmount — a removed <audio> element may otherwise keep playing. */
function NarrationClip({ src, onEnded }: { src: string; onEnded: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    // Explicit play (not the autoplay attribute): inserted-while-activated
    // elements are allowed to start, and a rejection (autoplay policy) still
    // leaves captions working.
    el?.play().catch((err) => console.warn("narration playback blocked:", err?.name));
    return () => el?.pause();
  }, []);
  return <audio ref={ref} src={src} onEnded={onEnded} />;
}
