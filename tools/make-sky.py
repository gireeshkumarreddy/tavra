# Paints the two cloud layers for the Sport chapter's sky: transparent WebP images that sit over a
# CSS blue gradient and drift at different speeds. Run from the tavra folder:  python tools/make-sky.py
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sky')
os.makedirs(OUT, exist_ok=True)


def fbm(w, h, base, octaves, seed, gain=0.5):
    """Fractal value noise: random grids at doubling frequencies, smoothly upscaled and summed."""
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        gw, gh = max(2, int(base * 2 ** o)), max(2, int(base * 2 ** o * h / w))
        grid = Image.fromarray((rng.random((gh, gw)) * 255).astype(np.uint8))
        out += amp * np.asarray(grid.resize((w, h), Image.BICUBIC), np.float32) / 255
        total += amp
        amp *= gain
    return out / total


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def clouds(w, h, seed, base, cover, bias, soft, name):
    d = fbm(w, h, base, 6, seed, gain=0.46)
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    d = d + bias(y)                                   # where in the frame the clouds gather
    alpha = smoothstep(cover, cover + soft, d)
    # light from above: the top of each billow is bright, its underside a cool grey
    lift = np.vstack([np.repeat(d[:1], 12, axis=0), d[:-12]])   # density 12px above each pixel
    lit = np.clip((d - lift) * 26 + 0.62, 0, 1) * (0.7 + 0.3 * alpha)
    shadow = np.array([206, 216, 232], np.float32)
    light = np.array([255, 255, 255], np.float32)
    rgb = shadow + (light - shadow) * lit[..., None]
    rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').filter(ImageFilter.GaussianBlur(1.4)).save(os.path.join(OUT, name), 'WEBP', quality=82, method=6)
    print(name, f'{os.path.getsize(os.path.join(OUT, name)) / 1024:.0f} KB')


W, H = 2000, 1100
# far: small, soft puffs scattered across the open sky
clouds(W, H, 7, 5.0, 0.60, lambda y: 0.05 * np.sin(np.pi * y) - 0.04, 0.12, 'clouds-far.webp')
# near: heavy billows banked along the bottom and one corner, the way the reference frames its athlete
clouds(W, H, 21, 3.2, 0.60, lambda y: 0.42 * y ** 2.6 - 0.16, 0.07, 'clouds-near.webp')
