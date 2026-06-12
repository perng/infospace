#!/usr/bin/env python3
"""
Render narration clips for a journey — the prototype's `tts-narrate` job.

The narration scripts in the journey document are the semantic source of
truth; this script derives the audio. It asks the journey CLI for the scripts
(so the document is never parsed twice), synthesizes each with Kokoro TTS
(local, offline), and writes mp3 clips plus a provenance manifest into the
current directory:

  public/assets/narration/<beatId>.mp3
  public/assets/narration/manifest.json   { beatId: { scriptHash, ... } }

Timing metadata makes the audio steerable: scripts may carry inline cue
marks (`[mark:step]`), which split the script into segments rendered
separately; each mark's timestamp is exact (the concatenation point), and
the runtime uses them to drive reveal steps at the spoken word. Segment
start/end times are exact; word-level times are estimated within each
segment by character weight (good enough for caption highlighting — a
cloud engine with real timestamps can replace them without changing the
document). Marks are spoken as nothing; they're timing, not text.

Clips are cached by script hash — re-runs only render beats whose script
changed. `npm run validate` warns when a clip is missing or stale.

Requires: kokoro-onnx (python), its model files (see KOKORO_MODEL), ffmpeg.
Run from the presentation's root (e.g. examples/svd-tour/):

  python3 ../../packages/cli/generate-narration.py [journey-module]

[journey-module] defaults to src/journey/project.ts, like the CLI.
"""

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import wave

MARK_RE = re.compile(r"\s*\[mark:([a-zA-Z0-9_-]+)\]\s*")
SEGMENT_GAP_S = 0.12  # breath between rendered segments at a cue mark

KOKORO_MODEL = "/Users/charles/.local/share/kokoro-tts/kokoro-v1.0.onnx"
KOKORO_VOICES = "/Users/charles/.local/share/kokoro-tts/voices-v1.0.bin"
VOICE = "af_heart"
SPEED = 1.0
ENGINE = "kokoro-onnx"

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, "src", "journey-cli.ts")
ROOT = os.getcwd()
JOURNEY = sys.argv[1] if len(sys.argv) > 1 else "src/journey/project.ts"
OUT_DIR = os.path.join(ROOT, "public", "assets", "narration")
MANIFEST = os.path.join(OUT_DIR, "manifest.json")


def script_hash(script: str) -> str:
    # Must match narrationWarnings() in journey-cli.ts.
    return hashlib.sha256(script.encode("utf-8")).hexdigest()[:16]


def parse_script(script: str):
    """Split a script on [mark:name] tokens.

    Returns (segments, marks) where segments are the spoken texts and
    marks are (name, segment_index) — the mark fires when that segment
    starts. A leading mark gets index 0; trailing marks clamp to the end.
    """
    segments, marks = [], []
    cursor = 0
    for m in MARK_RE.finditer(script):
        text = script[cursor:m.start()].strip()
        if text:
            segments.append(text)
        marks.append((m.group(1), len(segments)))
        cursor = m.end()
    tail = script[cursor:].strip()
    if tail:
        segments.append(tail)
    return segments, marks


def estimate_words(text: str, start_ms: int, duration_ms: int):
    """Distribute a segment's duration across its words by character
    weight — an estimate for caption highlighting, not ground truth."""
    words = text.split()
    weights = [len(w) + 1 for w in words]
    total = sum(weights) or 1
    out, cursor = [], start_ms
    for w, weight in zip(words, weights):
        dur = duration_ms * weight / total
        out.append({"text": w, "startMs": int(cursor), "endMs": int(cursor + dur)})
        cursor += dur
    return out


def load_scripts():
    out = subprocess.run(
        ["npx", "tsx", CLI, "narration", JOURNEY],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)["beats"]


def main():
    beats = load_scripts()
    if not beats:
        print("no narrated beats in the document")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST) as f:
            manifest = json.load(f)

    todo = []
    for b in beats:
        h = script_hash(b["script"])
        clip = os.path.join(OUT_DIR, f"{b['id']}.mp3")
        if os.path.exists(clip) and manifest.get(b["id"], {}).get("scriptHash") == h:
            continue
        todo.append((b, h))

    print(f"{len(beats)} narrated beats, {len(todo)} to render")
    if todo:
        import numpy as np
        from kokoro_onnx import Kokoro  # heavy import, only when needed
        print("loading Kokoro model…")
        kokoro = Kokoro(KOKORO_MODEL, KOKORO_VOICES)
        for b, h in todo:
            texts, mark_tokens = parse_script(b["script"])
            pieces, segments, words = [], [], []
            cursor_ms = 0.0
            sr = 24000
            for text in texts:
                samples, sr = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
                seg_ms = len(samples) / sr * 1000
                segments.append(
                    {"text": text, "startMs": int(cursor_ms), "endMs": int(cursor_ms + seg_ms)}
                )
                words.extend(estimate_words(text, int(cursor_ms), int(seg_ms)))
                pieces.append(samples)
                pieces.append(np.zeros(int(sr * SEGMENT_GAP_S), dtype=samples.dtype))
                cursor_ms += seg_ms + SEGMENT_GAP_S * 1000
            all_samples = np.concatenate(pieces) if pieces else np.zeros(1)
            duration_ms = int(len(all_samples) / sr * 1000)
            # A mark fires when its segment starts (exact: the join point).
            marks = [
                {
                    "name": name,
                    "atMs": segments[i]["startMs"] if i < len(segments) else duration_ms,
                }
                for name, i in mark_tokens
            ]
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                wav_path = tmp.name
            with wave.open(wav_path, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(sr)
                w.writeframes((all_samples * 32767).clip(-32768, 32767).astype("<i2").tobytes())
            clip = os.path.join(OUT_DIR, f"{b['id']}.mp3")
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path,
                 "-codec:a", "libmp3lame", "-b:a", "64k", clip],
                check=True,
            )
            os.unlink(wav_path)
            manifest[b["id"]] = {
                "scriptHash": h,
                "durationMs": duration_ms,
                "segments": segments,
                "words": words,
                "marks": marks,
                "engine": ENGINE,
                "voice": VOICE,
                "speed": SPEED,
            }
            print(
                f"  rendered {b['id']}.mp3  "
                f"({duration_ms / 1000:.1f}s, {len(segments)} segments, {len(marks)} marks)"
            )

    # prune clips for beats no longer narrated in the document
    keep = {b["id"] for b in beats}
    for entry in list(manifest):
        if entry not in keep:
            stale = os.path.join(OUT_DIR, f"{entry}.mp3")
            if os.path.exists(stale):
                os.unlink(stale)
            del manifest[entry]
            print(f"  pruned {entry}.mp3 (no longer narrated)")

    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print(f"manifest: {os.path.relpath(MANIFEST, ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
