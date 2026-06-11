#!/usr/bin/env python3
"""
Render narration clips for the journey — the prototype's `tts-narrate` job.

The narration scripts in src/journey/project.ts are the semantic source of
truth; this script derives the audio. It asks the journey CLI for the scripts
(so the document is never parsed twice), synthesizes each with Kokoro TTS
(local, offline), and writes mp3 clips plus a provenance manifest:

  public/assets/narration/<beatId>.mp3
  public/assets/narration/manifest.json   { beatId: { scriptHash, ... } }

Clips are cached by script hash — re-runs only render beats whose script
changed. `npm run validate` warns when a clip is missing or stale.

Requires: kokoro-onnx (python), its model files (see KOKORO_MODEL), ffmpeg.
Run from the spatial-present/ directory:  python3 scripts/generate-narration.py
"""

import hashlib
import json
import os
import subprocess
import sys
import tempfile
import wave

KOKORO_MODEL = "/Users/charles/.local/share/kokoro-tts/kokoro-v1.0.onnx"
KOKORO_VOICES = "/Users/charles/.local/share/kokoro-tts/voices-v1.0.bin"
VOICE = "af_heart"
SPEED = 1.0
ENGINE = "kokoro-onnx"

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "public", "assets", "narration")
MANIFEST = os.path.join(OUT_DIR, "manifest.json")


def script_hash(script: str) -> str:
    # Must match narrationWarnings() in journey-cli.ts.
    return hashlib.sha256(script.encode("utf-8")).hexdigest()[:16]


def load_scripts():
    out = subprocess.run(
        ["npx", "tsx", "scripts/journey-cli.ts", "narration"],
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
        from kokoro_onnx import Kokoro  # heavy import, only when needed
        print("loading Kokoro model…")
        kokoro = Kokoro(KOKORO_MODEL, KOKORO_VOICES)
        for b, h in todo:
            samples, sr = kokoro.create(b["script"], voice=VOICE, speed=SPEED, lang="en-us")
            duration_ms = int(len(samples) / sr * 1000)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                wav_path = tmp.name
            with wave.open(wav_path, "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(sr)
                w.writeframes((samples * 32767).clip(-32768, 32767).astype("<i2").tobytes())
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
                "engine": ENGINE,
                "voice": VOICE,
                "speed": SPEED,
            }
            print(f"  rendered {b['id']}.mp3  ({duration_ms / 1000:.1f}s)")

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
