#!/usr/bin/env python3
"""
Render manim clips for a journey — the prototype's `manim-render` job.

The manim scene sources referenced by the document are the semantic truth;
this script derives the clips. It asks the journey CLI for the scene list,
renders each scene in a uv-managed Python (manim needs native deps and a
non-bleeding-edge interpreter), records play-boundary cuepoints, converts
to VP9 webm (with an alpha channel when transparent, so the animation
composites over the world), and writes a provenance manifest:

  public/assets/manim/<contentId>.webm
  public/assets/manim/manifest.json   { contentId: { sceneHash, cuepoints, ... } }

Clips are cached by a hash of the scene source plus render flags — re-runs
only render scenes that changed. `npm run validate` warns when a clip is
missing or stale.

Requires: uv (provides Python 3.13 + manim, cached), ffmpeg.
Run from the presentation's root (e.g. examples/math-primer/):

  python3 ../../packages/cli/render-manim.py [journey-module]

[journey-module] defaults to src/journey/project.ts, like the CLI.
"""

import hashlib
import json
import os
import subprocess
import sys
import tempfile

MANIM_PYTHON = "3.13"  # manim's native deps lag the newest CPython

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, "src", "journey-cli.ts")
DRIVER = os.path.join(HERE, "manim_driver.py")
ROOT = os.getcwd()
JOURNEY = sys.argv[1] if len(sys.argv) > 1 else "src/journey/project.ts"
OUT_DIR = os.path.join(ROOT, "public", "assets", "manim")
MANIFEST = os.path.join(OUT_DIR, "manifest.json")


def scene_hash(entry: dict) -> str:
    # Must match manimWarnings() in journey-cli.ts: sha256 of the scene
    # file's source, then the JSON of {scene, quality, transparent}.
    file = entry["scene"].split("#")[0]
    h = hashlib.sha256()
    with open(os.path.join(ROOT, file), "rb") as f:
        h.update(f.read())
    h.update(
        json.dumps(
            {
                "scene": entry["scene"],
                "quality": entry["quality"],
                "transparent": entry["transparent"],
            },
            separators=(",", ":"),
        ).encode("utf-8")
    )
    return h.hexdigest()[:16]


def load_scenes():
    out = subprocess.run(
        ["npx", "tsx", CLI, "manim", JOURNEY],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)["scenes"]


def render(entry: dict) -> dict:
    file, class_name = entry["scene"].split("#")
    with tempfile.TemporaryDirectory(prefix="manim-render-") as media_dir:
        run = subprocess.run(
            [
                "uv", "run", "--python", MANIM_PYTHON, "--with", "manim",
                "python", DRIVER,
                os.path.join(ROOT, file), class_name,
                entry["quality"], "1" if entry["transparent"] else "0",
                media_dir,
            ],
            cwd=ROOT, capture_output=True, text=True,
        )
        if run.returncode != 0:
            sys.stderr.write(run.stdout[-2000:] + run.stderr[-2000:])
            raise RuntimeError(f"manim render failed for {entry['scene']}")
        result_line = next(
            line for line in run.stdout.splitlines() if line.startswith("RESULT_JSON:")
        )
        result = json.loads(result_line[len("RESULT_JSON:"):])

        clip = os.path.join(OUT_DIR, f"{entry['id']}.webm")
        pix_fmt = "yuva420p" if entry["transparent"] else "yuv420p"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", result["movie"],
                "-c:v", "libvpx-vp9", "-pix_fmt", pix_fmt,
                "-b:v", "0", "-crf", "30", "-an", clip,
            ],
            check=True,
        )
    return result


def main():
    scenes = load_scenes()
    if not scenes:
        print("no manim content in the document")
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST) as f:
            manifest = json.load(f)

    todo = []
    for entry in scenes:
        h = scene_hash(entry)
        clip = os.path.join(OUT_DIR, f"{entry['id']}.webm")
        if os.path.exists(clip) and manifest.get(entry["id"], {}).get("sceneHash") == h:
            continue
        todo.append((entry, h))

    print(f"{len(scenes)} manim clips, {len(todo)} to render")
    for entry, h in todo:
        print(f"  rendering {entry['scene']} …")
        result = render(entry)
        manifest[entry["id"]] = {
            "sceneHash": h,
            "durationMs": int(result["durationS"] * 1000),
            "cuepoints": [int(t * 1000) for t in result["cuepoints"]],
            "quality": entry["quality"],
            "transparent": entry["transparent"],
            "engine": f"manim {result['manim']}",
        }
        print(
            f"  rendered {entry['id']}.webm  "
            f"({result['durationS']:.1f}s, {len(result['cuepoints'])} cuepoints)"
        )

    # prune clips for content no longer in the document
    keep = {entry["id"] for entry in scenes}
    for entry_id in list(manifest):
        if entry_id not in keep:
            stale = os.path.join(OUT_DIR, f"{entry_id}.webm")
            if os.path.exists(stale):
                os.unlink(stale)
            del manifest[entry_id]
            print(f"  pruned {entry_id}.webm (no longer referenced)")

    with open(MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    print(f"manifest: {os.path.relpath(MANIFEST, ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
