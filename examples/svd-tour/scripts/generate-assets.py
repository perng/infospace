#!/usr/bin/env python3
"""
Generate the SVD tour's media assets from real linear algebra — no stock art.

Outputs into public/assets/:
  - unit-circle-ellipse.png : A maps the unit circle to an ellipse whose
    semi-axes are the singular values (the geometric heart of SVD).
  - svd-compression.png     : truncated-SVD image compression montage.
  - svd-reconstruct.webm     : progressive rank-k reconstruction sweep.

Requires: numpy, Pillow, and ffmpeg on PATH.
Run from the example directory (examples/svd-tour/):  python3 scripts/generate-assets.py
"""

import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ASSETS = os.path.join(ROOT, "public", "assets")
FONTS = os.path.join(ROOT, "public", "fonts")
os.makedirs(ASSETS, exist_ok=True)

BG = (8, 11, 22)
INK = (238, 241, 251)
DIM = (150, 165, 205)
ACCENT = (57, 215, 255)   # holo cyan — the output / σ·u side
ACCENT2 = (255, 201, 122)  # gold — the input / v side
GRID = (40, 50, 78)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


# The bundled Inter/Cinzel fonts have no Greek or subscript glyphs, so math
# labels (σ, Σ, subscripts) use a Unicode-complete system font.
_MATH_FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"


def mathfont(size):
    return ImageFont.truetype(_MATH_FONT, size)


def arrow(draw, p0, p1, color, width=4, head=12):
    draw.line([p0, p1], fill=color, width=width)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    n = max((dx * dx + dy * dy) ** 0.5, 1e-6)
    ux, uy = dx / n, dy / n
    px, py = -uy, ux
    base = (p1[0] - ux * head, p1[1] - uy * head)
    draw.polygon(
        [p1, (base[0] + px * head * 0.6, base[1] + py * head * 0.6),
         (base[0] - px * head * 0.6, base[1] - py * head * 0.6)],
        fill=color,
    )


# ---------------------------------------------------------------------------
# Asset 1 — unit circle -> ellipse
# ---------------------------------------------------------------------------
def gen_unit_circle_ellipse():
    W, H = 1280, 720
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    title = font("cinzel-700.ttf", 38)
    lab = font("inter-600.ttf", 24)
    small = font("inter-400.ttf", 19)
    sym = mathfont(30)
    subsmall = mathfont(20)

    A = np.array([[2.0, 0.8], [0.6, 1.4]])
    U, S, Vt = np.linalg.svd(A)
    V = Vt.T

    d.text((W / 2, 36), "A matrix maps the unit circle to an ellipse",
           font=title, fill=INK, anchor="mm")
    d.text((W / 2, 80), "the semi-axes of the ellipse are the singular values  σ₁ ≥ σ₂",
           font=subsmall, fill=DIM, anchor="mm")

    panels = [(330, 410, 150), (950, 410, 150 / S[0] * 1.0)]
    # use one consistent scale so the stretch is honest
    scale = 95.0

    def to_px(cx, cy, v):
        return (cx + v[0] * scale, cy - v[1] * scale)

    # grids
    for cx, cy, _ in panels:
        for g in range(-2, 3):
            d.line([(cx + g * scale, cy - 2.4 * scale), (cx + g * scale, cy + 2.4 * scale)],
                   fill=GRID, width=1)
            d.line([(cx - 2.4 * scale, cy + g * scale), (cx + 2.4 * scale, cy + g * scale)],
                   fill=GRID, width=1)

    cxL, cyL, _ = panels[0]
    cxR, cyR, _ = panels[1]

    # left: unit circle + right singular vectors v1, v2
    theta = np.linspace(0, 2 * np.pi, 200)
    circle = np.stack([np.cos(theta), np.sin(theta)])
    d.line([to_px(cxL, cyL, circle[:, i]) for i in range(circle.shape[1])],
           fill=INK, width=3, joint="curve")
    arrow(d, (cxL, cyL), to_px(cxL, cyL, V[:, 0]), ACCENT2, 5)
    arrow(d, (cxL, cyL), to_px(cxL, cyL, V[:, 1]), ACCENT2, 5)
    d.text(to_px(cxL, cyL, V[:, 0] * 1.28), "v₁", font=sym, fill=ACCENT2, anchor="mm")
    d.text(to_px(cxL, cyL, V[:, 1] * 1.32), "v₂", font=sym, fill=ACCENT2, anchor="mm")
    d.text((cxL, cyL + 2.7 * scale), "input space  —  unit circle", font=lab, fill=DIM, anchor="mm")

    # right: ellipse (image of circle) + sigma*u axes
    ell = A @ circle
    d.line([to_px(cxR, cyR, ell[:, i]) for i in range(ell.shape[1])],
           fill=ACCENT, width=3, joint="curve")
    arrow(d, (cxR, cyR), to_px(cxR, cyR, U[:, 0] * S[0]), ACCENT, 5)
    arrow(d, (cxR, cyR), to_px(cxR, cyR, U[:, 1] * S[1]), ACCENT, 5)
    d.text(to_px(cxR, cyR, U[:, 0] * S[0] * 1.18), f"σ₁u₁", font=sym, fill=ACCENT, anchor="mm")
    d.text(to_px(cxR, cyR, U[:, 1] * S[1] * 1.32), f"σ₂u₂", font=sym, fill=ACCENT, anchor="mm")
    d.text((cxR, cyR + 2.7 * scale), "output space  —  ellipse", font=lab, fill=DIM, anchor="mm")

    # the map arrow + equation (transpose T drawn as a manual superscript,
    # since the Unicode font lacks U+1D40)
    arrow(d, (cxL + 2.9 * scale, cyL), (cxR - 2.9 * scale, cyR), INK, 5, 18)
    ecx, ecy = (cxL + cxR) / 2, cyL - 40
    eq = "A = U Σ V"
    w_eq = d.textlength(eq, font=sym)
    supT = mathfont(19)
    w_t = d.textlength("T", font=supT)
    start = ecx - (w_eq + w_t) / 2
    d.text((start, ecy), eq, font=sym, fill=INK, anchor="lm")
    d.text((start + w_eq + 1, ecy - 11), "T", font=supT, fill=INK, anchor="lm")
    d.text((ecx, ecy + 78), f"σ₁ = {S[0]:.2f}\nσ₂ = {S[1]:.2f}",
           font=subsmall, fill=DIM, anchor="mm", align="center")

    out = os.path.join(ASSETS, "unit-circle-ellipse.png")
    img.save(out)
    print("wrote", out)


# ---------------------------------------------------------------------------
# A structured synthetic grayscale "image" (a matrix) for compression demos
# ---------------------------------------------------------------------------
def source_matrix(n=240):
    img = Image.new("L", (n, n), 18)
    d = ImageDraw.Draw(img)
    # smooth radial gradient base
    yy, xx = np.mgrid[0:n, 0:n]
    cx = cy = n / 2
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (n / 2)
    base = (np.clip(1 - r, 0, 1) * 90).astype(np.uint8)
    img = Image.fromarray(base, "L")
    d = ImageDraw.Draw(img)
    # concentric rings (sharp, needs high rank)
    for rad in range(18, n // 2, 22):
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=150, width=3)
    # diagonal grid
    for k in range(-n, n, 30):
        d.line([(0, k), (n, k + n)], fill=70, width=2)
    # big title glyphs
    f = font("cinzel-700.ttf", 96)
    d.text((n / 2, n / 2), "SVD", font=f, fill=235, anchor="mm")
    return np.asarray(img, dtype=np.float64)


def reconstruct(M, k):
    U, S, Vt = np.linalg.svd(M, full_matrices=False)
    Mk = (U[:, :k] * S[:k]) @ Vt[:k]
    return np.clip(Mk, 0, 255).astype(np.uint8), S


def gen_compression():
    M = source_matrix(240)
    m, n = M.shape
    ranks = [2, 8, 24, min(m, n)]
    tiles = []
    for k in ranks:
        rec, _ = reconstruct(M, k)
        tiles.append((k, rec))

    pad, top, bottom, gap = 24, 96, 84, 24
    tw = 240
    W = pad * 2 + tw * len(tiles) + gap * (len(tiles) - 1)
    H = top + tw + bottom
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((W / 2, 36), "Image compression by truncated SVD",
           font=font("cinzel-700.ttf", 38), fill=INK, anchor="mm")
    d.text((W / 2, 70), "keep only the top-k singular values — an image is just a matrix",
           font=font("inter-400.ttf", 19), fill=DIM, anchor="mm")

    lab = font("inter-600.ttf", 22)
    small = font("inter-400.ttf", 18)
    for i, (k, rec) in enumerate(tiles):
        x = pad + i * (tw + gap)
        tile = Image.fromarray(rec, "L").convert("RGB")
        img.paste(tile, (x, top))
        d.rectangle([x, top, x + tw - 1, top + tw - 1], outline=(70, 84, 120), width=2)
        full = (k == ranks[-1])
        name = "original (full rank)" if full else f"rank {k}"
        d.text((x + tw / 2, top + tw + 22), name, font=lab,
               fill=INK if full else ACCENT, anchor="mm")
        stored = k * (m + n + 1)
        pct = 100 * stored / (m * n)
        sub = "100% of data" if full else f"{pct:.0f}% of the data"
        d.text((x + tw / 2, top + tw + 50), sub, font=small, fill=DIM, anchor="mm")

    out = os.path.join(ASSETS, "svd-compression.png")
    img.save(out)
    print("wrote", out)


def gen_reconstruct_video():
    M = source_matrix(240)
    m, n = M.shape
    U, S, Vt = np.linalg.svd(M, full_matrices=False)
    maxk = 64
    # frame width: image + side panel for the HUD/spectrum
    side = 150
    fw, fh = 240 + side, 240
    tmp = tempfile.mkdtemp(prefix="svd-frames-")
    lab = font("inter-600.ttf", 20)
    small = font("inter-400.ttf", 15)

    smax = float(S[0])
    schedule = [1] * 12 + list(range(1, maxk + 1)) + [maxk] * 18
    for fi, k in enumerate(schedule):
        Mk = np.clip((U[:, :k] * S[:k]) @ Vt[:k], 0, 255).astype(np.uint8)
        frame = Image.new("RGB", (fw, fh), BG)
        frame.paste(Image.fromarray(Mk, "L").convert("RGB"), (0, 0))
        d = ImageDraw.Draw(frame)
        px = 240 + 18
        d.text((px, 22), f"rank {k}", font=lab, fill=ACCENT, anchor="lm")
        d.text((px, 46), f"of {maxk} shown", font=small, fill=DIM, anchor="lm")
        # mini singular-value spectrum, with captured ones lit
        bx, by, bw, bh = px, 78, side - 36, 132
        for j in range(min(maxk, 40)):
            h = (S[j] / smax) * bh
            x0 = bx + j * (bw / 40)
            col = ACCENT if j < k else GRID
            d.rectangle([x0, by + bh - h, x0 + (bw / 40) * 0.7, by + bh], fill=col)
        d.text((bx, by + bh + 10), "singular values σ", font=small, fill=DIM, anchor="lt")
        frame.save(os.path.join(tmp, f"f{fi:04d}.png"))

    out = os.path.join(ASSETS, "svd-reconstruct.webm")
    if os.path.exists(out):
        os.remove(out)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-framerate", "20",
         "-i", os.path.join(tmp, "f%04d.png"),
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-b:v", "0", "-crf", "33",
         "-an", out],
        check=True,
    )
    shutil.rmtree(tmp, ignore_errors=True)
    print("wrote", out)


if __name__ == "__main__":
    gen_unit_circle_ellipse()
    gen_compression()
    gen_reconstruct_video()
    print("done")
