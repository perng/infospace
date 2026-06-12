"""
Runs inside the manim environment (see render-manim.py): renders one scene
programmatically and reports play-boundary cuepoints.

Scene.play is hooked to record the renderer clock before each non-Wait
play; waits merge into the preceding segment, so each cuepoint is a moment
where the scene rests. The last cuepoint is the total duration, so a
stepwise reveal has exactly one step per content play.

Usage:
  python manim_driver.py <scene.py> <ClassName> <l|m|h|k> <0|1 transparent> <media_dir>

Prints a single JSON line prefixed with RESULT_JSON: on success.
"""

import glob
import importlib.util
import json
import os
import sys

from manim import Scene, config
from manim.animation.animation import Wait
import manim as _manim

scene_file, class_name, quality, transparent, media_dir = sys.argv[1:6]

QUALITY = {
    "l": "low_quality",
    "m": "medium_quality",
    "h": "high_quality",
    "k": "fourk_quality",
}

times: list[float] = []
orig_play = Scene.play


def hooked_play(self, *args, **kwargs):
    # Wait-only plays (Scene.wait) merge into the preceding segment;
    # anything else — Animations and .animate builders alike — is a step.
    if any(not isinstance(a, Wait) for a in args):
        times.append(self.renderer.time)
    return orig_play(self, *args, **kwargs)


Scene.play = hooked_play

config.quality = QUALITY[quality]
config.transparent = transparent == "1"
config.media_dir = media_dir
config.output_file = "clip"

spec = importlib.util.spec_from_file_location("journey_scene", scene_file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
scene = getattr(module, class_name)()
scene.render()

total = scene.renderer.time
cuepoints = [round(t, 4) for t in times if t > 1e-3] + [round(total, 4)]
# Locate the rendered movie. Don't trust config.output_file after the
# render (manim mutates config); the combined file is the only movie
# outside partial_movie_files.
movies = [
    m
    for ext in ("mov", "mp4", "webm", "mkv")
    for m in glob.glob(
        os.path.join(media_dir, "videos", "**", f"*.{ext}"), recursive=True
    )
    if "partial_movie_files" not in m
]
print(
    "RESULT_JSON:"
    + json.dumps(
        {
            "cuepoints": cuepoints,
            "durationS": round(total, 4),
            "movie": movies[0],
            "manim": _manim.__version__,
        }
    )
)
